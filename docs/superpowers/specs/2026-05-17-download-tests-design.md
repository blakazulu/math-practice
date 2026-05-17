# Download Tests — Design Spec

**Date:** 2026-05-17
**Status:** Approved for planning
**Owner:** Liraz

## Summary

Add a "Download Tests" feature so a student, parent, or teacher can grab a printable PDF version of any topic or sample exam. PDFs are pre-generated at build time from the existing question bank and served as static files from `public/data/pdfs/`. A new icon-button in the top-right nav (on `HomePage` and `WelcomePage`) opens a modal listing all 23 downloads grouped by category.

## Goals

- Let the user download a printable PDF of any single topic or sample exam.
- Each PDF contains every question with its `א/ב/ג/ד` options, then a separate answer-key section with the correct letter and the explanation.
- No backend; no on-demand client-side PDF generation. Static files only.
- Preserve the project's visual identity (Heebo font, sprout palette, no emoji, Hebrew RTL).
- Zero runtime cost to the SPA bundle.

## Non-Goals

- No per-user custom PDFs (e.g. "only questions I got wrong"). The PDFs are global, identical for every user.
- No "download all as zip" option in v1. Single-file downloads only.
- No watermarking, no DRM, no auth on the downloads. They're public assets.
- No PDF content tests (visual diff / golden file). Once-per-build manual sanity check is sufficient.
- No new fonts beyond Heebo. No emoji in the PDFs.

## User-Facing Surface

### Entry points

1. **HomePage header nav** — add a new icon button between `StatPill`s and the existing `Dashboard` link, matching the styling of the `Dashboard` and `Settings` icon links.
2. **WelcomePage top-right corner** — same button, absolutely positioned in the top-right so it's discoverable before a user is selected.

Both buttons:
- Icon: `lucide-react` `Download` (or `FileDown`).
- `aria-label="הורדת מבחנים"`.
- Same hover/focus ring as the existing nav icons (`hover:bg-hair focus-visible:ring-2 focus-visible:ring-brand-500`).

### Modal

A center-screen modal opens on click. Mobile slides up from the bottom; desktop scales in from center. Matches the existing `CategoryModal` pattern in `HomePage.tsx` for animation and dismiss behavior (Escape, overlay click, close X).

Modal content, top to bottom:
- Title: `הורדת מבחנים`
- One-line subtitle: `בחרו נושא או מבחן לדוגמה להורדה כקובץ PDF.`
- Three category sections (in this order):
  1. **ידע מתמטי** — 9 topic rows
  2. **חשיבה והגיון** — 7 topic rows
  3. **מבחנים לדוגמה** — 7 exam rows

Each row:
- Topic/exam name (Hebrew, full name, no truncation — wraps if long, per project rule).
- Question count badge (`n שאלות`).
- Download button on the left (icon + `הורדה`). Renders as an `<a>` with `download` attribute pointing to the static PDF URL.
- If the PDF is unavailable (404 on `HEAD` probe), the row is disabled and shows `לא זמין כרגע` instead of the button. One probe per row, cached for the modal session.

The modal does NOT call any store mutation. Clicks just trigger the browser download.

## Build-Time PDF Generation

### Engine

Playwright (already installed for e2e tests). A Node script renders each test as an HTML page and uses Playwright's `page.pdf()` to print to PDF. Headless Chromium handles Hebrew RTL, KaTeX, and inline images natively.

### Inputs

- `data/questions.json` — source of truth for questions (the build product of `tools/parse_questions.py`).
- `docs/images/mapping.json` — maps `q_id` → image filename (or `image_file: null`).
- `docs/images/*.{png,jpg}` — the 44 image files.
- A vendored copy of Heebo TTF under `tools/pdf/fonts/`.
- A vendored copy of KaTeX's CSS file (the one already used by the SPA via `katex/dist/katex.min.css`).

### Output

- 23 PDFs total: 16 topics + 7 sample exams.
- Filenames use the existing URL slug from `TOPIC_URL_SLUGS`, with `/` replaced by `-`. Examples:
  - `math-knowledge-decimal-fractions.pdf`
  - `logic-reasoning-sequences.pdf`
  - `sample-exams-exam-3.pdf`
- ASCII-only filenames so Netlify URL handling and `<a download>` behave predictably.
- Written first to `tools/pdf/out/` then copied into `public/data/pdfs/` by `sync-data`.

### Per-PDF Layout

**Page 1 — Cover.**
- Sprout-palette background accent (subtle, not a full bleed).
- Topic or exam name, large.
- `n שאלות` count.
- A small `sprout-mark` SVG ornament (the same SVG family used in the app).
- Footer: app name `Math Practice`, build date.

