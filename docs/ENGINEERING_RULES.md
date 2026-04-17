# Engineering rules — AI Candidate (PoC)

These rules keep the codebase maintainable as the PoC grows into a product.

## Architecture

1. **Feature slices** — UI flows live under `src/features/<feature>/`. Route files (`src/app/**`) stay thin: compose providers and feature entry components only.
2. **Presentational components** — Reusable building blocks under `src/components/<domain>/` (e.g. `interview/`). Generic primitives stay in `src/components/ui/` (shadcn).
3. **No magic strings in UI** — All user-visible copy comes from `src/messages/<locale>.json` via `next-intl` (`useTranslations`, etc.).
4. **Types** — Shared shapes in `src/types/`. Avoid duplicating the same interface across files.
5. **Data & fixtures** — Mock lists and seed content in `src/data/`. Keep them easy to swap for API responses later.

## Internationalization (en / pt)

1. **Two concerns** — (a) **UI locale** — interface language; (b) **conversation language** — language of simulated interview content. They are independent.
2. **Adding copy** — Add keys to **both** `en.json` and `pt.json` under the same path. Keep key namespaces stable (`App`, `Header`, `Interview`, …).
3. **Locale persistence** — UI locale is stored in `localStorage` (see `UI_LOCALE_STORAGE_KEY`). Document any change to that contract.
4. **Other persisted UI** — Interview auto-read-aloud uses `INTERVIEW_AUTO_TTS_STORAGE_KEY` in `src/lib/constants/storage-keys.ts` (`"1"` / `"0"`). Changing the key resets the default for existing browsers.

## Deployment

1. **Vercel / cloud** — Serverless-friendly routes live under `src/app/api/**`. Do not rely on writable JSON for production users; external STT needs `STT_SERVICE_URL`. See **`docs/DEPLOY_VERCEL.md`** and **`docs/BACKEND.md`**.

## Styling & theming

1. **Design tokens** — Prefer shadcn semantic tokens (`bg-card`, `text-muted-foreground`, `border-border`). Brand accents use `brand`, `brand-muted`, `brand-foreground` from `globals.css`.
2. **Light / dark** — Use `next-themes` with `attribute="class"`. Never hardcode colors that break in dark mode without a paired dark rule.
3. **Layout surfaces** — Shared layout class strings live in `src/lib/workspace/surfaces.ts` to avoid one-off divergences.

## Components (shadcn)

1. **Extend, don’t fork** — Customize via `className` + `cn()`. Regenerate from the registry when upgrading rather than copying stale primitives.
2. **Accessibility** — Preserve Radix/Base UI semantics: labels for icon-only controls, dialog titles, sheet titles (use `sr-only` when the UI has no visible title).

## Quality bar

1. **Run checks before push** — `npm run lint` and `npm run build`.
2. **Hooks** — Extract reusable browser logic (e.g. `matchMedia`) into `src/hooks/`.
3. **Utils** — Small pure helpers in `src/lib/utils/`. Keep them testable and side-effect free.

## Next.js in this repo

Follow `AGENTS.md`: this project may use Next.js APIs that differ from older docs — verify behaviour in `node_modules/next/dist/docs/` when unsure.
