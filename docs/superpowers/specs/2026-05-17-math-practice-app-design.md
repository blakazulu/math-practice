# Math Practice App — Design

**Status:** Approved
**Date:** 2026-05-17
**Author:** brainstormed with user

A kid-targeted Hebrew web app for practicing the entrance-exam question bank curated in this repository (497 questions across 23 topics, 3 categories). The app runs entirely client-side; progress is persisted per-user in `localStorage`.

---

## 1. Goals

1. **A 6th-grader prepping for the gifted-program entrance exam** can sit down, pick a topic, and drill questions with 3 tries each.
2. **The same kid** can later switch to "mock exam" mode and run a full 24-question simulation matching the real exam's format.
3. **Multiple kids** can use the same install (siblings, study buddies) with isolated progress, accessed by a typed username — no auth.
4. **The app feels mature**, not childish — the kids in scope (11-12) reject primary-color "kid" UI per researched UX (NN/G, UXmatters).
5. **Works offline-capable** on phone, tablet, laptop, desktop — fully responsive Hebrew RTL.

**Non-goals (v1):**
- Cloud sync / accounts / login.
- Server-side anything. No backend, no analytics, no telemetry.
- Authoring tools (editing the question bank from inside the app).
- Mid-session resume after page refresh.

---

## 2. Tech stack

| Concern        | Choice                                     | Notes |
| -------------- | ------------------------------------------ | ----- |
| Build          | Vite 5 + React 18 + TypeScript 5           | Static output |
| Routing        | react-router-dom v6 with `HashRouter`      | Works on any static host without server rewrites |
| State          | Zustand 4                                  | One store, slices for `users`, `progress`, `session` |
| Styling        | Tailwind CSS v3 + `tailwindcss-rtl` plugin | All design tokens defined in `tailwind.config.ts` from the Sprout palette |
| Fonts          | Heebo from Google Fonts (300/400/500/600/700/800/900) | Single family covers all needs |
| Icons          | `lucide-react`                             | SVG only; **no emoji anywhere** |
| Math rendering | KaTeX + `react-katex`                      | Inline `\(...\)` from question text |
| Animation      | `framer-motion`                            | Used sparingly: right/wrong feedback, streak burst |
| Tests          | Vitest + React Testing Library + Playwright | Unit + integration + 1-2 E2E flows |

Build target: ES2020. Browsers: last 2 Chrome/Firefox/Safari/Edge + iOS Safari 15+.

**Deployment:** Static `dist/` output. Default target is GitHub Pages (one workflow file). Drop-in compatible with Netlify, Vercel, or a USB stick.

---

## 3. Visual identity — "Sprout"

Picked from four researched directions; rationale lives in `memory/project_visual_identity.md`.

### 3.1 Color tokens (Tailwind config)

```ts
// tailwind.config.ts — extend.colors
{
  brand: {
    50:  '#F0FDF4',   // mint surface
    100: '#DCFCE7',   // icon backplate
    200: '#BBF7D0',   // borders on tinted surfaces
    400: '#4ADE80',
    500: '#22C55E',   // PRIMARY — CTAs, active state
    600: '#16A34A',   // primary border, hover
    700: '#15803D',   // pressed/shadow
    900: '#14532D',
  },
  ink:    '#0F1A14',   // primary text
  muted:  '#6B7280',   // secondary text
  faint:  '#9CA3AF',   // captions, counts
  hair:   '#F3F4F6',   // row dividers
  border: '#E5E7EB',   // card borders
  surface:'#F9FAFB',   // subtle background tint for unselected cards
  warn: {
    50:  '#FEFCE8',    // star pill background
    700: '#A16207',    // star text
  },
  danger: {
    50:  '#FEF2F2',    // streak/error pill background
    600: '#DC2626',    // streak/error text
  },
}
```

White (`#FFFFFF`) is the canonical page background. `surface` (`#F9FAFB`) is used for unselected mode cards and inactive states.

### 3.2 Typography

- Single family: **Heebo** (`font-family: 'Heebo', system-ui, sans-serif`).
- Hero/display headings: weight 900, letter-spacing `-0.02em`. Apply gradient text-fill to the emphasized phrase only:
  ```css
  background: linear-gradient(90deg, #16A34A 0%, #22C55E 100%);
  -webkit-background-clip: text; background-clip: text;
  -webkit-text-fill-color: transparent;
  ```