**Pages 2..N — Questions.**
- Each question is a self-contained block. `page-break-inside: avoid` so a question doesn't split mid-options.
- Format per question:
  1. Number badge (`שאלה 1`).
  2. KaTeX math in the question text pre-rendered via `katex.renderToString` at build time.
  3. Image (if `mapping.json` resolves one) inline, max-width 80% of content width, centered.
  4. Four option rows labeled `א/ב/ג/ד`.
- No correct answer or explanation visible.

**Page N+1..end — Answer Key.**
- Starts on a fresh page. Heading: `מפתח תשובות`.
- For each question: number, correct letter, the correct answer text verbatim, then the explanation.
- Two-column-able if the layout fits, single-column if not. Don't force columns at the cost of bad line breaks.

### Styling

A hand-written `tools/pdf/print.css`:
- `@font-face` for Heebo (weights 400, 700, 900) from the local TTFs.
- `@page { size: A4; margin: 18mm; }`.
- RTL on `body`.
- 16px minimum body type (project rule).
- Sprout green `#22C55E` for headings and accents.
- No Tailwind. The SPA's compiled CSS is too noisy and contains selectors that don't apply to print.

### Math Rendering

KaTeX runs in Node at generation time. Each question's text is processed by the same logic the SPA uses in `src/lib/katex.tsx` — extract `$...$` and `$$...$$` spans, pass them through `katex.renderToString`, emit HTML. The KaTeX stylesheet is `<link>`-inlined into the rendered HTML so Chromium picks it up.

### Images

- For each question, look up `q_id` in `mapping.json`.
- If `image_file` is non-null, resolve relative to `docs/images/` and emit `<img src="file://..." />`. Playwright loads it locally — no network.
- If `image_file` is null (false positives flagged by the keyword scanner where the "image" is actually data in the question text), render nothing extra. The question still appears.
- The inheritance rule (multiple `q_id`s pointing to one image file) needs no special handling — multiple `<img>` tags can reference the same file.

### `visual-only` Questions

The 3 questions flagged `visual-only` (where the answer options are themselves images, not text) need a special render:
- Question text + image render normally.
- The four option rows show only the letter labels `א/ב/ג/ד` with no option text.
- The answer key still shows the correct letter and explanation.
- Document this in `tools/pdf/render.mjs` with a comment so future maintainers don't "fix" it.

### Determinism

- Generated PDFs should be byte-stable across runs given the same inputs. Suppress PDF metadata that includes timestamps (`tagged: false`, no `displayHeaderFooter`, no automatic creation-date). This makes diffs reviewable if we ever inspect the binary, and makes Netlify caching predictable.

## Code Structure

```
src/
  components/
    DownloadTestsButton.tsx     # icon-only <a>/<button> trigger, same shape as
                                # the existing Dashboard/Settings nav buttons
    DownloadTestsModal.tsx      # full modal: title, three category sections,
                                # row list, HEAD-probe state, close handlers
  pages/
    HomePage.tsx                # add <DownloadTestsButton onOpen={...}/> to header
    WelcomePage.tsx             # add <DownloadTestsButton onOpen={...}/> top-right
  data/
    pdfManifest.ts              # exports PDF_MANIFEST: PdfManifestEntry[]
                                # type: { slug, label_he, category, url, questionCount }
                                # hand-maintained alongside TOPIC_URL_SLUGS

tools/
  pdf/
    generate_pdfs.mjs           # entry point: reads questions.json, iterates
                                # manifest entries, calls render+print for each
    render.mjs                  # builds the HTML string for one topic/exam
    print.css                   # @page rules, RTL, Heebo, KaTeX overrides
    fonts/
      Heebo-Regular.ttf
      Heebo-Bold.ttf
      Heebo-Black.ttf
    out/                        # generated PDFs (gitignored)

scripts/
  sync-data.mjs                 # existing — extended to also copy
                                # tools/pdf/out/*.pdf into public/data/pdfs/

public/
  data/
    pdfs/                       # gitignored — populated fresh by sync-data
                                # before each dev/build run
```

### `pdfManifest.ts` shape

```ts
export interface PdfManifestEntry {
  slug: string;          // URL slug used for the filename, no leading slash
  label_he: string;      // display name in the modal
  category: "math-knowledge" | "logic-reasoning" | "sample-exams";
  url: string;           // "/data/pdfs/<slug>.pdf"
  questionCount: number; // for the row badge
}

export const PDF_MANIFEST: PdfManifestEntry[];
```

