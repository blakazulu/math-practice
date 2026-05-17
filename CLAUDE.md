# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project shape

This is a **two-tier project** with no backend:

1. **A curated question bank** at `data/` — Hebrew math questions sourced from `yuni.co.il`, normalized into `data/questions.json` by Python scripts in `tools/`. The markdown source under `data/db/` is the source of truth; the JSON is regenerated from it.
2. **A React/Vite SPA** at `src/` and `public/` that consumes that JSON and lets kids drill the bank by topic or run mock exams. Entirely client-side, progress in `localStorage`.

The boundary between the two: `npm run sync-data` (auto-runs before `dev` and `build`) copies `data/questions.json`, `data/image_dependent_questions.json`, `docs/images/mapping.json`, and every file in `docs/images/` into `public/data/`. The app fetches those at boot. Edits to the source bank only reach the app via this sync step.

## Commands

```bash
# Dev / build
npm run dev              # Vite dev server at :5173 (auto-syncs data first)
npm run build            # tsc -b && vite build → dist/
npm run preview          # serve the built bundle
npm run sync-data        # refresh public/data/ from data/ + docs/images/

# Tests
npm test                                                   # all 38 vitest tests
npx vitest run tests/unit/streak.test.ts                  # one file
npx vitest run -t "applyStreak"                           # by name pattern
npx vitest                                                 # watch mode
npm run test:e2e                                          # Playwright (run `npx playwright install chromium` once)

# Lint / format
npm run lint
npm run format

# Python tools (no deps; rebuild the bank from data/db/*.md)
PYTHONIOENCODING=utf-8 python tools/parse_questions.py    # → data/questions.json + report
PYTHONIOENCODING=utf-8 python tools/parse_questions.py --report  # report only, no write
python tools/find_image_questions.py                       # → data/image_dependent_questions.json
python tools/list_image_questions.py                       # → docs/image_dependent_questions.md
python tools/fix_splits.py                                 # one-shot repair of stray \n\n artifacts
```

Windows note: Python scripts need `PYTHONIOENCODING=utf-8` to print Hebrew; without it the console crashes on encoding errors.

## State architecture

Single Zustand store at `src/store/index.ts` composed of three slices:

| Slice | Persistence | Purpose |
|-------|-------------|---------|
| `bank` (`bankSlice.ts`) | in-memory | Loaded `questions.json` + image index/mapping. Builds `_questionMap: Map<QuestionId, RawQuestion>` and `_imageReady: Set<QuestionId>` once for O(1) lookup. |
| `users` (`usersSlice.ts`) | `localStorage["math-practice:v1"]` | All user state: roster, active user, per-question/topic progress, exam history, stats, review queue. |
| `session` (`sessionSlice.ts`) | in-memory only (lost on refresh) | Active practice/review/exam session — current index, attempts, hints, picks. |

Every mutation in `usersSlice` calls `persist()` which writes the entire `PersistRoot`. `hydrate()` runs **synchronously at module load** (`src/app/App.tsx`) to avoid flashing the welcome screen for returning users.

## Practice vs exam — record paths

There are two answer-recording entry points, used by **different flows** — picking the wrong one breaks gamification:

- `recordAnswer(...)` (practice/review) — awards stars on first-try correct, flips `firstTryCorrect`, updates topic aggregates, manages review queue.
- `recordExamAnswer(...)` (exam only) — increments `totalAnswered` and runs streak math, but **does not** award stars or touch `firstTryCorrect`. Exam mode has no "first try" concept (one pick per question, lock).

`ExamPage.finalize()` has a `useRef` re-entry guard — it writes ~25 setStates in a row, which would otherwise invalidate its `useCallback` deps and re-fire the effect that called it, looping until React bails.

## Routing & URL slugs

