# Backend: layout and next steps

A short map for developers wiring a real database, LLM, and production environment. The project remains a **PoC**: user data lives in a **JSON file** (demo API), and model replies are **Gemini when a key is set**, otherwise a **stub**.

## Current stack

- **Next.js 16** (App Router): HTTP via **Route Handlers** in `src/app/api/**`.
- **Data layer** — no ORM in the PoC; the user repository is a **JSON file** (`data/users.json`).
- **LLM** — `LlmClient`: with **`GEMINI_API_KEY`** → **Google Gemini** (`GeminiLlmClient`), otherwise **`StubLlmClient`**.
- **STT** — `POST /api/stt/transcribe` proxies to a transcription service (**`STT_SERVICE_URL`**, localhost by default in dev).
- **Interview workspace settings** — `GET` / `PUT /api/interview/settings`; PoC store is **`data/interview-settings.json`** (override path with **`INTERVIEW_SETTINGS_PATH`**).

## Directory map

| Path | Role |
|------|------|
| `src/app/api/users/route.ts` | `GET` list, `POST` create user |
| `src/app/api/users/[id]/route.ts` | `GET` / `PATCH` / `DELETE` by `id` |
| `src/app/api/llm/complete/route.ts` | `POST` chat completion to `LlmClient` (JSON `{ text, finishReason? }` or `{ error }`) |
| `src/app/api/llm/info/route.ts` | `GET` provider mode (stub / gemini) without secrets |
| `src/app/api/stt/transcribe/route.ts` | `POST` `multipart/form-data` → upstream `/transcribe` |
| `src/app/api/interview/settings/route.ts` | `GET` / `PUT` workspace prompt (`baseSystemPrompt`) in JSON file |
| `src/lib/server/users/` | Users: contract, JSON implementation, validation, factory |
| `src/lib/server/llm/` | LLM: types, contract, stub, body parser, factory |
| `src/lib/server/index.ts` | Re-exports public server API |
| `src/types/user.ts` | `User` type and create/update DTOs |
| `data/users.json` | Current user store (array of objects) |

Handlers stay **thin**: parse body, call repository / `getLlmClient()`, map errors to HTTP.

## `UserRepository` contract

File: `src/lib/server/users/repository.ts`

Expected methods:

- `list()` — all users (sorted by creation time in the JSON implementation).
- `getById(id)` — `null` if missing.
- `create({ email, name })` — email uniqueness (trim + lowercase for comparison).
- `update(id, patch)` — partial `email` / `name`; same uniqueness rules.
- `delete(id)` — idempotency not required: missing id → `UserRepositoryNotFoundError`.

Default implementation: **`JsonUserRepository`** (`json-user-repository.ts`) — reads/writes the whole array to a file. **Not suitable** for production (write races, read-only FS on many serverless hosts).

Factory: **`getUserRepository()`** in `instance.ts`.

- Env **`USERS_STORE_PATH`** — absolute or relative path to the JSON file (if you keep file mode for dev).
- To move to a DB: add e.g. `PrismaUserRepository` (or Drizzle), implement the same interface, and **swap the singleton** in `getUserRepository()` (or branch the factory on `NODE_ENV` / env).

HTTP mapping errors already exist: `ValidationError` (400), `UserRepositoryNotFoundError` (404), `UserRepositoryConflictError` (409).

## `LlmClient` contract

File: `src/lib/server/llm/llm-client.ts`

- Method: `complete(input: LlmCompletionInput): Promise<LlmCompletionOutput>`.
- Input: `messages` (`role`: `system` | `user` | `assistant`, `content`), optional `temperature`, `maxOutputTokens`.
- Output: `text`, optional `finishReason`.

Factory: **`getLlmClient()`** in `llm/instance.ts`.

- If **`GEMINI_API_KEY`** is set ([Google AI Studio](https://aistudio.google.com/) key, free tier), **`GeminiLlmClient`** is used (`gemini-2.5-flash` or **`GEMINI_MODEL`**).
- Otherwise **`StubLlmClient`** (echo-style placeholder).

Body parsing for `POST /api/llm/complete`: `src/lib/server/llm/parse-completion-body.ts`. Empty or invalid model text is returned as **502** with `{ "error": "..." }` so the client never gets a “success” with empty `text`.

Streaming is not in scope for the PoC — extend via a separate method or route if needed.

## Vercel deployment (summary)

Briefly: Next.js and **`/api/llm/*`** on Vercel behave as usual; set **`GEMINI_API_KEY`** in the project settings. **Python Whisper does not run inside the same serverless bundle** — run STT separately and set **`STT_SERVICE_URL`**. Writing **`data/users.json`** on serverless is not viable for production.

Checklist and limits: **`docs/DEPLOY_VERCEL.md`**.

## Example requests (curl)

```bash
# List users
curl -s http://localhost:3000/api/users

# Create
curl -s -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"dev@example.com\",\"name\":\"Dev User\"}"

# Update
curl -s -X PATCH http://localhost:3000/api/users/<id> \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"New Name\"}"

# LLM (stub without key)
curl -s -X POST http://localhost:3000/api/llm/complete \
  -H "Content-Type: application/json" \
  -d "{\"messages\":[{\"role\":\"user\",\"content\":\"Hello\"}]}"

# Interview workspace settings (base system prompt)
curl -s http://localhost:3000/api/interview/settings
curl -s -X PUT http://localhost:3000/api/interview/settings \
  -H "Content-Type: application/json" \
  -d "{\"baseSystemPrompt\":\"Keep answers under three sentences unless asked for more.\"}"
```

## Backend engineer checklist

1. **Database** — choose Postgres/MySQL/etc., schema aligned with `src/types/user.ts`, index on email.
2. **Repository** — new class implementing `UserRepository`; wire in `getUserRepository()`; migrations (Prisma/Drizzle/Flyway).
3. **JSON** — decide if a dev-only fallback is needed; gate `JsonUserRepository` behind env if so.
4. **LLM** — other providers (OpenAI, etc.): new `LlmClient`, limits, logging, timeouts; without a key keep `StubLlmClient`.
5. **Auth** — APIs are open today; add sessions/JWT/API keys in routes or middleware.
6. **Validation** — as schemas grow, consider Zod/OpenAPI; today manual parsers in `users/validation.ts` and `llm/parse-completion-body.ts`.
7. **Deploy** — do not rely on writable JSON on read-only disks; on Vercel use external DB and **`STT_SERVICE_URL`**. See `docs/DEPLOY_VERCEL.md`.

## Related docs

Repository conventions: `docs/ENGINEERING_RULES.md`.  
Local Whisper STT: `docs/STT_LOCAL_DEV.md`.  
Vercel (env, STT, limits): `docs/DEPLOY_VERCEL.md`.