- Section labels (uppercase): `text-xs`, `tracking-[0.09em]`, weight 700, color `brand.600`.
- Body: weight 400/500.
- Counts and meta: weight 500, color `faint`.
- Math is inline KaTeX; the math font is Latin Modern shipped by KaTeX, untouched.

### 3.3 Iconography

`lucide-react` only. The starting icon list (extend as needed):
`Star`, `Flame`, `BookOpen`, `Calendar`, `Target`, `Check`, `X`, `ChevronLeft`, `ChevronRight`, `RotateCcw`, `Settings`, `User`, `UserPlus`, `Lightbulb`, `Clock`, `Flag`, `Trophy`.

**No emoji anywhere** — not in question text rendering, not in motivational copy, not in error states. If we want a visual flourish, it's an inline SVG or a Lucide icon.

### 3.4 Layout & RTL

- `<html dir="rtl" lang="he">`.
- Tailwind config enables `tailwindcss-rtl` plugin so `start-*` / `end-*` utilities resolve correctly.
- KaTeX expressions are LTR islands inside RTL text — KaTeX handles this natively; no extra wrapping needed.
- Hebrew quotation in code/strings uses straight quotes; in copy uses Hebrew gershayim where appropriate.

### 3.5 Spacing & elevation

- Card radius: `rounded-2xl` (16 px) for surfaces, `rounded-xl` (12 px) for buttons.
- Borders: 1 px `border-border`. No shadows on resting surfaces.
- Primary CTAs get a subtle drop-shadow that mimics depth: `box-shadow: 0 4px 0 brand.700` plus a -2 px `translateY` to fake a button-press. On press, shadow becomes `0 2px 0 brand.700` and `translateY(0)`.

---

## 4. Data model

### 4.1 Static question data (build-time)

Both JSON files are copied from the repo root into the Vite app's `public/data/` at scaffold time (or symlinked during dev):

- `public/data/questions.json` — the existing 497-question dataset (mirror of `data/questions.json` in this repo).
- `public/data/image_dependent_questions.json` — the 73 questions that need visuals (mirror of `data/image_dependent_questions.json`).

At bootstrap the app does one `fetch('/data/questions.json')` (HashRouter-relative) and one for the image list, then loads both into Zustand's `bank` slice. The app reads from this slice but never writes back.

A small npm script (`npm run sync-data`) copies the source JSON files into `public/data/`, so editing the corpus in this repo and re-running it is the entire data-update workflow.

### 4.2 Per-user runtime state

Persisted to `localStorage` under a single versioned root key.

```ts
// localStorage key: "math-practice:v1"
interface PersistRoot {
  version: 1;
  activeUserId: string | null;
  users: Record<UserId, UserState>;
}

interface UserState {
  id: UserId;                       // slug derived from name on creation
  name: string;                     // display name as the kid typed it
  createdAt: number;
  progress: {
    questions: Record<QuestionId, QuestionProgress>;
    topics: Record<TopicId, TopicProgress>;
    exams: ExamAttempt[];
    stats: UserStats;
    reviewQueue: QuestionId[];      // FIFO; deduped on enqueue
  };
}

interface QuestionProgress {
  attempts: 0 | 1 | 2 | 3;
  firstTryCorrect: boolean;
  mastered: boolean;                // true if got it right within 3 tries
  lastSeen: number;
  inReviewQueue: boolean;
}

interface TopicProgress {
  attempted: number;                // distinct questions touched
  mastered: number;                 // distinct questions got right ≤3 tries
  totalQuestions: number;           // copied from data for fast offline reads
}

interface ExamAttempt {
  examId: string;                   // e.g. "מבחן_לדוגמה_1"
  takenAt: number;
  durationSec: number;
  timerEnabled: boolean;
  score: number;                    // count correct
  total: number;
  answers: Record<QuestionId, { picked: 'א'|'ב'|'ג'|'ד'|null; correct: boolean; flagged: boolean }>;
}

interface UserStats {
  totalAnswered: number;            // every attempt counts
  starsEarned: number;              // first-try correct = 1 star
  currentStreakDays: number;
  longestStreakDays: number;
  lastActiveDate: string;           // "YYYY-MM-DD" in local TZ
  todayCount: number;               // reset at midnight local
}
```

### 4.3 State runtime (Zustand store)

One store, three slices:

| Slice     | Persisted? | Purpose |
| --------- | ---------- | ------- |
| `bank`    | No (in-mem) | The loaded questions.json + image-dependent index |
| `users`   | Yes        | Roster, active user, all per-user progress |
| `session` | No          | Active practice/exam session — current question index, picked answers in this session, timer state, hint level |

Selectors expose derived data (topic completion %, sorted topic list with progress) so components don't recompute on every render.

### 4.4 Schema versioning

`PersistRoot.version` is `1`. On load, if the stored version is older, we run a synchronous migration; if it's *newer* than the running code knows about, we display a friendly error and refuse to clobber.

If `localStorage` is corrupted or unparseable, we surface a recoverable error (kid sees "התחלה מחדש" — start fresh). We **never silently drop** user data.

### 4.5 Streak calculation

Dates are computed in the *device's local timezone* using `Intl.DateTimeFormat`. We tolerate clock drift / DST quirks — if the device clock jumps, the streak may also jump; this is acceptable for v1. The streak resets on any gap of more than one calendar day.

On every question-answered event:

```
today := YYYY-MM-DD in user's local TZ
last  := stats.lastActiveDate

if today === last:
   no change to streak; stats.todayCount += 1
else if today is exactly last + 1 day:
   stats.currentStreakDays += 1
   stats.todayCount = 1
else:
   stats.currentStreakDays = 1
   stats.todayCount = 1

stats.longestStreakDays = max(stats.longestStreakDays, currentStreakDays)
stats.lastActiveDate = today
```

---

## 5. Screens & navigation

Route map (HashRouter):

| Path                              | Screen |
| --------------------------------- | ------ |
| `/`                               | Boot/redirect (no active user → `/welcome`, else `/home`) |
| `/welcome`                        | User picker + create-user |
| `/home`                           | Greeting, mode picker, topic-progress list, review-queue pill |
| `/practice/:topicId`              | Topic-practice session |
| `/practice/:topicId/results`      | Practice session summary |
| `/review`                         | Drill the wrong-answer queue |
| `/exam`                           | Mock-exam picker + timer toggle |
| `/exam/:examId`                   | Mock exam in progress |
| `/exam/:examId/results`           | Mock-exam results + review |
| `/settings`                       | User management, reset, about |

### 5.1 Topic practice flow

1. From `/home`, kid taps a topic → app navigates to `/practice/:topicId`.
2. App builds the session: filter the topic's questions (currently include image-dependent ones with a placeholder until images land — see §6), shuffle, materialize into `session.queue`.
3. Render question card: question text (with KaTeX), 4 option cards as a 2x2 grid, 3-dot tries indicator at top.
4. Kid taps an option:
   - **Correct** → option card turns green with check icon, brief explanation slides in, "next →" button enabled. `firstTryCorrect = (attempts === 0)`; star awarded if so. `mastered = true`.
   - **Wrong** → option card shakes briefly and turns red, attempt counter decrements one dot. Hint surface expands beneath the question with the explanation's first sentence (try 1) or more of it (try 2). After try 3, the full explanation reveals, correct answer is highlighted, question is added to `reviewQueue`, "next →" appears.
5. "next →" → next question. End of queue → `/practice/:topicId/results`.
6. Kid can leave mid-session via top-left "←" — session is dropped (not persisted).

### 5.2 Mock exam flow

1. `/exam` lists the 7 sample exams. Each row shows last attempt's score if any.
2. Kid picks an exam, toggles timer (default ON, 60 min countdown), taps "התחל".
3. `/exam/:examId` layout:
   - Main: current question, 4 options as cards (no instant feedback during exam).
   - Sidebar (desktop) / bottom drawer (mobile): 24-square grid. Squares are: ⬜ unanswered / ⬛ answered / ⚑ flagged. Tap any to jump.
   - Top bar: timer (if enabled) + "סיים מבחן" button (with confirm dialog).
4. Kid can revisit/change any answer until "סיים מבחן" or timer hits 0.
5. On submit: write `ExamAttempt`, push wrong answers to review queue (deduped), navigate to results.
6. `/exam/:examId/results`: score header, per-category breakdown (פרק א' vs פרק ב' counts), total time, then a scrollable list of all 24 questions with kid's pick / correct / explanation collapsible.

### 5.3 Review queue flow