Hand-maintained, 23 entries. A vitest test verifies every entry's slug round-trips through `TOPIC_URL_SLUGS` / `topicIdFromUrl` and that every topic in `questions.json` has a matching entry.

## NPM Scripts

```jsonc
{
  "scripts": {
    // existing scripts unchanged except `build`:
    "dev": "npm run sync-data && vite",
    "build": "npm run generate-pdfs && npm run sync-data && tsc -b && vite build",
    "sync-data": "node scripts/sync-data.mjs",   // existing — extended to copy tools/pdf/out/* into public/data/pdfs/

    // new:
    "generate-pdfs": "node tools/pdf/generate_pdfs.mjs"
  }
}
```

- `dev` does NOT regenerate PDFs on each reload — uses whatever's already in `public/data/pdfs/`. Document `npm run generate-pdfs && npm run sync-data` for manual refresh during development.
- `build` regenerates PDFs every time so production is always fresh.

## Error Handling

**Modal.**
- On open, fire one `HEAD` request per row in parallel. Rows where the response is not 2xx render disabled with the text `לא זמין כרגע`.
- Cache the probe results in module-level state for the duration of the page session; reopening the modal does not re-probe.
- No retry button — this is a build-availability issue, not a transient network one.

**Build script.**
- Any KaTeX render error fails the build loudly (non-zero exit). Don't silently emit broken PDFs.
- Missing image file referenced by `mapping.json` → warn but continue (the question prints without the image).
- Missing Heebo font file → fail loudly.
- Playwright launch failure → fail loudly with the underlying message.

## Testing

**Unit (vitest).**
- `tests/unit/pdfManifest.test.ts`:
  - Every entry's slug, when split on the first `-`, maps to a valid `(category, topic)` pair via `topicIdFromUrl`.
  - Every topic in `questions.json` has exactly one manifest entry.
  - All 7 sample exams have manifest entries.
- `tests/unit/DownloadTestsModal.test.tsx`:
  - Renders three category sections.
  - Renders the expected row count per section (9 / 7 / 7).
  - Clicking a row triggers an `<a>` with the right `href` and `download` attribute.
  - When the `HEAD` probe mock returns 404, the row renders disabled.

**E2E (Playwright).**
- `tests/e2e/download-tests.spec.ts`:
  - Visit `/home` with a seeded user.
  - Click the Download button.
  - Assert the modal opens and shows 23 rows.
  - Click the first row, assert `Page.waitForDownload()` fires with a `.pdf` filename.

**No PDF content tests.** Manual sanity check after the first build is sufficient.

## Deploy

- Netlify runs `npm run build`, which now includes `generate-pdfs`. Playwright's Chromium needs to be available on the build server. Netlify's default Node image ships with Chromium-compatible deps, but if `npx playwright install chromium` is needed we add it as a `postinstall` script. **Verify on first deploy.**
- Generated PDFs land in `dist/data/pdfs/` after Vite builds. They're served at `/data/pdfs/<slug>.pdf`, same convention as `/data/questions.json`.
- `.gitignore` additions: `tools/pdf/out/`, `public/data/pdfs/`.
- One-shot manual verify on the first preview deploy: open the modal, download one PDF from each category, confirm the file opens and looks right.

## Open Questions / Risks

- **Netlify Chromium availability** — verify on first deploy. Risk: deploy fails. Mitigation: add `npx playwright install --with-deps chromium` to a `postinstall` script if missing.
- **PDF file size** — 16 topic PDFs + 7 exam PDFs, each with embedded fonts and images. Rough estimate: 200 KB–1 MB per PDF; total 5–20 MB. Acceptable. If it grows, we can subset Heebo to the glyphs actually used by Hebrew + digits.
- **Filename ASCII guarantee** — every existing slug in `TOPIC_URL_SLUGS` is already ASCII-only, but the test in `pdfManifest.test.ts` explicitly asserts this to prevent regressions if a future topic is added with Hebrew in its slug.
- **`visual-only` answer key** — three questions only. The answer key entry will show the correct letter and the explanation. A reader looking only at the answer key without flipping back to the question won't see what option `ב` referred to visually. Acceptable for v1; if users complain, we'd render small thumbnails of each option in the answer key for those three questions.

## Visual Identity Compliance

- No emoji anywhere in the modal or the PDFs.
- Heebo type system throughout.
- Sprout green `#22C55E` accent; `text-ink` / `text-muted` for body and secondary text.
- 16px minimum body size.
- Hebrew RTL throughout.
- All icons sourced from `lucide-react`.
