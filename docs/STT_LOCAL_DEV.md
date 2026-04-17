# Local Whisper STT (dev)

This project exposes `POST /api/stt/transcribe` as a **proxy** route. The browser sends audio to Next; Next forwards to your STT service.

The upstream service must implement:

- `POST <STT_SERVICE_URL>/transcribe` (default origin `http://127.0.0.1:8001` in development)
- `multipart/form-data` with:
  - `audio` (file, typically `audio/webm`)
  - `language`: **`auto`** | **`en`** | **`pt`**
- JSON response:
  - success: `{ "text": "..." }`
  - error: `{ "error": "..." }` (or FastAPI-style `{ "detail": "..." }`)

## Production / Vercel

On **Vercel**, `127.0.0.1` is not your laptop. Set **`STT_SERVICE_URL`** in the project environment variables to the **public HTTPS origin** of the same API (no path; trailing slash is stripped). Deploy the Python service separately (Railway, Cloud Run, Fly.io, etc.). See **`docs/DEPLOY_VERCEL.md`**.

## 1) Prerequisites

- Python 3.10+
- ffmpeg in PATH

## 2) Start local Whisper service

**Shortcut (from repo root):** `npm run start:local` — creates the venv if needed, installs `stt-service/requirements.txt`, runs uvicorn and Next together (`scripts/start-local.mjs`).

**Manual:**

```powershell
cd stt-service
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Create `stt-service/main.py`:

```python
from fastapi import FastAPI, UploadFile, File, Form
from faster_whisper import WhisperModel
import tempfile, os

app = FastAPI()
model = WhisperModel("small", device="cpu", compute_type="int8")

@app.post("/transcribe")
async def transcribe(
    audio: UploadFile = File(...),
    language: str = Form("auto"),
):
    with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as tmp:
        tmp.write(await audio.read())
        path = tmp.name
    try:
        lang = None if language in ("auto", "") else language
        segments, info = model.transcribe(path, language=lang, vad_filter=True)
        text = " ".join(s.text.strip() for s in segments).strip()
        return {"text": text, "language": info.language}
    finally:
        os.remove(path)
```

Run it:

```powershell
uvicorn main:app --host 127.0.0.1 --port 8001 --reload
```

## 3) Optional env override

By default, Next.js route uses `http://127.0.0.1:8001`.
To change it, set in `.env.local`:

```env
STT_SERVICE_URL=http://127.0.0.1:8001
```

## 4) Test in app

- Start Next.js app and open the interview page.
- **Start session** or **Test mic & input** so the mic control is enabled; then use the mic in the control bar.
- Speak, then stop recording; transcribed text is appended to the message field (Send only posts to the transcript when a session is **running** and you are not in mic test mode).