1. Home shows a pill "X שאלות לחזרה" only when `reviewQueue.length > 0`.
2. Tapping it → `/review`, which runs the same UI as topic practice but pulls from `reviewQueue` in order.
3. When a kid answers a review question correctly on the **first try**, it's removed from the queue. Otherwise it stays.

### 5.4 User management flow

- First app open: `localStorage` is empty → `/welcome` shows "מה השם שלך?" with a single text input and a "התחל" button. On submit, generate `UserId` by lowercasing, NFC-normalizing, replacing whitespace with `-`, and stripping anything that isn't a Hebrew letter / Latin alphanumeric / hyphen. If the resulting id already exists, append `-2`, `-3`, … until unique. The display name (with original Hebrew/casing/whitespace) is preserved in `UserState.name`.
- Subsequent visits: `/` redirects to `/home` if `activeUserId` resolves to a valid user.
- "החלפת משתמש" link in the corner navigates to `/welcome` showing avatar circles for existing users + an "+ הוסף משתמש" tile.
- Settings → "אפס התקדמות" offers two options: per-topic clear or full reset for the current user. Both surface a confirm dialog. Deleting a user entirely also lives here.

---

## 6. Image-dependent question handling

Status: **deferred** — user is sourcing 40-50 unique visuals (~73 questions in total, including follow-up chains). The app must work in three states:

### 6.1 Data model for visuals

Extend each affected entry in `image_dependent_questions.json` to optionally carry an image path:

```jsonc
{
  "q_id": "01_ידע_מתמטי/חקר_נתונים/1",
  // ... existing fields ...
  "image": "questions/01_yeda/heker_nehutonim/1.png",    // optional
  "image_alt": "גרף עמודות של צופים לפי שעה"             // optional alt text
}
```

The images themselves live at `public/data/questions/...` and ship as static assets.

### 6.2 Three render states

| State                          | Behavior |
| ------------------------------ | -------- |
| Question has no image dependency | Render normally (current 424 questions). |
| Question is image-dependent, image **present** | Render the image above the question text, max-width 100%, lazy-loaded. |
| Question is image-dependent, image **absent** | Render question text + a polite skeleton box that says "תמונה תתווסף בקרוב". Kid can still try to answer, OR tap "דלג" to skip. Skipped questions count as "seen but not attempted." |

### 6.3 Visual-only questions

3 questions in the bank (flagged `visual-only` in `questions.json`) have *no* text options — options were drawings. Until images land, these are hidden from the practice/exam queue entirely. Once images land, options become images too and the option cards become 2x2 image tiles.

### 6.4 v1 launch posture

The app **launches without images**. Image-dependent (non-visual-only) questions show the "תמונה תתווסף בקרוב" placeholder plus a prominent "דלג" (skip) button. If the kid attempts the question anyway, the attempt counts normally — they just may not be able to answer correctly without the visual. Visual-only questions (no text options) are filtered out of the queue entirely until images land.

Once images are sourced, dropping them into `public/data/questions/...` and adding `image` / `image_alt` fields to `image_dependent_questions.json` is enough — the app picks them up on next reload. No code change, no migration.

---

## 7. Gamification

Light touch — three signals on the home page and within sessions:

| Signal      | When earned                                   | UI placement |
| ----------- | --------------------------------------------- | ------------ |
| ⭐ Star     | Answer a question correctly on first try     | Animated star icon flies up briefly + top-right counter ticks |
| 🔥 Streak  | One question answered on a calendar day      | Streak pill on home; days roll over per §4.5 |
| Today's count | Per-day questions answered                 | Subtle counter on home |

That's it. No badges, levels, leaderboards, or unlocks in v1.

---

## 8. Hint system

After a wrong try in topic-practice (and review-queue) mode only — **never in mock exam**.

```
attempts === 1 (one try used, two left):
  hint = first sentence of the explanation (split on period)
attempts === 2 (two tries used, one left):
  hint = first two sentences of the explanation
attempts === 3 (out of tries):
  hint = full explanation + correct answer highlighted
```

Hints render in a subtle yellow-tinted card (`bg-warn-50`, `text-warn-700`) with a `Lightbulb` icon. The card height-animates in so options don't jump.

---

## 9. Component architecture

Top-level routes are pages; pages compose a small library of shared components.

