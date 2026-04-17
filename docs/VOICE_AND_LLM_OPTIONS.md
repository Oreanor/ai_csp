# Speech (STT/TTS) and text LLMs: options with a Portuguese and cost focus

A short PoC guide: what is cheaper, what to try for free, why **Portuguese speech recognition** is often harder, and how that splits from **answer generation** and **read-aloud**.

## What this repository implements today

- **LLM:** `POST /api/llm/complete` → **Gemini** when `GEMINI_API_KEY` is set, otherwise stub (`docs/BACKEND.md`).
- **STT:** browser → Next **`/api/stt/transcribe`** → external service (localhost `127.0.0.1:8001` by default; in the cloud set **`STT_SERVICE_URL`** — see `docs/STT_LOCAL_DEV.md`, `docs/DEPLOY_VERCEL.md`).
- **TTS:** new candidate lines read aloud via **Web Speech API** in the browser (no separate cloud TTS in this PoC).

## Why Portuguese (PT) in speech is harder

- **Two major standards**: Brazilian (pt-BR) and European (pt-PT) — different phonetics, lexicon, intonation. A generic “Portuguese” model without region often yields mixed quality.
- **Accent and noise**: laptop/phone mic, echo, background speech — WER rises faster than for English in the same conditions.
- **Split responsibilities**: **recognition** (STT) quality and **dialogue** (LLM) quality are different services; improving one does not replace the other.

In practice: pick **pt-BR** or **pt-PT** explicitly in the product, run **your** recordings (2–5 min of interview) through a shortlist of STT engines, and judge WER/subjectively — do not rely only on “supports PT”.

---

## Speech → text (STT), especially Portuguese

### Free / almost free (for experiments)

| Approach | Pros | Cons |
|----------|------|------|
| **Whisper large-v3 locally** (`faster-whisper`, `whisper.cpp`, Python/CLI) | No per-minute fee; strong **multilingual** baseline, broad PT exposure in training data | Needs CPU/GPU and a pipeline; **not classic streaming**; latency on long files |
| **Whisper in the cloud** (OpenAI API, Azure batch, etc.) | Less hardware fuss | Paid per minute after free credits; file limits |
| **Browser Web Speech API** | No API keys | Quality/languages **depend on browser/OS**; PT often weaker than cloud |

A sensible start is **local Whisper** on real interviewer/candidate phrases (BR vs PT explicit in language settings).

### Relatively cheap cloud STT (often better PT than “raw” browser)

- **Google Cloud Speech-to-Text** (incl. Chirp / long models) — broad language coverage; often on enterprise shortlists.
- **Microsoft Azure AI Speech** — streaming, custom vocabulary, good Microsoft stack fit; often preferred for **real-time** vs batch Whisper.
- **Deepgram, AssemblyAI** — convenient streaming APIs, competitive pricing; verify PT on your data.
- **OpenAI Whisper API** — predictable API, per-minute billing.

Public benchmarks (Soniox et al., 2025) show **language rankings jump**: for **Portuguese**, one report had **Soniox / AssemblyAI / Speechmatics / Whisper** strong; **Google** showed high WER for PT in that same table — **do not trust a single number**; test **your** scenario.

**Takeaway for PT and budget:** a reasonable PoC path is **local Whisper** plus one **cloud** candidate (Google or Azure) on the **same** audio.

---

## Text → answer (LLM) for interviews

Here the UI language is **text**; PT “breaks” less often than in STT if the model knows pt-BR/pt-PT in the prompt.

### Free / cheap to start

| Option | Comment |
|--------|---------|
| **Google AI Studio (Gemini API)** | Generous **free** tier for prototypes (RPM/TPM limits and data policy — read current terms). Good fit for **Flash**-class models. |
| **Groq** | **No card** on free tier; very fast inference for **Llama** / some open models; TPM/RPM limits — enough for dev. |
| **Ollama (local)** | **$0** per token, pay electricity/hardware only; OpenAI-compatible endpoint on `localhost`. Good for offline and tests without cloud. |
| **OpenAI** | **No permanent free tier**; for savings use **gpt-4o-mini** and tight `max_tokens`. |

