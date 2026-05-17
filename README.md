# חשבונייה — Math Practice

A two-part project for kids prepping for the **גיל מוכשר במתמטיקה** (Gifted in Math) program entrance exam for 7th grade:

1. **A curated question bank** — 497 questions across 23 topics in 3 categories, sourced from [yuni.co.il](https://yuni.co.il/) and cleaned/validated into `data/questions.json`.
2. **A Hebrew RTL web app** (this directory's `src/`) that lets kids drill the bank by topic or run full mock exams, with per-user progress in localStorage.

## Quickstart (web app)

```bash
npm install
npm run sync-data    # copy data/*.json + docs/images/ into public/data/
npm run dev          # http://localhost:5173
```

### Scripts

| Script | What |
| ------ | ---- |
| `npm run dev` | Start Vite dev server (auto-syncs data first) |
| `npm run build` | Type-check + bundle to `dist/` |
| `npm run preview` | Serve the built bundle locally |
| `npm test` | Run unit + component tests (Vitest, 38 tests) |
| `npm run test:watch` | Vitest in watch mode |
| `npm run test:e2e` | Playwright happy-path E2E (run `npx playwright install chromium` once) |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |
| `npm run sync-data` | Refresh `public/data/` from `data/` + `docs/images/` |

### Deployment

Static build → drop `dist/` on any host. `public/_redirects` is included for Netlify SPA fallback. The GitHub Actions workflow at `.github/workflows/deploy.yml` builds and publishes to GitHub Pages on push to `main`.

### Adding images for image-dependent questions

1. Add the image to `docs/images/<name>.png`.
2. Edit `docs/images/mapping.json` to point the relevant `q_id`(s) to that file.
3. `npm run sync-data && npm run build`.

Multiple questions can share the same image (follow-up chains) — set their `image_file` to the same path.

### Architecture

- **Routing:** BrowserRouter (clean URLs). Netlify rewrites `/*` to `/index.html` via `public/_redirects`.
- **State:** Zustand with three slices — `bank` (in-mem, loaded JSON), `users` (persisted localStorage with versioned schema), `session` (in-mem practice/exam state).
- **Styling:** Tailwind + Heebo, all design tokens defined in `tailwind.config.ts`.
- **Icons:** lucide-react only — no emoji anywhere in the UI.
- **Math:** KaTeX rendering inline `\(...\)` from question text.

See `docs/superpowers/specs/2026-05-17-math-practice-app-design.md` for the full design.

---

## Question bank

### Source

**[moodle.yuni.co.il](https://moodle.yuni.co.il/course/view.php?id=4)** — Moodle platform for the "התוכניות לנוער מוכשר במתמטיקה" program, course "ערכת תרגול לבחינת הקבלה - עולים לשכבה ז'".

The real entrance exam has two sections:
- **פרק א'** — ידע מתמטי (arithmetic, fractions, geometry, data)
- **פרק ב'** — חשיבה והגיון (factoring, sequences, combinatorics, spatial reasoning)

### Structure

The corpus lives in `data/db/` organized by category:

```
data/db/
├── 01_ידע_מתמטי/          ← 9 topics, 189 questions
│   ├── 01_שברים_עשרוניים.md
│   ├── 02_שברים_פשוטים.md
│   ├── 03_אחוזים.md
│   ├── 04_רב_שלבי.md
│   ├── 05_גאומטריה.md
│   ├── 06_חקר_נתונים.md
│   ├── 07_יחס.md
│   ├── 08_הספק.md
│   └── 09_ממוצע.md
│
├── 02_חשיבה_והגיון/        ← 7 topics, 140 questions
│   ├── 01_פירוק_לגורמים.md
│   ├── 02_פעולה_מומצאת.md
│   ├── 03_אמת_ושקר.md
│   ├── 04_סדרות.md
│   ├── 05_תנועה.md
│   ├── 06_קומבינטוריקה.md
│   └── 07_חשיבה_מרחבית.md
│
└── 03_מבחנים_לדוגמה/       ← 7 full sample exams, 168 questions
    ├── 01_מבחן_לדוגמה_1.md
    ├── 02_מבחן_לדוגמה_2.md
    ├── 03_מבחן_לדוגמה_3.md
    ├── 04_מבחן_לדוגמה_4.md
    ├── 05_מבחן_לדוגמה_5.md
    ├── 06_מבחן_לדוגמה_6.md
    └── 07_מבחן_לדוגמה_7.md
```

**Total: 23 files, 497 questions** — exported to `data/questions.json` for app consumption via `tools/parse_questions.py`.

### Question schema (markdown source)

Each question has:

```markdown
## שאלה N ✅/❌/⬜

**שאלה:**
[text, possibly with LaTeX in \( ... \)]

**אפשרויות:**
א. ...
ב. ...
ג. ...
ד. ...

**התשובה הנכונה: [answer]**

**הסבר:**
[detailed explanation with calculations]
```

The status emoji is ignored by the app (it was unreliable in the original source).

### Quality notes

- 6 questions have content flags in the JSON (`visual-only` × 3, `three-option` × 2, `missing-explanation` × 1). The app filters unanswerable ones from practice/exam queues.
- 73 questions reference images/graphs originally hosted as Moodle pluginfiles. These have been sourced into `docs/images/` and mapped via `docs/images/mapping.json` (32 direct images, 35 inherited via follow-up chains, 6 confirmed false positives needing no image).
- LaTeX expressions use inline `\( ... \)`. Rendered by KaTeX in the app.

### Tools

`tools/` contains Python scripts used to build the bank:
- `parse_questions.py` — parse the markdown source and emit `data/questions.json`
- `fix_splits.py` — repair extraction artifacts (stray `\n\n` mid-token)
- `find_image_questions.py` — heuristic detection of image-dependent questions
- `list_image_questions.py` — emit a human-readable triage doc

Run any of them with `python tools/<name>.py`. They have no external dependencies.
