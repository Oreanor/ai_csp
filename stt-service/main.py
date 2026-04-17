from fastapi import FastAPI, UploadFile, File, Form
from faster_whisper import WhisperModel
import tempfile, os

app = FastAPI()
model = WhisperModel("small", device="cpu", compute_type="int8")

def _whisper_language(code: str) -> str | None:
    """None = Whisper auto-detect (works for many languages)."""
    if code == "auto" or not code.strip():
        return None
    if code in ("en", "pt"):
        return code
    return None


@app.post("/transcribe")
async def transcribe(
    audio: UploadFile = File(...),
    language: str = Form("auto"),
):
    with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as tmp:
        tmp.write(await audio.read())
        path = tmp.name
    try:
        whisper_lang = _whisper_language(language)
        segments, info = model.transcribe(path, language=whisper_lang, vad_filter=True)
        text = " ".join(s.text.strip() for s in segments).strip()
        return {"text": text, "language": info.language}
    finally:
        os.remove(path)