For “cheaper in the cloud” after PoC: **Gemini Flash**, **GPT-4o-mini**, small models on **Groq** — usually cheaper than “flagships” with acceptable quality for short interview lines.

---

## Text → speech (TTS) for the candidate

| Tier | Options |
|------|---------|
| **Free / offline** | **Piper** (light neural TTS, voices for many languages); system **speechSynthesis** in the browser — free but “robot” quality. |
| **Cheap cloud** | **Azure Neural**, **Google Cloud Text-to-Speech**, **Amazon Polly** — low price per million characters vs “premium” studio voices. |
| **More expensive, expressive** | **ElevenLabs** and similar — often better emotion/naturalness; limited free tier then paid. |

For PT again: **voice and TTS language model** should match **pt-BR** or **pt-PT**.

### Control: male/female, timbre, speed, EN + PT minimum

Below is vendor-agnostic guidance. **Timbre** in the cloud is usually **voice name** (each has its own character); **speed** is an API parameter or **SSML** (`<prosody rate="slow">`, etc.); **gender** is explicit *Male/Female* pairs in the catalog.

| Option | Rough cost | M/F, “timbre” | Speed | EN + PT (and BR vs PT) |
|--------|------------|---------------|-------|-------------------------|
| **Web Speech API** (`speechSynthesis`) | Free, no keys | Depends on **OS/browser**: `voices` often gives several EN and 1–2 PT; gender only if the OS exposes distinct voices | `SpeechSynthesisUtterance.rate` (sometimes `pitch`) — coarse but usable | PT often **pt-BR**; **pt-PT** may be missing or weak — validate on target machines |
| **Piper** (local) | Free, your hardware | Separate **voice models** per language; Piper catalogs often have M/F pairs for popular langs | Speed via external pipeline (e.g. resample) or engine settings, not “one slider” like cloud | Packages for **en** and **pt-BR**; **pt-PT** — check community availability |
| **Microsoft Azure AI Speech (neural TTS)** | Per-character; Microsoft sometimes offers **starter credits** | Large **neural** catalog with gender labels; “timbre” = pick a name (Joana, Duarte, …) | API `speaking rate`, SSML `prosody` | **en-US / en-GB**, **pt-BR**, **pt-PT** — explicit voices, product-friendly |
| **Google Cloud Text-to-Speech** | Paid; trial/credits per Google policy | Many **neural** voices; gender/style by voice name | `speakingRate`, `pitch` in API; SSML if needed | **en**, **pt-BR**, **pt-PT** in catalog — verify current Neural2 / Studio list |
| **Amazon Polly** | Paid; AWS free tier time-bounded | Neural / Generative prefixed voices; gender from voice description | **SSML** `<prosody rate="x%">`, etc. | **en** and **pt-BR** (e.g. Camila, Ricardo); **pt-PT** — verify catalog |
| **ElevenLabs** (and similar “studio” products) | Mostly paid; sometimes small free tier | Voices/clones, strong “character”; gender = pick a preset | Stability/speed in UI/API — product-specific | **EN** strong; **PT** only if voice/model explicitly supports; often EN-first |

**For predictable sliders** (speed, language, M/F pair, two Portuguese standards) teams often shortlist **Azure** or **Google**. For **zero budget** in a prototype — **browser TTS** (fast in UI) plus **Piper** offline if you need stable offline mode without a **zoo of different voices** across laptops.

---

## How to assemble a production pipeline

1. **STT:** pick one local (Whisper) + one cloud → measure on **pt-BR** recordings.  
2. **LLM:** `LlmClient` in this repo — start with **Gemini** or **Groq** (cheap/free for dev).  
3. **TTS:** separate client (do not conflate with LLM); start with **Piper** or **cloud neural** with explicit `pt-BR`; for “product-like” sliders see the table above (Azure / Google).

Prices and free-tier limits change — validate against official pricing and ToS before you commit.

---

**See also:** `docs/DEPLOY_VERCEL.md` (environment variables and STT in the cloud), `docs/BACKEND.md`, `docs/STT_LOCAL_DEV.md`.