```
src/
  app/
    App.tsx              ← router shell, font load, dir="rtl" set
    routes.tsx
  pages/
    WelcomePage.tsx
    HomePage.tsx
    PracticePage.tsx
    PracticeResultsPage.tsx
    ReviewPage.tsx
    ExamPickerPage.tsx
    ExamPage.tsx
    ExamResultsPage.tsx
    SettingsPage.tsx
  components/
    QuestionCard.tsx       ← question text + KaTeX rendering
    OptionGrid.tsx         ← 2x2 multi-choice; emits picked letter
    TriesIndicator.tsx     ← three-dot remaining-tries pip
    HintCard.tsx           ← yellow-tinted expandable hint
    ExplanationCard.tsx
    TopicCard.tsx          ← used on home + picker
    ModeCard.tsx           ← practice vs exam tiles
    StatPill.tsx           ← star / streak / today's count
    ExamGrid.tsx           ← 24-square nav grid
    ExamTimer.tsx          ← countdown component
    Confirm.tsx            ← shared confirm dialog
    PageHeader.tsx
  store/
    index.ts               ← Zustand setup with persist middleware
    bankSlice.ts
    usersSlice.ts
    sessionSlice.ts
    migrations.ts
  lib/
    katex.ts               ← inline-math renderer wrapper
    streak.ts              ← streak calc (pure)
    shuffle.ts             ← seedable shuffle (for testability)
    storage.ts             ← localStorage read/write with error handling
    date.ts                ← TZ-aware date helpers
  data/
    types.ts               ← shared types matching this doc
  styles/
    index.css              ← tailwind directives + global RTL
public/
  data/
    questions.json
    image_dependent_questions.json
    questions/             ← image assets when sourced
```

---

## 10. Testing strategy

| Layer    | What                                                              | Tooling |
| -------- | ----------------------------------------------------------------- | ------- |
| Unit     | streak.ts, shuffle.ts, migrations.ts, storage.ts, selectors        | Vitest |
| Component | OptionGrid, TriesIndicator, HintCard, ExamGrid, QuestionCard       | Vitest + RTL |
| Flow      | Practice flow (pick → answer wrong → hint → answer right → next), exam flow (start → answer → flag → submit → results) | Vitest + RTL |
| E2E       | First-time user creation + one practice session + one mock exam   | Playwright (1 spec) |

CI: GitHub Actions runs `npm run test` and `npm run build` on push. Lint via ESLint + Prettier. No deploy automation in v1 (manual deploy from `dist/`).

---

## 11. Accessibility

- All interactive elements are real `<button>` / `<a>` — never click-handlers on `<div>`.
- Focus visible: `focus-visible:ring-2 ring-brand-500 ring-offset-2`.
- Color is never the only signal: correct/wrong also uses icons (Check/X) and copy.
- Tabbable order is logical: question → option 1 → 2 → 3 → 4 → action.
- KaTeX produces accessible MathML alongside the visual rendering.
- Contrast: all body/heading text passes WCAG AA against its background (≥4.5:1 for body, ≥3:1 for large headings).

---

## 12. Out of scope (v1)

- Cloud sync, user accounts, social features.
- Authoring/editing questions in-app.
- Resuming a mid-session exam after refresh.
- Spaced repetition beyond the simple wrong-answer queue.
- A "topic mastery %" meter (skipped per user preference).
- A "today's goal" or daily challenge.
- Sound effects.
- Hebrew/English toggle.

---

## 13. Open questions

1. **Brand name.** I used "חשבונייה" as a placeholder in mockups. User to confirm or replace before launch.
2. **Hosting target.** Default plan is GitHub Pages. If user wants Netlify or a custom domain, the deploy workflow needs a tweak.
3. **Image asset format.** PNG is fine for charts/diagrams; SVG preferred for line art if user can produce it. Decide when first image is sourced.

---

## 14. Implementation order (preview)

1. Project scaffold (Vite + React + TS + Tailwind + Heebo + lucide + KaTeX wired up, "Hello נועה" rendering RTL with palette).
2. Data layer (load JSON, types, Zustand store, persist middleware, schema-versioned migration scaffold).
3. User management (Welcome page, create/switch/delete users, settings page).
4. Topic practice flow (home → topic → question → tries → hints → results).
5. Mock exam flow (picker → exam with grid sidebar → timer → results).
6. Review queue.
7. Gamification UI (stars, streak, today's count + streak calc).
8. Image-dependent placeholder behavior.
9. Polish pass: responsive layout, framer-motion micro-animations, focus states, error states.
10. E2E test + first deploy.

Each step is a green commit (build + test pass).
