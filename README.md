# AI Candidate (PoC)

Next.js workspace for a simulated interview: virtual candidates, chat, optional speech-to-text, and Gemini-backed replies when configured.

**Version** is read from `package.json` at build time (`src/lib/app-version.ts`) and shown in the disclaimer modal title.

## Changelog (high level)

### 0.2.0

- **LLM:** Google Gemini when `GEMINI_API_KEY` is set in `.env.local`; otherwise the completion route uses a stub (`docs/BACKEND.md`). Safer handling for blocked/empty Gemini responses and stricter JSON on `/api/llm/complete`.
- **STT:** Browser recording → `POST /api/stt/transcribe` (optional local Whisper-style service, `docs/STT_LOCAL_DEV.md`). For cloud deploys set **`STT_SERVICE_URL`** (`docs/DEPLOY_VERCEL.md`).
- **Interview session:** Start / Pause / Resume / Stop controls; reply controls and auto-read are tied to session state; **Test mic & input** tries STT/typing without saving to the transcript.
- **Candidate system prompt:** Default reply language follows UI (EN/PT); an explicit interviewer request for another language overrides it; brevity rules for trivial / one-phrase questions; extrovert/ambivert tone must not inflate length; format caps override persona warmth (`src/lib/interview/interview-llm.ts`).
- **UI:** Chat starts empty; transcript panel framed; CV upload uses custom button copy; compact Cancel during STT / LLM wait.

### 0.1.0

- Initial PoC: three-column layout (candidates, stage + chat, profile), EN/PT UI, demo personas, JSON-backed user stub, layout-only sessions/history/settings, orientation text in the disclaimer (stack, mocks, roadmap).

More detail on voice/LLM cost orientation: `docs/VOICE_AND_LLM_OPTIONS.md`.

## How the stack fits together

| Piece | Where it runs | What it does |
|-------|----------------|---------------|
| **Browser** | Your machine | Interview UI, Web Speech (read-aloud), `fetch` to same-origin `/api/*`. |
| **Next.js dev server** | Local `:3000` (or Vercel in production) | Serves the app and **Route Handlers**: `POST /api/llm/complete`, `POST /api/stt/transcribe`, demo `GET/POST /api/users`. |
| **Gemini (optional)** | **Remote** (Google) | Used only when `GEMINI_API_KEY` is set; otherwise the server uses a **stub** LLM (no network). |
| **STT (optional)** | **Local** by default at `http://127.0.0.1:8001` | Python **FastAPI + faster-whisper** in `stt-service/`. Next proxies the browser upload to `STT_SERVICE_URL/transcribe`. In production, `STT_SERVICE_URL` must point to a **reachable** HTTPS service (see `docs/DEPLOY_VERCEL.md`). |
| **TTS** | **Browser only** | `speechSynthesis` — no separate server. |

Nothing in this PoC **must** run remotely for local dev except Gemini when you want real model replies. STT is optional until you press the mic (or use “Test mic & input”).

## Getting started (step by step)

### Prerequisites

- **Node.js** 20+ (matches typical Next 16 expectations).
- **npm** (comes with Node).
- For **microphone → text**: **Python 3.10+**, **ffmpeg** on `PATH`, and disk space for the Whisper **small** model (downloaded on first transcription).
- Optional: **Google AI Studio** API key for non-stub replies.

### 1) Install Node dependencies

```bash
npm install
```

### 2) Optional — Gemini

Create `.env.local` in the repo root:

```env
GEMINI_API_KEY=your_key_here
# optional:
# GEMINI_MODEL=gemini-2.5-flash
```

Without this file (or without the key), candidate replies still work via the **stub** client.

### 3) Run everything locally (one command)

From the repo root, after `npm install`:

```bash
npm run start:local
```

This runs **`scripts/start-local.mjs`**, which:

1. Creates `stt-service/.venv` and `pip install -r stt-service/requirements.txt` **on first run** (can take several minutes).
2. Starts **Whisper STT** on `http://127.0.0.1:8001`.
3. Starts **Next.js** on `http://localhost:3000`.

Stop with **Ctrl+C** (stops Next and the STT child process).

**Windows:** you can also double‑click or run `.\scripts\start-local.ps1` (same behaviour).

**Next only** (no Python / no mic pipeline):

```bash
npm run start:local:no-stt
# or
npm run dev
```

### 4) Manual alternative (two terminals)

If you prefer not to use the script:

**Terminal A — STT**

```bash
cd stt-service
python -m venv .venv
# Windows: .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
python -m uvicorn main:app --host 127.0.0.1 --port 8001
```

**Terminal B — Next**

```bash
npm run dev
```

Details and troubleshooting: `docs/STT_LOCAL_DEV.md`.

### 5) Open the app

[http://localhost:3000](http://localhost:3000) — start an **interview session** (or **Test mic & input**) before using the mic; see the in-app Disclaimer / Profile session notes.

### Production build (check)

```bash
npm run build
```

## Docs

| Doc | Topic |
|-----|--------|
| `docs/BACKEND.md` | API routes, users JSON store, LLM client wiring |
| `docs/STT_LOCAL_DEV.md` | Local STT service for `/api/stt/transcribe` |
| `docs/DEPLOY_VERCEL.md` | Vercel deploy: env vars, STT upstream, limits |
| `docs/VOICE_AND_LLM_OPTIONS.md` | STT / LLM / TTS options and rough cost notes |
| `docs/ENGINEERING_RULES.md` | Repo structure, i18n, styling conventions |
| `docs/CODE_QUALITY_REVIEW.md` | Senior-level code quality / risk assessment (PoC scope) |

## Stack

Next.js (App Router), React 19, next-intl (EN/PT), Tailwind v4, Base UI primitives, theme toggle. See `AGENTS.md` / `CLAUDE.md` for agent rules.
