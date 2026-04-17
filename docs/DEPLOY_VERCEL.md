# Deploying on Vercel

This app is a **Next.js 16** project. The interview UI, **`POST /api/llm/complete`**, and **`POST /api/stt/transcribe`** (proxy) run as **Vercel Serverless Functions** in the same deployment.

## What works out of the box

- Static pages and the interview client.
- **`/api/llm/complete`**: set **`GEMINI_API_KEY`** in the Vercel project → **Environment Variables** (Production / Preview). Without it, the app uses **`StubLlmClient`** (demo placeholder text).
- **`GEMINI_MODEL`**: optional; defaults to `gemini-2.5-flash` when unset.

## What needs extra setup

### Speech-to-text (STT)

The Next route **`/api/stt/transcribe`** forwards `multipart/form-data` to an upstream service. By default it targets **`http://127.0.0.1:8001`**, which is **not reachable from Vercel’s cloud**.

1. Run your Python STT service (e.g. FastAPI + Whisper) on **Railway, Render, Fly.io, Google Cloud Run**, or another host with a **public HTTPS URL**.
2. In Vercel, set **`STT_SERVICE_URL`** to the **origin only** (no trailing slash), e.g. `https://your-stt.example.com`. The app appends **`/transcribe`**.
3. Ensure CORS is not required for **server-to-server** calls (the browser talks to your Next domain; Next calls STT from the server).

See **`docs/STT_LOCAL_DEV.md`** for the local contract (`audio` file, `language`: `auto` | `en` | `pt`, JSON `{ "text": "..." }`).

### Users API (`/api/users`)

**`JsonUserRepository`** reads/writes **`data/users.json`**. That pattern is **not reliable on Vercel** (ephemeral filesystem, concurrent writes). The interview PoC **does not depend** on this API in the main UI; treat it as **dev-only** until you plug in a real database and change **`getUserRepository()`** in `src/lib/server/users/instance.ts`.

### Timeouts and payload size

- Long Gemini calls can hit the **serverless execution limit** on lower tiers (~10s on Hobby). Consider a shorter **`maxOutputTokens`** or upgrading the plan / setting **`maxDuration`** on the route where supported.
- Large audio uploads for STT may hit **request body size** limits—keep clips reasonable for pilots.

## Environment variables (checklist)

| Variable | Required | Purpose |
|----------|----------|---------|
| `GEMINI_API_KEY` | No* | Real model via `GeminiLlmClient`. *Required for non-stub replies. |
| `GEMINI_MODEL` | No | Override default Gemini model id. |
| `STT_SERVICE_URL` | For voice input in production | Upstream STT origin (default local dev URL is useless on Vercel). |
| `USERS_STORE_PATH` | Rarely | Custom path for JSON user store (dev / special layouts only). |

## Related docs

- **`docs/BACKEND.md`** — API map, LLM factory, users repository.
- **`docs/STT_LOCAL_DEV.md`** — local Whisper service and env override.
- **`docs/VOICE_AND_LLM_OPTIONS.md`** — vendor and cost orientation.
