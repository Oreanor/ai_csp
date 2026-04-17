# Code quality review — AI Candidate PoC

**Role:** senior tech lead assessment  
**Scope:** `src/` application and API layer, tooling, docs (not vendor `node_modules`).  
**Verdict:** **solid PoC / internal pilot quality** — appropriate for demos and controlled pilots; **not** production-hardened without the gaps below being addressed.

---

## Executive summary

The codebase is **coherent**, **typed (strict TypeScript)**, and **aligned with documented PoC boundaries**. UI concerns (i18n, layout tokens, feature placement) are handled with discipline rare in throwaway demos. The main gaps are **absence of automated tests**, **open unauthenticated APIs** (including LLM proxy cost/abuse surface), **no observability contract** beyond `console.error`, and **operational fragility** of JSON file storage + local STT defaults for serverless deploys — all of which are **acknowledged in docs** but remain technical debt if the product moves forward.

---

## Strengths

| Area | Observation |
|------|----------------|
| **Architecture** | Clear split: `src/features/` for flows, `src/components/` for reusable UI, thin `src/app/api/**` handlers — matches stated engineering rules. |
| **Type safety** | `strict: true` in `tsconfig.json`; server LLM/users layers use explicit types and narrow parsing (`parseLlmCompletionBody`, user DTOs). |
| **Resilience (recent)** | LLM route validates non-empty string output; Gemini path tolerates blocked/empty SDK responses with fallbacks; client parses completion JSON defensively. |
| **UX / i18n** | User-facing strings centralized in `en.json` / `pt.json`; session and mic-test behaviour documented in UI copy and README. |
| **Developer experience** | `npm run start:local` orchestrates STT + Next; `README` + `docs/` map backend, STT, and Vercel constraints. |
| **Lint baseline** | `eslint-config-next` (core-web-vitals + typescript); very few suppressions in sampled code. |

---

## Risks and technical debt

| Item | Severity | Notes |
|------|----------|--------|
| **No automated tests** | **High** for product growth | No `*.test.ts` / e2e found. Regressions in interview session, LLM client, or API contracts will be caught late. |
| **Public API surface** | **High** if deployed wide | `/api/llm/complete` and `/api/stt/transcribe` are unauthenticated — cost, abuse, and data exfiltration (prompt content) risk. PoC-acceptable behind VPN; not for open internet. |
| **JsonUserRepository** | **Medium** on serverless | Documented; concurrent writes and ephemeral FS on platforms like Vercel make it unsuitable for production users API. |
| **Singleton LLM client** | **Low** | `getLlmClient()` caches instance — fine for serverless cold starts; env change at runtime without redeploy is not reflected until process recycle (expected). |
| **Client error propagation** | **Low** | Interview send path rethrows after setting UI error (control bar restores draft) — acceptable; watch for duplicate logging / unhandled rejection patterns if refactors add callers. |
| **STT proxy** | **Medium** | Forwards arbitrary audio to configured URL — ensure `STT_SERVICE_URL` is trusted; consider size limits and timeouts at route level. |

---

## Security (honest PoC level)

- **Secrets:** Gemini key server-side only — good. No obvious key leakage in client bundles from reviewed patterns.
- **Missing:** authn/z on APIs, rate limiting, request size caps on STT, audit logging of prompts, CSP hardening review (not audited here).
- **Dependency supply chain:** standard npm + Google SDK — routine `npm audit` / Dependabot hygiene applies.

---

## Performance and operations

- **LLM:** Long prompts + history may approach **serverless time limits** on cheap hosting; documented in `DEPLOY_VERCEL.md`.
- **STT:** First Whisper inference downloads model — cold start UX; CPU inference latency acceptable for PoC, not for “instant” UX without tuning.
- **Observability:** `console.error` in routes — insufficient for production triage; no request id, no structured logging, no metrics.

---

## Recommendations (prioritized)

### P0 — before any public or multi-tenant deploy

1. **Protect or remove** open `/api/llm/complete` and `/api/stt/transcribe` (API key header, Vercel OIDC, IP allowlist, or move behind BFF with session auth).
2. **Replace** JSON user store if `/api/users` is used in prod.
3. **Define** max body size + timeout on STT proxy route.

### P1 — before calling it “beta”

1. **Tests:** unit tests for `parseLlmCompletionBody`, session reducer, `interviewMessagesToLlm`; contract test for `POST /api/llm/complete` with stub; one Playwright smoke (session + send + stub response).
2. **Structured errors** to client (stable `code` field) for i18n-friendly messages.
3. **`maxDuration`** (or equivalent) on LLM route where platform supports it.

### P2 — quality of life

1. **Zod** (or similar) shared schemas for API bodies and optional OpenAPI snippet.
2. **CI:** `npm run lint` + `npm run build` + tests on every PR.
3. **Pre-commit** optional: format/lint-staged.

---

## Scoring (relative to stated PoC goals)

| Dimension | Score | Comment |
|-----------|-------|---------|
| Maintainability | **8/10** | Clear structure and docs; tests missing. |
| Correctness / safety | **6.5/10** | Good parsing and recent LLM hardening; open APIs drag score down for “real” deploy. |
| Security | **5/10** | Appropriate for internal PoC; insufficient alone for public prod. |
| Operability | **7/10** | Good local story; prod STT/env documented. |
| **Overall (PoC)** | **7/10** | **Would approve** for stakeholder demos and internal iteration; **would block** a wide public launch without P0 items. |

---

## Closing (TL voice)

The team has shipped a **readable, teachable codebase** with intentional boundaries. The next investment should not be “more features” but **tests + API hardening + operational baseline** — that is the line between a convincing PoC and something finance and security can sign off.

*Review basis: static analysis, repo layout, docs, representative API and feature paths; not a full security audit or performance benchmark.*