- BrowserRouter (clean URLs), not HashRouter. Netlify SPA fallback via `public/_redirects` (`/* /index.html 200`).
- Internal `TopicId` is the Hebrew composite `<hebrewDir>/<hebrewSlug>` (e.g. `01_ידע_מתמטי/שברים_עשרוניים`) — that's what shows up in `questions.json`.
- URLs use ASCII slugs (e.g. `/practice/math-knowledge/decimal-fractions`). The bidirectional map is `TOPIC_URL_SLUGS` in `src/data/types.ts`; convert with `urlFromTopicId()` / `topicIdFromUrl(cat, topic)`.
- Routes are split as `:cat/:topic` so neither half contains a `/` or Hebrew. If you add a new category or topic, **add it to `TOPIC_URL_SLUGS`** or its URL will fall back to the raw Hebrew.

## Image-dependent questions

73 of the 497 questions originally referenced images that aren't in the markdown text. The current state:

- `docs/images/` holds 44 PNG/JPG files.
- `docs/images/mapping.json` maps each of the 73 `q_id`s to one of: a direct image, a parent's image (follow-up chains share visuals), or `image_file: null` (6 confirmed false positives — flagged by the keyword scanner but no actual image exists).
- At runtime, `bankSlice.needsImage(id)` returns `true` only when the question is in the dependency list **and** no image is mapped yet. The 6 false positives correctly render without the "תמונה תתווסף בקרוב" placeholder.

Adding a new image: drop the file in `docs/images/`, edit `mapping.json` to point the relevant `q_id`(s) at its filename, then `npm run sync-data && npm run build`.

## Question queue filtering

`bankSlice.isUnanswerable(id)` filters questions from practice/exam/review queues if they:
- Have flag `visual-only` (3 questions with no text options),
- Have `correct_letter: null` (rare edge case),
- Don't exist in the bank.

Always filter through this when building a queue. Don't reach into the raw arrays.

## Visual identity (mandatory)

The user has **two strict preferences** captured in `memory/`:

1. **No emoji or emoticons anywhere in the UI** — not in copy, not in motivational messages, not in placeholder states. SVG icons only, sourced from `lucide-react`.
2. **Sprout palette + Heebo type system** — green primary `#22C55E` plus the warn/danger/ink/muted scale defined in `tailwind.config.ts`. Single typeface (Heebo, weights 300–900). All design tokens live there; don't introduce new hues without checking.

Additional rules baked into the styles:

- **16px minimum font size everywhere**. `src/styles/index.css` overrides Tailwind's `text-xs` and `text-sm` to render at 16px. The only exception is `.section-label` (uppercase + tracking gives small-caps feel at 16px).
- Hebrew RTL is set at `<html dir="rtl">`. KaTeX math is forced LTR in CSS so inline expressions render correctly inside RTL paragraphs.

## Source-of-truth data flow

```
data/db/**/*.md         (Hebrew markdown, hand-curated)
   │
   │ tools/parse_questions.py
   ▼
data/questions.json     (497 questions, single source for the app)
   │
   │ npm run sync-data
   ▼
public/data/questions.json   (served at /data/questions.json)
   │
   │ fetch() in bankSlice.loadBank
   ▼
in-memory questionMap   (consumed by all UI)
```

Edits to question content go in the markdown. Then re-run `parse_questions.py` (which validates structure and reports anomalies). Don't hand-edit `data/questions.json` — it'll get clobbered.

## Deploy

Target is Netlify. Base directory `/`, build command `npm run build`, publish directory `dist`. The `public/_redirects` file is the SPA fallback. No CI workflow — Netlify watches the repo directly and rebuilds on push.

## Recent reference docs

- Full design spec: `docs/superpowers/specs/2026-05-17-math-practice-app-design.md`
- Original implementation plan: `docs/superpowers/plans/2026-05-17-math-practice-app.md`
- Image-question triage doc (human-readable, 78 KB): `docs/image_dependent_questions.md`
- Project memory directory: `C:\Users\liraz\.claude\projects\D--Code-My-Stuff-math-practice\memory\`
