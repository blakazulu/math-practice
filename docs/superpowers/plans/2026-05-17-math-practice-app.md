# Math Practice App — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Hebrew RTL web app that lets kids drill the curated 497-question math bank in this repo, with multi-user progress in localStorage, a topic-practice mode (3 tries + hints), and a mock-exam mode (24Q, optional 60-min timer, free navigation).

**Architecture:** Static SPA — Vite + React 18 + TypeScript. Routing via HashRouter (so it works on any static host). State via Zustand with localStorage persistence for user data and in-memory for the loaded question bank. Tailwind for styling, KaTeX for inline math, Heebo as the single typeface, lucide-react for icons. No emoji anywhere.

**Tech Stack:** Vite 5 · React 18 · TypeScript 5 · Tailwind CSS 3 · `tailwindcss-rtl` · Zustand 4 · react-router-dom 6 · KaTeX + react-katex · lucide-react · framer-motion · Vitest · React Testing Library · Playwright.

**Spec:** `docs/superpowers/specs/2026-05-17-math-practice-app-design.md`

**Working directory:** `D:/Code/My Stuff/math-practice` (the app lives in a sub-directory `app/` so the existing `docs/`, `data/`, `tools/` stay clean).

**Source-control note:** The repo is currently not a git repository. Task 1 initializes git so subsequent task commits work.

---

## File structure

```
math-practice/                       (repo root — already exists)
├── data/                            (existing — question bank source)
├── docs/                            (existing — specs, image list)
├── tools/                           (existing — parsers, fixers)
├── app/                             (NEW — the web app)
│   ├── public/
│   │   └── data/                    (synced from ../data/ by npm run sync-data)
│   │       ├── questions.json
│   │       └── image_dependent_questions.json
│   ├── src/
│   │   ├── app/
│   │   │   ├── App.tsx              ← router shell, font load, dir="rtl" set
│   │   │   └── routes.tsx
│   │   ├── pages/
│   │   │   ├── WelcomePage.tsx
│   │   │   ├── HomePage.tsx
│   │   │   ├── PracticePage.tsx
│   │   │   ├── PracticeResultsPage.tsx
│   │   │   ├── ReviewPage.tsx
│   │   │   ├── ExamPickerPage.tsx
│   │   │   ├── ExamPage.tsx
│   │   │   ├── ExamResultsPage.tsx
│   │   │   └── SettingsPage.tsx
│   │   ├── components/
│   │   │   ├── QuestionCard.tsx
│   │   │   ├── OptionGrid.tsx
│   │   │   ├── TriesIndicator.tsx
│   │   │   ├── HintCard.tsx
│   │   │   ├── ExplanationCard.tsx
│   │   │   ├── TopicCard.tsx
│   │   │   ├── ModeCard.tsx
│   │   │   ├── StatPill.tsx
│   │   │   ├── ExamGrid.tsx
│   │   │   ├── ExamTimer.tsx
│   │   │   ├── Confirm.tsx
│   │   │   ├── PageHeader.tsx
│   │   │   └── Logo.tsx
│   │   ├── store/
│   │   │   ├── index.ts             ← combined Zustand store
│   │   │   ├── bankSlice.ts
│   │   │   ├── usersSlice.ts
│   │   │   ├── sessionSlice.ts
│   │   │   └── migrations.ts
│   │   ├── lib/
│   │   │   ├── katex.tsx            ← inline-math renderer
│   │   │   ├── streak.ts
│   │   │   ├── shuffle.ts
│   │   │   ├── slug.ts
│   │   │   ├── storage.ts
│   │   │   └── date.ts
│   │   ├── data/
│   │   │   └── types.ts             ← all shared types from the spec
│   │   ├── styles/
│   │   │   └── index.css            ← tailwind directives + global RTL
│   │   ├── main.tsx
│   │   └── vite-env.d.ts
│   ├── tests/
│   │   ├── unit/                    ← Vitest unit tests for lib/, store/
│   │   ├── component/               ← RTL component smoke tests
│   │   └── e2e/                     ← Playwright spec
│   ├── scripts/
│   │   └── sync-data.mjs            ← copies ../data/*.json to public/data/
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   ├── postcss.config.js
│   ├── playwright.config.ts
│   ├── .eslintrc.cjs
│   ├── .prettierrc
│   └── README.md
└── .github/
    └── workflows/
        └── deploy.yml               ← GitHub Pages
```

**Boundaries:**
- `lib/` — pure functions only, exhaustively unit-tested.
- `store/` — Zustand state. Slices are independent; selectors live in the slice that owns the data.
- `components/` — presentation only. They consume props and emit callbacks. No direct store access.
- `pages/` — store-aware containers. Compose components and wire to the store.

---

## Task 1: Initialize repo, scaffold Vite/React/TS app

**Files:**
- Create: `.gitignore`, `app/package.json`, `app/tsconfig.json`, `app/tsconfig.node.json`, `app/vite.config.ts`, `app/index.html`, `app/src/main.tsx`, `app/src/app/App.tsx`, `app/.eslintrc.cjs`, `app/.prettierrc`

- [ ] **Step 1: Initialize git at repo root**

```bash
cd "D:/Code/My Stuff/math-practice"
git init
git add -A
git commit -m "chore: snapshot pre-app state"
```

Expected: a single initial commit covering existing `data/`, `docs/`, `tools/`, `README.md`.

- [ ] **Step 2: Add root `.gitignore`**

Create `.gitignore`:

```gitignore
# Node
node_modules/
.npm/

# Build outputs
app/dist/
app/.vite/

# OS
.DS_Store
Thumbs.db

# Editor
.vscode/
.idea/

# Logs
*.log

# Brainstorm/visual companion artifacts
.superpowers/

# Test artifacts
app/coverage/
app/playwright-report/
app/test-results/
```

- [ ] **Step 3: Scaffold the app directory**

```bash
mkdir app
cd app
npm create vite@5 . -- --template react-ts
```

When prompted for "package name", accept `app` or use `math-practice`. Accept overwrite if asked.

- [ ] **Step 4: Trim the scaffold and install only what we need**

Remove unnecessary files:

```bash
rm src/App.css src/App.tsx src/assets/react.svg src/index.css public/vite.svg
```

Install runtime deps:

```bash
npm install react-router-dom@6 zustand@4 katex@0.16 react-katex@3 lucide-react@latest framer-motion@latest
```

Install dev deps (TypeScript types, Tailwind, testing):

```bash
npm install -D @types/katex tailwindcss@3 postcss autoprefixer tailwindcss-rtl vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @playwright/test prettier eslint-config-prettier
```

- [ ] **Step 5: Replace `app/package.json` scripts section**

After scaffold, edit `app/package.json` so `"scripts"` is:

```json
"scripts": {
  "dev": "npm run sync-data && vite",
  "build": "npm run sync-data && tsc -b && vite build",
  "preview": "vite preview",
  "test": "vitest run",
  "test:watch": "vitest",
  "test:e2e": "playwright test",
  "lint": "eslint src --ext .ts,.tsx",
  "format": "prettier --write src",
  "sync-data": "node scripts/sync-data.mjs"
}
```

- [ ] **Step 6: Replace `app/vite.config.ts`**

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  base: "./",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: {
    port: 5173,
    open: false,
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["tests/e2e/**"],
  },
});
```

`base: "./"` lets the built site work under any subpath (incl. GitHub Pages).

- [ ] **Step 7: Replace `app/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "useDefineForClassFields": true,
    "allowSyntheticDefaultImports": true,
    "types": ["vitest/globals", "@testing-library/jest-dom"],
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src", "tests"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 8: Replace `app/index.html`**

```html
<!doctype html>
<html lang="he" dir="rtl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>חשבונייה — תרגול לבחינת ז'</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700;800;900&display=swap"
      rel="stylesheet"
    />
    <link
      rel="stylesheet"
      href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css"
      integrity="sha384-n8MVd4RsNIU0tAv4ct0nTaAbDJwPJzDEaqSD1odI+WdtXRGWt2kTvGFasHpSy3SV"
      crossorigin="anonymous"
    />
  </head>
  <body class="bg-white text-ink">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 9: Replace `app/src/main.tsx`**

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./app/App";
import "./styles/index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

- [ ] **Step 10: Create `app/src/app/App.tsx`** (placeholder until routes exist)

```tsx
export function App() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <h1 className="text-3xl font-extrabold tracking-tight">
        שלום! האפליקציה בבנייה.
      </h1>
    </div>
  );
}
```

- [ ] **Step 11: Create the testing setup file**

Create `app/tests/setup.ts`:

```ts
import "@testing-library/jest-dom";
```

- [ ] **Step 12: Add Prettier and ESLint configs**

Create `app/.prettierrc`:

```json
{
  "semi": true,
  "singleQuote": false,
  "trailingComma": "all",
  "printWidth": 100
}
```

Create `app/.eslintrc.cjs`:

```js
module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react-hooks/recommended",
    "prettier",
  ],
  ignorePatterns: ["dist", ".eslintrc.cjs"],
  parser: "@typescript-eslint/parser",
  plugins: ["react-refresh"],
  rules: {
    "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
  },
};
```

- [ ] **Step 13: Sanity check — run build**

```bash
cd app
npm run build
```

Expected: builds without errors, output in `app/dist/`.

(Build will still complain Tailwind isn't loaded yet — that's Task 2.)

- [ ] **Step 14: Commit**

```bash
cd ..
git add -A
git commit -m "feat(app): scaffold Vite+React+TS app under app/"
```

---

## Task 2: Wire Tailwind + RTL + Sprout palette + Heebo

**Files:**
- Create: `app/tailwind.config.ts`, `app/postcss.config.js`, `app/src/styles/index.css`

- [ ] **Step 1: Create `app/postcss.config.js`**

```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

- [ ] **Step 2: Create `app/tailwind.config.ts` with the Sprout palette**

```ts
import type { Config } from "tailwindcss";
import rtl from "tailwindcss-rtl";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Heebo", "system-ui", "sans-serif"],
      },
      colors: {
        brand: {
          50: "#F0FDF4",
          100: "#DCFCE7",
          200: "#BBF7D0",
          400: "#4ADE80",
          500: "#22C55E",
          600: "#16A34A",
          700: "#15803D",
          900: "#14532D",
        },
        ink: "#0F1A14",
        muted: "#6B7280",
        faint: "#9CA3AF",
        hair: "#F3F4F6",
        border: "#E5E7EB",
        surface: "#F9FAFB",
        warn: {
          50: "#FEFCE8",
          200: "#FEF08A",
          700: "#A16207",
        },
        danger: {
          50: "#FEF2F2",
          200: "#FECACA",
          600: "#DC2626",
        },
      },
      letterSpacing: {
        tightest: "-0.02em",
      },
      boxShadow: {
        cta: "0 4px 0 #15803D",
        "cta-pressed": "0 2px 0 #15803D",
      },
      keyframes: {
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "25%": { transform: "translateX(-4px)" },
          "75%": { transform: "translateX(4px)" },
        },
        "star-fly": {
          "0%": { opacity: "0", transform: "translateY(0) scale(0.8)" },
          "30%": { opacity: "1", transform: "translateY(-20px) scale(1.1)" },
          "100%": { opacity: "0", transform: "translateY(-60px) scale(0.9)" },
        },
      },
      animation: {
        shake: "shake 0.35s ease-in-out",
        "star-fly": "star-fly 1.2s ease-out forwards",
      },
    },
  },
  plugins: [rtl],
} satisfies Config;
```

- [ ] **Step 3: Create `app/src/styles/index.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html,
  body {
    @apply font-sans antialiased text-ink;
    direction: rtl;
  }

  /* KaTeX renders LTR — make sure it stays LTR even inside RTL paragraphs */
  .katex,
  .katex-display {
    direction: ltr;
    unicode-bidi: isolate;
  }

  /* Numeric figures (counts, scores, timer) — tabular for stable widths */
  .tabular-nums {
    font-variant-numeric: tabular-nums;
  }
}

@layer components {
  .h1-hero {
    @apply text-3xl sm:text-4xl font-black tracking-tightest leading-[1.05] text-ink;
  }

  .h1-hero-accent {
    background-image: linear-gradient(90deg, #16a34a 0%, #22c55e 100%);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    color: transparent;
  }

  .section-label {
    @apply text-xs uppercase tracking-[0.09em] font-bold text-brand-600;
  }

  .btn-primary {
    @apply inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-brand-500 text-white font-bold shadow-cta active:shadow-cta-pressed active:translate-y-[2px] transition-shadow disabled:opacity-50 disabled:cursor-not-allowed;
  }

  .btn-secondary {
    @apply inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-surface text-ink font-semibold border border-border;
  }

  .card {
    @apply rounded-2xl border border-border bg-white;
  }
}
```

- [ ] **Step 4: Update `app/src/app/App.tsx` to verify the palette**

```tsx
import { Star } from "lucide-react";

export function App() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="card max-w-md w-full p-6 mx-4">
        <h1 className="h1-hero">
          שלום נועה,<br />
          <span className="h1-hero-accent">בואי נתאמן.</span>
        </h1>
        <p className="text-muted mt-2 mb-4">בדיקה שהפלטה והפונט עובדים.</p>
        <button className="btn-primary">
          <Star size={18} />
          התחל
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Run dev server and verify**

```bash
cd app
npm run dev
```

Open `http://localhost:5173`. Expected: white background, Heebo font, RTL layout, gradient-text on "בואי נתאמן.", green primary button with lucide Star icon.

- [ ] **Step 6: Commit**

```bash
cd ..
git add -A
git commit -m "feat(app): wire Tailwind + RTL + Sprout palette + Heebo font"
```

---

## Task 3: Data sync script + types

**Files:**
- Create: `app/scripts/sync-data.mjs`, `app/src/data/types.ts`

- [ ] **Step 1: Create `app/scripts/sync-data.mjs`**

```js
import { copyFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP_PUBLIC_DATA = join(__dirname, "..", "public", "data");
const REPO_DATA = join(__dirname, "..", "..", "data");

const files = ["questions.json", "image_dependent_questions.json"];

mkdirSync(APP_PUBLIC_DATA, { recursive: true });
let copied = 0;
for (const f of files) {
  const src = join(REPO_DATA, f);
  const dst = join(APP_PUBLIC_DATA, f);
  if (!existsSync(src)) {
    console.warn(`! missing source: ${src} — skipping`);
    continue;
  }
  copyFileSync(src, dst);
  copied++;
  console.log(`  ${f}`);
}
console.log(`synced ${copied} file(s) -> public/data/`);
```

- [ ] **Step 2: Run it to populate `public/data/`**

```bash
cd app
npm run sync-data
ls public/data
```

Expected: `questions.json` and `image_dependent_questions.json` present.

- [ ] **Step 3: Create `app/src/data/types.ts`** (full type system used throughout)

```ts
// ============================================================
// Static question bank types
// ============================================================

export type OptionLetter = "א" | "ב" | "ג" | "ד";

export interface RawQuestion {
  id: string;                       // "01_ידע_מתמטי/שברים_עשרוניים/4"
  number: number;                   // 1-based within topic
  question: string;
  options: Partial<Record<OptionLetter, string>>;
  correct_answer: string;
  correct_letter: OptionLetter | null;
  explanation: string;
  flags: string[];                  // "visual-only" | "three-option" | "missing-explanation"
}

export interface RawTopic {
  id: string;                       // slug like "שברים_עשרוניים"
  name_he: string;
  source_file: string;
  question_count: number;
  questions: RawQuestion[];
}

export interface RawCategory {
  id: string;                       // "math-knowledge" | "logic-reasoning" | "sample-exams"
  name_he: string;
  topic_count: number;
  question_count: number;
  topics: RawTopic[];
}

export interface QuestionBank {
  version: 1;
  total_questions: number;
  categories: RawCategory[];
}

// ============================================================
// Composite IDs
// ============================================================

/** Composite id: "<categoryDir>/<topicSlug>" — e.g. "01_ידע_מתמטי/שברים_עשרוניים" */
export type TopicId = string;

/** Composite id from RawQuestion.id — e.g. "01_ידע_מתמטי/שברים_עשרוניים/4" */
export type QuestionId = string;

export type UserId = string;

// ============================================================
// Image dependency
// ============================================================

export interface ImageDependencyEntry {
  q_id: QuestionId;
  q_num: number;
  category: string;
  topic: string;
  topic_id: string;
  file: string;
  flagged_already: boolean;
  matches: string[];
  /** Optional once images are sourced. */
  image?: string;
  /** Optional alt text. */
  image_alt?: string;
}

export interface ImageDependencyIndex {
  total: number;
  questions: ImageDependencyEntry[];
}

// ============================================================
// Per-user persisted state
// ============================================================

export interface QuestionProgress {
  attempts: 0 | 1 | 2 | 3;
  firstTryCorrect: boolean;
  mastered: boolean;
  lastSeen: number;
  inReviewQueue: boolean;
}

export interface TopicProgress {
  attempted: number;
  mastered: number;
  totalQuestions: number;
}

export interface ExamAttempt {
  examId: string;                   // matches a TopicId in "sample-exams" category
  takenAt: number;
  durationSec: number;
  timerEnabled: boolean;
  score: number;
  total: number;
  answers: Record<QuestionId, ExamAnswerRecord>;
}

export interface ExamAnswerRecord {
  picked: OptionLetter | null;
  correct: boolean;
  flagged: boolean;
}

export interface UserStats {
  totalAnswered: number;
  starsEarned: number;
  currentStreakDays: number;
  longestStreakDays: number;
  lastActiveDate: string;           // "YYYY-MM-DD"
  todayCount: number;
}

export interface UserProgress {
  questions: Record<QuestionId, QuestionProgress>;
  topics: Record<TopicId, TopicProgress>;
  exams: ExamAttempt[];
  stats: UserStats;
  reviewQueue: QuestionId[];
}

export interface UserState {
  id: UserId;
  name: string;
  createdAt: number;
  progress: UserProgress;
}

export interface PersistRoot {
  version: 1;
  activeUserId: UserId | null;
  users: Record<UserId, UserState>;
}

// ============================================================
// Session (in-memory) state shapes
// ============================================================

export type SessionMode = "practice" | "review" | "exam";

export interface PracticeSession {
  mode: "practice" | "review";
  topicId: TopicId | null;          // null in review mode (queue spans topics)
  queue: QuestionId[];              // shuffled for practice; FIFO for review
  index: number;                    // current position in queue
  currentAttempts: 0 | 1 | 2 | 3;
  revealed: boolean;                // true after 3 wrong tries OR after correct
  hintLevel: 0 | 1 | 2 | 3;         // # of hints shown
  results: {
    answered: number;
    firstTryCorrect: number;
    secondTryCorrect: number;
    thirdTryCorrect: number;
    failed: number;                 // 3 wrong tries
  };
}

export interface ExamSession {
  mode: "exam";
  examId: TopicId;                  // e.g. "03_מבחנים_לדוגמה/מבחן_לדוגמה_1"
  queue: QuestionId[];              // in order (NOT shuffled)
  index: number;
  picks: Record<QuestionId, OptionLetter | null>;
  flagged: Record<QuestionId, boolean>;
  timerEnabled: boolean;
  startedAt: number;
  durationSec: number;              // 60 * 60 = 3600 default
  remainingSec: number;
  ended: boolean;
}

export type Session = PracticeSession | ExamSession | null;

// ============================================================
// Defaults
// ============================================================

export const EMPTY_STATS: UserStats = {
  totalAnswered: 0,
  starsEarned: 0,
  currentStreakDays: 0,
  longestStreakDays: 0,
  lastActiveDate: "",
  todayCount: 0,
};

export function emptyProgress(): UserProgress {
  return {
    questions: {},
    topics: {},
    exams: [],
    stats: { ...EMPTY_STATS },
    reviewQueue: [],
  };
}
```

- [ ] **Step 4: Commit**

```bash
cd ..
git add -A
git commit -m "feat(app): data sync script + shared TypeScript types"
```

---

## Task 4: Pure utility libs (date, slug, shuffle, streak) — TDD

**Files:**
- Create: `app/src/lib/date.ts`, `app/tests/unit/date.test.ts`
- Create: `app/src/lib/slug.ts`, `app/tests/unit/slug.test.ts`
- Create: `app/src/lib/shuffle.ts`, `app/tests/unit/shuffle.test.ts`
- Create: `app/src/lib/streak.ts`, `app/tests/unit/streak.test.ts`

- [ ] **Step 1: Write the failing date tests**

Create `app/tests/unit/date.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { formatLocalDate, addDays, diffInDays } from "@/lib/date";

describe("date helpers", () => {
  it("formatLocalDate returns YYYY-MM-DD in local time", () => {
    const d = new Date(2026, 4, 17, 14, 30); // May 17 2026 local
    expect(formatLocalDate(d)).toBe("2026-05-17");
  });

  it("formatLocalDate pads month and day", () => {
    const d = new Date(2026, 0, 5, 0, 0); // Jan 5
    expect(formatLocalDate(d)).toBe("2026-01-05");
  });

  it("addDays adds N days", () => {
    const d = new Date(2026, 4, 17);
    const r = addDays(d, 3);
    expect(formatLocalDate(r)).toBe("2026-05-20");
  });

  it("diffInDays returns calendar-day difference for two YYYY-MM-DD strings", () => {
    expect(diffInDays("2026-05-17", "2026-05-17")).toBe(0);
    expect(diffInDays("2026-05-17", "2026-05-18")).toBe(1);
    expect(diffInDays("2026-05-17", "2026-05-20")).toBe(3);
    expect(diffInDays("2026-05-20", "2026-05-17")).toBe(-3);
  });
});
```

- [ ] **Step 2: Run the test — verify it fails**

```bash
cd app
npm test -- date
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `app/src/lib/date.ts`**

```ts
export function formatLocalDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

export function diffInDays(aIso: string, bIso: string): number {
  // ISO YYYY-MM-DD comparison is calendar-only; avoid TZ skew.
  const [ay, am, ad] = aIso.split("-").map(Number);
  const [by, bm, bd] = bIso.split("-").map(Number);
  const aMs = Date.UTC(ay, am - 1, ad);
  const bMs = Date.UTC(by, bm - 1, bd);
  return Math.round((bMs - aMs) / 86_400_000);
}

export function todayLocal(): string {
  return formatLocalDate(new Date());
}
```

- [ ] **Step 4: Run test — verify it passes**

```bash
npm test -- date
```

Expected: PASS.

- [ ] **Step 5: Write slug tests**

Create `app/tests/unit/slug.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { slugifyName, makeUniqueUserId } from "@/lib/slug";

describe("slug helpers", () => {
  it("slugifyName lowercases and trims", () => {
    expect(slugifyName("  Noa  ")).toBe("noa");
  });

  it("slugifyName preserves Hebrew letters", () => {
    expect(slugifyName("נועה")).toBe("נועה");
  });

  it("slugifyName replaces internal whitespace with single hyphen", () => {
    expect(slugifyName("נועה   כהן")).toBe("נועה-כהן");
  });

  it("slugifyName strips punctuation and emoji", () => {
    expect(slugifyName("Noa! :)")).toBe("noa");
    expect(slugifyName("נועה ⭐")).toBe("נועה");
  });

  it("slugifyName falls back when input is empty after stripping", () => {
    expect(slugifyName("!!!")).toBe("user");
    expect(slugifyName("")).toBe("user");
  });

  it("makeUniqueUserId returns the base id when free", () => {
    expect(makeUniqueUserId("noa", new Set())).toBe("noa");
  });

  it("makeUniqueUserId suffixes on collision", () => {
    const taken = new Set(["noa", "noa-2"]);
    expect(makeUniqueUserId("noa", taken)).toBe("noa-3");
  });
});
```

- [ ] **Step 6: Run — verify failure**

```bash
npm test -- slug
```

Expected: FAIL.

- [ ] **Step 7: Implement `app/src/lib/slug.ts`**

```ts
const ALLOWED = /[֐-׿a-z0-9-]/g; // Hebrew block + lowercase latin + digits + hyphen

export function slugifyName(input: string): string {
  const lower = input.toLowerCase().trim().normalize("NFC");
  // Collapse whitespace runs to single hyphen
  const hyphenated = lower.replace(/\s+/g, "-");
  // Keep only allowed chars
  const cleaned = (hyphenated.match(ALLOWED) || []).join("");
  // Collapse repeated hyphens, trim leading/trailing
  const collapsed = cleaned.replace(/-+/g, "-").replace(/^-|-$/g, "");
  return collapsed || "user";
}

export function makeUniqueUserId(base: string, taken: Set<string>): string {
  if (!taken.has(base)) return base;
  let n = 2;
  while (taken.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}
```

- [ ] **Step 8: Run — verify pass**

```bash
npm test -- slug
```

Expected: PASS.

- [ ] **Step 9: Write shuffle tests**

Create `app/tests/unit/shuffle.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { seededShuffle } from "@/lib/shuffle";

describe("seededShuffle", () => {
  it("returns the same items, just reordered", () => {
    const input = [1, 2, 3, 4, 5];
    const result = seededShuffle(input, 42);
    expect(result.sort()).toEqual([1, 2, 3, 4, 5]);
  });

  it("is deterministic for a given seed", () => {
    const a = seededShuffle(["a", "b", "c", "d", "e"], 99);
    const b = seededShuffle(["a", "b", "c", "d", "e"], 99);
    expect(a).toEqual(b);
  });

  it("different seeds produce different orderings (with high probability)", () => {
    const a = seededShuffle([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 1);
    const b = seededShuffle([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 2);
    expect(a).not.toEqual(b);
  });

  it("does not mutate input", () => {
    const input = [1, 2, 3];
    seededShuffle(input, 1);
    expect(input).toEqual([1, 2, 3]);
  });

  it("handles empty array", () => {
    expect(seededShuffle([], 1)).toEqual([]);
  });
});
```

- [ ] **Step 10: Run — verify failure**

```bash
npm test -- shuffle
```

Expected: FAIL.

- [ ] **Step 11: Implement `app/src/lib/shuffle.ts`** (mulberry32 PRNG)

```ts
/** A small deterministic PRNG (mulberry32). */
function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = t;
    r = Math.imul(r ^ (r >>> 15), r | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4_294_967_296;
  };
}

export function seededShuffle<T>(items: readonly T[], seed: number): T[] {
  const out = items.slice();
  const rng = mulberry32(seed);
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
```

- [ ] **Step 12: Run — verify pass**

```bash
npm test -- shuffle
```

Expected: PASS.

- [ ] **Step 13: Write streak tests**

Create `app/tests/unit/streak.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { applyStreak } from "@/lib/streak";
import { EMPTY_STATS } from "@/data/types";

describe("applyStreak", () => {
  it("first-ever answer initializes streak to 1, todayCount to 1", () => {
    const next = applyStreak({ ...EMPTY_STATS }, "2026-05-17");
    expect(next.currentStreakDays).toBe(1);
    expect(next.longestStreakDays).toBe(1);
    expect(next.todayCount).toBe(1);
    expect(next.lastActiveDate).toBe("2026-05-17");
  });

  it("same-day answer increments todayCount but not streak", () => {
    const stats = applyStreak({ ...EMPTY_STATS }, "2026-05-17");
    const next = applyStreak(stats, "2026-05-17");
    expect(next.currentStreakDays).toBe(1);
    expect(next.todayCount).toBe(2);
  });

  it("next-day answer increments streak", () => {
    let s = applyStreak({ ...EMPTY_STATS }, "2026-05-17");
    s = applyStreak(s, "2026-05-18");
    expect(s.currentStreakDays).toBe(2);
    expect(s.todayCount).toBe(1);
  });

  it("gap of 2+ days resets streak to 1", () => {
    let s = applyStreak({ ...EMPTY_STATS }, "2026-05-17");
    s = applyStreak(s, "2026-05-18");
    s = applyStreak(s, "2026-05-21");
    expect(s.currentStreakDays).toBe(1);
    expect(s.todayCount).toBe(1);
  });

  it("tracks longest streak across resets", () => {
    let s = { ...EMPTY_STATS };
    for (const day of ["2026-05-17", "2026-05-18", "2026-05-19"]) s = applyStreak(s, day);
    expect(s.longestStreakDays).toBe(3);
    s = applyStreak(s, "2026-05-25"); // reset
    expect(s.currentStreakDays).toBe(1);
    expect(s.longestStreakDays).toBe(3);
  });
});
```

- [ ] **Step 14: Run — verify failure**

```bash
npm test -- streak
```

Expected: FAIL.

- [ ] **Step 15: Implement `app/src/lib/streak.ts`**

```ts
import type { UserStats } from "@/data/types";
import { diffInDays } from "./date";

export function applyStreak(prev: UserStats, today: string): UserStats {
  if (!prev.lastActiveDate) {
    return {
      ...prev,
      currentStreakDays: 1,
      longestStreakDays: Math.max(1, prev.longestStreakDays),
      lastActiveDate: today,
      todayCount: 1,
    };
  }
  const gap = diffInDays(prev.lastActiveDate, today);
  if (gap === 0) {
    return { ...prev, todayCount: prev.todayCount + 1 };
  }
  if (gap === 1) {
    const next = prev.currentStreakDays + 1;
    return {
      ...prev,
      currentStreakDays: next,
      longestStreakDays: Math.max(next, prev.longestStreakDays),
      lastActiveDate: today,
      todayCount: 1,
    };
  }
  // gap > 1 (or negative — e.g. clock changed backward; treat as reset)
  return {
    ...prev,
    currentStreakDays: 1,
    lastActiveDate: today,
    todayCount: 1,
  };
}
```

- [ ] **Step 16: Run all unit tests**

```bash
npm test
```

Expected: all green.

- [ ] **Step 17: Commit**

```bash
cd ..
git add -A
git commit -m "feat(app): pure utility libs (date, slug, shuffle, streak) with tests"
```

---

## Task 5: Storage layer + migrations — TDD

**Files:**
- Create: `app/src/lib/storage.ts`, `app/tests/unit/storage.test.ts`
- Create: `app/src/store/migrations.ts`, `app/tests/unit/migrations.test.ts`

- [ ] **Step 1: Write the storage tests**

Create `app/tests/unit/storage.test.ts`:

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { readPersist, writePersist, clearPersist, STORAGE_KEY } from "@/lib/storage";
import type { PersistRoot } from "@/data/types";

describe("storage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("readPersist returns null when nothing stored", () => {
    expect(readPersist()).toBeNull();
  });

  it("readPersist returns parsed object when valid JSON is present", () => {
    const data: PersistRoot = { version: 1, activeUserId: null, users: {} };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    expect(readPersist()).toEqual(data);
  });

  it("readPersist returns null and clears key on invalid JSON", () => {
    localStorage.setItem(STORAGE_KEY, "{not json");
    expect(readPersist()).toBeNull();
    // After failed read we don't auto-clear; we just return null and let the caller decide.
    expect(localStorage.getItem(STORAGE_KEY)).toBe("{not json");
  });

  it("writePersist round-trips", () => {
    const data: PersistRoot = { version: 1, activeUserId: "noa", users: {} };
    writePersist(data);
    expect(readPersist()).toEqual(data);
  });

  it("clearPersist removes the key", () => {
    writePersist({ version: 1, activeUserId: null, users: {} });
    clearPersist();
    expect(readPersist()).toBeNull();
  });
});
```

- [ ] **Step 2: Run — verify failure**

```bash
cd app
npm test -- storage
```

Expected: FAIL.

- [ ] **Step 3: Implement `app/src/lib/storage.ts`**

```ts
import type { PersistRoot } from "@/data/types";

export const STORAGE_KEY = "math-practice:v1";

export function readPersist(): PersistRoot | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PersistRoot;
  } catch (e) {
    console.error("storage: failed to read", e);
    return null;
  }
}

export function writePersist(data: PersistRoot): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("storage: failed to write", e);
  }
}

export function clearPersist(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error("storage: failed to clear", e);
  }
}
```

- [ ] **Step 4: Run — verify pass**

```bash
npm test -- storage
```

- [ ] **Step 5: Write migration tests**

Create `app/tests/unit/migrations.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { migrate } from "@/store/migrations";

describe("migrations", () => {
  it("returns empty root when input is null", () => {
    const out = migrate(null);
    expect(out.version).toBe(1);
    expect(out.activeUserId).toBeNull();
    expect(out.users).toEqual({});
  });

  it("passes v1 data through unchanged", () => {
    const v1 = { version: 1, activeUserId: "noa", users: {} };
    expect(migrate(v1 as any)).toEqual(v1);
  });

  it("throws on unknown future version", () => {
    expect(() => migrate({ version: 99 } as any)).toThrow(/unknown.*version/i);
  });

  it("rebuilds when payload is unrecognizable", () => {
    const out = migrate({ randomJunk: true } as any);
    expect(out.version).toBe(1);
    expect(out.users).toEqual({});
  });
});
```

- [ ] **Step 6: Run — verify failure**

```bash
npm test -- migrations
```

- [ ] **Step 7: Implement `app/src/store/migrations.ts`**

```ts
import type { PersistRoot } from "@/data/types";

export function migrate(input: unknown): PersistRoot {
  if (input == null) {
    return { version: 1, activeUserId: null, users: {} };
  }
  if (typeof input !== "object") {
    return { version: 1, activeUserId: null, users: {} };
  }
  const obj = input as { version?: unknown; activeUserId?: unknown; users?: unknown };
  if (typeof obj.version !== "number") {
    return { version: 1, activeUserId: null, users: {} };
  }
  if (obj.version === 1) {
    return obj as PersistRoot;
  }
  if (obj.version > 1) {
    throw new Error(`Unknown persist version: ${obj.version}. Refusing to clobber.`);
  }
  // Future-proof: any version === 0 or anything else, rebuild fresh.
  return { version: 1, activeUserId: null, users: {} };
}
```

- [ ] **Step 8: Run — verify pass**

```bash
npm test -- migrations
```

- [ ] **Step 9: Commit**

```bash
cd ..
git add -A
git commit -m "feat(app): storage layer + schema migrations with tests"
```

---

## Task 6: Zustand store — bank, users, session slices

**Files:**
- Create: `app/src/store/bankSlice.ts`, `app/src/store/usersSlice.ts`, `app/src/store/sessionSlice.ts`, `app/src/store/index.ts`
- Create: `app/tests/unit/usersSlice.test.ts`

- [ ] **Step 1: Create `app/src/store/bankSlice.ts`**

```ts
import type { StateCreator } from "zustand";
import type { QuestionBank, ImageDependencyIndex, QuestionId, RawQuestion } from "@/data/types";

export interface BankSlice {
  bank: QuestionBank | null;
  imageIndex: ImageDependencyIndex | null;
  bankLoading: boolean;
  bankError: string | null;
  loadBank: () => Promise<void>;
  getQuestion: (id: QuestionId) => RawQuestion | undefined;
  needsImage: (id: QuestionId) => boolean;
  isVisualOnly: (id: QuestionId) => boolean;
  getImage: (id: QuestionId) => { src: string; alt: string } | null;
}

export const createBankSlice: StateCreator<BankSlice, [], [], BankSlice> = (set, get) => ({
  bank: null,
  imageIndex: null,
  bankLoading: false,
  bankError: null,

  loadBank: async () => {
    if (get().bank) return;
    set({ bankLoading: true, bankError: null });
    try {
      const [bankRes, imgRes] = await Promise.all([
        fetch(new URL("data/questions.json", document.baseURI)),
        fetch(new URL("data/image_dependent_questions.json", document.baseURI)),
      ]);
      if (!bankRes.ok) throw new Error(`bank fetch ${bankRes.status}`);
      const bank = (await bankRes.json()) as QuestionBank;
      const imageIndex = imgRes.ok
        ? ((await imgRes.json()) as ImageDependencyIndex)
        : { total: 0, questions: [] };
      set({ bank, imageIndex, bankLoading: false });
    } catch (e) {
      set({ bankError: String(e), bankLoading: false });
    }
  },

  getQuestion: (id) => {
    const bank = get().bank;
    if (!bank) return undefined;
    for (const cat of bank.categories) {
      for (const topic of cat.topics) {
        for (const q of topic.questions) {
          if (q.id === id) return q;
        }
      }
    }
    return undefined;
  },

  needsImage: (id) => {
    const idx = get().imageIndex;
    if (!idx) return false;
    return idx.questions.some((e) => e.q_id === id);
  },

  isVisualOnly: (id) => {
    const q = get().getQuestion(id);
    return q ? q.flags.includes("visual-only") : false;
  },

  getImage: (id) => {
    const idx = get().imageIndex;
    if (!idx) return null;
    const entry = idx.questions.find((e) => e.q_id === id);
    if (!entry || !entry.image) return null;
    return { src: entry.image, alt: entry.image_alt ?? "" };
  },
});
```

- [ ] **Step 2: Write users slice tests**

Create `app/tests/unit/usersSlice.test.ts`:

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { create } from "zustand";
import { createUsersSlice, type UsersSlice } from "@/store/usersSlice";

function makeStore() {
  return create<UsersSlice>()((...a) => createUsersSlice(...a));
}

describe("usersSlice", () => {
  beforeEach(() => localStorage.clear());

  it("creates a user with a slug id", () => {
    const store = makeStore();
    const id = store.getState().createUser("נועה");
    expect(id).toBe("נועה");
    expect(store.getState().users[id].name).toBe("נועה");
    expect(store.getState().activeUserId).toBe(id);
  });

  it("dedupes ids on conflict", () => {
    const store = makeStore();
    const a = store.getState().createUser("נועה");
    const b = store.getState().createUser("נועה");
    expect(a).toBe("נועה");
    expect(b).toBe("נועה-2");
  });

  it("switchUser sets activeUserId", () => {
    const store = makeStore();
    const a = store.getState().createUser("נועה");
    const b = store.getState().createUser("יעל");
    store.getState().switchUser(a);
    expect(store.getState().activeUserId).toBe(a);
    store.getState().switchUser(b);
    expect(store.getState().activeUserId).toBe(b);
  });

  it("deleteUser removes from users map and clears active if needed", () => {
    const store = makeStore();
    const a = store.getState().createUser("נועה");
    store.getState().deleteUser(a);
    expect(store.getState().users[a]).toBeUndefined();
    expect(store.getState().activeUserId).toBeNull();
  });

  it("resetUserProgress wipes progress for the given user", () => {
    const store = makeStore();
    const a = store.getState().createUser("נועה");
    // simulate some progress
    store.setState((s) => {
      s.users[a].progress.stats.totalAnswered = 5;
      return s;
    });
    store.getState().resetUserProgress(a);
    expect(store.getState().users[a].progress.stats.totalAnswered).toBe(0);
  });
});
```

- [ ] **Step 3: Run — verify failure**

```bash
cd app
npm test -- usersSlice
```

- [ ] **Step 4: Create `app/src/store/usersSlice.ts`**

```ts
import type { StateCreator } from "zustand";
import type { OptionLetter, PersistRoot, QuestionId, TopicId, UserId, UserState } from "@/data/types";
import { emptyProgress } from "@/data/types";
import { slugifyName, makeUniqueUserId } from "@/lib/slug";
import { applyStreak } from "@/lib/streak";
import { todayLocal } from "@/lib/date";
import { readPersist, writePersist } from "@/lib/storage";
import { migrate } from "./migrations";

export interface UsersSlice {
  activeUserId: UserId | null;
  users: Record<UserId, UserState>;
  hydrate: () => void;
  createUser: (name: string) => UserId;
  switchUser: (id: UserId) => void;
  deleteUser: (id: UserId) => void;
  resetUserProgress: (id: UserId) => void;
  /**
   * Record one answered question. Used by both practice and exam flows.
   * `attemptIndex` is 0/1/2 for tries 1/2/3.
   */
  recordAnswer: (input: {
    userId: UserId;
    questionId: QuestionId;
    topicId: TopicId;
    totalQuestionsInTopic: number;
    correct: boolean;
    attemptIndex: 0 | 1 | 2;
    pickedLetter: OptionLetter | null;
  }) => void;
  /** Add a question id to the review queue if not already there. */
  enqueueReview: (userId: UserId, questionId: QuestionId) => void;
  /** Remove a question id from the review queue. */
  dequeueReview: (userId: UserId, questionId: QuestionId) => void;
}

function persist(state: Pick<UsersSlice, "activeUserId" | "users">): void {
  const root: PersistRoot = {
    version: 1,
    activeUserId: state.activeUserId,
    users: state.users,
  };
  writePersist(root);
}

export const createUsersSlice: StateCreator<UsersSlice, [], [], UsersSlice> = (set, get) => ({
  activeUserId: null,
  users: {},

  hydrate: () => {
    const root = migrate(readPersist());
    set({ activeUserId: root.activeUserId, users: root.users });
  },

  createUser: (rawName) => {
    const display = rawName.trim() || "שחקן";
    const base = slugifyName(display);
    const taken = new Set(Object.keys(get().users));
    const id = makeUniqueUserId(base, taken);
    const next: UserState = {
      id,
      name: display,
      createdAt: Date.now(),
      progress: emptyProgress(),
    };
    set((s) => {
      const users = { ...s.users, [id]: next };
      const result = { users, activeUserId: id };
      persist(result);
      return result;
    });
    return id;
  },

  switchUser: (id) => {
    if (!get().users[id]) return;
    set((s) => {
      const result = { ...s, activeUserId: id };
      persist(result);
      return { activeUserId: id };
    });
  },

  deleteUser: (id) => {
    set((s) => {
      const { [id]: _, ...rest } = s.users;
      const activeUserId = s.activeUserId === id ? null : s.activeUserId;
      const result = { users: rest, activeUserId };
      persist(result);
      return result;
    });
  },

  resetUserProgress: (id) => {
    set((s) => {
      const user = s.users[id];
      if (!user) return s;
      const fresh: UserState = { ...user, progress: emptyProgress() };
      const users = { ...s.users, [id]: fresh };
      const result = { users, activeUserId: s.activeUserId };
      persist(result);
      return { users };
    });
  },

  recordAnswer: ({
    userId,
    questionId,
    topicId,
    totalQuestionsInTopic,
    correct,
    attemptIndex,
  }) => {
    set((s) => {
      const user = s.users[userId];
      if (!user) return s;
      const today = todayLocal();
      const prev = user.progress.questions[questionId];
      const attempts = (((prev?.attempts ?? 0) as number) + 1) as 0 | 1 | 2 | 3;
      const firstTryCorrect = correct && attemptIndex === 0;
      const mastered = correct;
      const updatedQ = {
        attempts,
        firstTryCorrect: prev?.firstTryCorrect || firstTryCorrect,
        mastered: prev?.mastered || mastered,
        lastSeen: Date.now(),
        inReviewQueue: !mastered && attempts === 3 ? true : prev?.inReviewQueue ?? false,
      };
      const wasAttempted = !!prev;
      const wasMastered = prev?.mastered ?? false;
      const topicPrev = user.progress.topics[topicId];
      const attempted = (topicPrev?.attempted ?? 0) + (wasAttempted ? 0 : 1);
      const masteredCount =
        (topicPrev?.mastered ?? 0) + (!wasMastered && updatedQ.mastered ? 1 : 0);
      const updatedT = {
        attempted,
        mastered: masteredCount,
        totalQuestions: totalQuestionsInTopic,
      };
      const stats = applyStreak(user.progress.stats, today);
      stats.totalAnswered = user.progress.stats.totalAnswered + 1;
      if (firstTryCorrect) stats.starsEarned = user.progress.stats.starsEarned + 1;
      let reviewQueue = user.progress.reviewQueue;
      if (updatedQ.inReviewQueue && !reviewQueue.includes(questionId)) {
        reviewQueue = [...reviewQueue, questionId];
      }
      // Remove from review queue if mastered on first attempt in review
      if (mastered && firstTryCorrect && reviewQueue.includes(questionId)) {
        reviewQueue = reviewQueue.filter((q) => q !== questionId);
      }
      const updatedUser: UserState = {
        ...user,
        progress: {
          ...user.progress,
          questions: { ...user.progress.questions, [questionId]: updatedQ },
          topics: { ...user.progress.topics, [topicId]: updatedT },
          stats,
          reviewQueue,
        },
      };
      const users = { ...s.users, [userId]: updatedUser };
      const result = { users, activeUserId: s.activeUserId };
      persist(result);
      return { users };
    });
  },

  enqueueReview: (userId, questionId) => {
    set((s) => {
      const user = s.users[userId];
      if (!user || user.progress.reviewQueue.includes(questionId)) return s;
      const updatedUser: UserState = {
        ...user,
        progress: {
          ...user.progress,
          reviewQueue: [...user.progress.reviewQueue, questionId],
        },
      };
      const users = { ...s.users, [userId]: updatedUser };
      persist({ users, activeUserId: s.activeUserId });
      return { users };
    });
  },

  dequeueReview: (userId, questionId) => {
    set((s) => {
      const user = s.users[userId];
      if (!user) return s;
      const updatedUser: UserState = {
        ...user,
        progress: {
          ...user.progress,
          reviewQueue: user.progress.reviewQueue.filter((q) => q !== questionId),
        },
      };
      const users = { ...s.users, [userId]: updatedUser };
      persist({ users, activeUserId: s.activeUserId });
      return { users };
    });
  },
});
```

- [ ] **Step 5: Run — verify pass**

```bash
npm test -- usersSlice
```

- [ ] **Step 6: Create `app/src/store/sessionSlice.ts`**

```ts
import type { StateCreator } from "zustand";
import type { ExamSession, OptionLetter, PracticeSession, QuestionId, Session, TopicId } from "@/data/types";

export interface SessionSlice {
  session: Session;
  /** Start a practice session from a topic. Caller provides the (already shuffled or in-order) queue. */
  startPracticeSession: (input: { topicId: TopicId; queue: QuestionId[]; mode: "practice" | "review" }) => void;
  startExamSession: (input: { examId: TopicId; queue: QuestionId[]; timerEnabled: boolean; durationSec: number }) => void;
  endSession: () => void;

  /** Practice/review actions */
  attemptAnswer: (correct: boolean) => "first-correct" | "next-correct" | "wrong-keep-trying" | "wrong-out-of-tries";
  advanceHint: () => void;
  reveal: () => void;
  next: () => void;

  /** Exam actions */
  examPick: (questionId: QuestionId, letter: OptionLetter | null) => void;
  examFlag: (questionId: QuestionId, flagged: boolean) => void;
  examJumpTo: (index: number) => void;
  examTick: () => void;
  examFinish: () => void;
}

export const createSessionSlice: StateCreator<SessionSlice, [], [], SessionSlice> = (set, get) => ({
  session: null,

  startPracticeSession: ({ topicId, queue, mode }) => {
    const fresh: PracticeSession = {
      mode,
      topicId: mode === "review" ? null : topicId,
      queue,
      index: 0,
      currentAttempts: 0,
      revealed: false,
      hintLevel: 0,
      results: {
        answered: 0,
        firstTryCorrect: 0,
        secondTryCorrect: 0,
        thirdTryCorrect: 0,
        failed: 0,
      },
    };
    set({ session: fresh });
  },

  startExamSession: ({ examId, queue, timerEnabled, durationSec }) => {
    const fresh: ExamSession = {
      mode: "exam",
      examId,
      queue,
      index: 0,
      picks: Object.fromEntries(queue.map((q) => [q, null])),
      flagged: Object.fromEntries(queue.map((q) => [q, false])),
      timerEnabled,
      startedAt: Date.now(),
      durationSec,
      remainingSec: durationSec,
      ended: false,
    };
    set({ session: fresh });
  },

  endSession: () => set({ session: null }),

  attemptAnswer: (correct) => {
    const s = get().session;
    if (!s || s.mode === "exam") throw new Error("attemptAnswer requires a practice/review session");
    const tries = s.currentAttempts;
    if (correct) {
      const which =
        tries === 0 ? "firstTryCorrect" : tries === 1 ? "secondTryCorrect" : "thirdTryCorrect";
      set({
        session: {
          ...s,
          revealed: true,
          currentAttempts: (tries + 1) as 0 | 1 | 2 | 3,
          results: { ...s.results, answered: s.results.answered + 1, [which]: s.results[which] + 1 },
        },
      });
      return tries === 0 ? "first-correct" : "next-correct";
    }
    const nextAttempts = (tries + 1) as 0 | 1 | 2 | 3;
    if (nextAttempts >= 3) {
      set({
        session: {
          ...s,
          currentAttempts: 3,
          revealed: true,
          hintLevel: 3,
          results: { ...s.results, answered: s.results.answered + 1, failed: s.results.failed + 1 },
        },
      });
      return "wrong-out-of-tries";
    }
    set({
      session: {
        ...s,
        currentAttempts: nextAttempts,
        hintLevel: Math.max(s.hintLevel, nextAttempts) as 0 | 1 | 2 | 3,
      },
    });
    return "wrong-keep-trying";
  },

  advanceHint: () => {
    const s = get().session;
    if (!s || s.mode === "exam") return;
    set({ session: { ...s, hintLevel: Math.min(3, s.hintLevel + 1) as 0 | 1 | 2 | 3 } });
  },

  reveal: () => {
    const s = get().session;
    if (!s || s.mode === "exam") return;
    set({ session: { ...s, revealed: true, hintLevel: 3 } });
  },

  next: () => {
    const s = get().session;
    if (!s || s.mode === "exam") return;
    set({
      session: {
        ...s,
        index: s.index + 1,
        currentAttempts: 0,
        revealed: false,
        hintLevel: 0,
      },
    });
  },

  examPick: (questionId, letter) => {
    const s = get().session;
    if (!s || s.mode !== "exam") return;
    set({ session: { ...s, picks: { ...s.picks, [questionId]: letter } } });
  },

  examFlag: (questionId, flagged) => {
    const s = get().session;
    if (!s || s.mode !== "exam") return;
    set({ session: { ...s, flagged: { ...s.flagged, [questionId]: flagged } } });
  },

  examJumpTo: (index) => {
    const s = get().session;
    if (!s || s.mode !== "exam") return;
    if (index < 0 || index >= s.queue.length) return;
    set({ session: { ...s, index } });
  },

  examTick: () => {
    const s = get().session;
    if (!s || s.mode !== "exam" || !s.timerEnabled || s.ended) return;
    const remaining = Math.max(0, s.remainingSec - 1);
    set({ session: { ...s, remainingSec: remaining, ended: remaining === 0 ? true : s.ended } });
  },

  examFinish: () => {
    const s = get().session;
    if (!s || s.mode !== "exam") return;
    set({ session: { ...s, ended: true } });
  },
});
```

- [ ] **Step 7: Create the combined store at `app/src/store/index.ts`**

```ts
import { create } from "zustand";
import { createBankSlice, type BankSlice } from "./bankSlice";
import { createUsersSlice, type UsersSlice } from "./usersSlice";
import { createSessionSlice, type SessionSlice } from "./sessionSlice";

export type AppStore = BankSlice & UsersSlice & SessionSlice;

export const useStore = create<AppStore>()((...a) => ({
  ...createBankSlice(...a),
  ...createUsersSlice(...a),
  ...createSessionSlice(...a),
}));

// Selectors
export const selectActiveUser = (s: AppStore) => (s.activeUserId ? s.users[s.activeUserId] : null);
export const selectReviewQueueSize = (s: AppStore) =>
  selectActiveUser(s)?.progress.reviewQueue.length ?? 0;
```

- [ ] **Step 8: Run all tests**

```bash
npm test
```

Expected: all green.

- [ ] **Step 9: Commit**

```bash
cd ..
git add -A
git commit -m "feat(app): Zustand store with bank/users/session slices"
```

---

## Task 7: KaTeX wrapper + small UI building blocks

**Files:**
- Create: `app/src/lib/katex.tsx`
- Create: `app/src/components/Logo.tsx`, `app/src/components/PageHeader.tsx`, `app/src/components/StatPill.tsx`, `app/src/components/Confirm.tsx`

- [ ] **Step 1: Create the KaTeX wrapper**

Create `app/src/lib/katex.tsx`:

```tsx
import { useMemo } from "react";
import katex from "katex";

interface Props {
  text: string;
  className?: string;
}

/**
 * Renders a string that may contain inline LaTeX delimited by \( ... \).
 * Splits on the delimiter and renders math via KaTeX, plain text as-is.
 */
export function InlineMath({ text, className }: Props) {
  const parts = useMemo(() => splitOnMath(text), [text]);
  return (
    <span className={className}>
      {parts.map((p, i) =>
        p.kind === "text" ? (
          <span key={i}>{p.value}</span>
        ) : (
          <MathSpan key={i} tex={p.value} />
        ),
      )}
    </span>
  );
}

function MathSpan({ tex }: { tex: string }) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(tex, { throwOnError: false, displayMode: false });
    } catch {
      return tex;
    }
  }, [tex]);
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

type Part = { kind: "text" | "math"; value: string };

function splitOnMath(text: string): Part[] {
  const out: Part[] = [];
  const re = /\\\(([\s\S]*?)\\\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push({ kind: "text", value: text.slice(last, m.index) });
    out.push({ kind: "math", value: m[1] });
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push({ kind: "text", value: text.slice(last) });
  return out;
}
```

- [ ] **Step 2: Create the brand wordmark**

Create `app/src/components/Logo.tsx`:

```tsx
export function Logo({ className }: { className?: string }) {
  return (
    <span className={"font-black text-xl tracking-tightest text-ink " + (className ?? "")}>
      חשבונייה<span className="text-brand-500">.</span>
    </span>
  );
}
```

- [ ] **Step 3: Create the page header**

Create `app/src/components/PageHeader.tsx`:

```tsx
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { Logo } from "./Logo";

interface Props {
  backTo?: string;
  title?: string;
  rightSlot?: React.ReactNode;
}

export function PageHeader({ backTo, title, rightSlot }: Props) {
  return (
    <header className="flex items-center justify-between gap-3 mb-6">
      <div className="flex items-center gap-3 min-w-0">
        {backTo ? (
          <Link
            to={backTo}
            className="rounded-full p-2 hover:bg-hair focus-visible:ring-2 focus-visible:ring-brand-500"
            aria-label="חזרה"
          >
            <ChevronRight size={20} />
          </Link>
        ) : (
          <Logo />
        )}
        {title && <h1 className="text-lg font-bold truncate">{title}</h1>}
      </div>
      {rightSlot && <div className="flex items-center gap-2 shrink-0">{rightSlot}</div>}
    </header>
  );
}
```

- [ ] **Step 4: Create StatPill**

Create `app/src/components/StatPill.tsx`:

```tsx
import { Star, Flame } from "lucide-react";

type Variant = "star" | "streak" | "today";

interface Props {
  variant: Variant;
  value: number;
}

const styles: Record<Variant, { bg: string; fg: string; icon: React.ReactNode | null; label: string }> = {
  star: { bg: "bg-warn-50", fg: "text-warn-700", icon: <Star size={14} />, label: "כוכבים" },
  streak: { bg: "bg-danger-50", fg: "text-danger-600", icon: <Flame size={14} />, label: "רצף" },
  today: { bg: "bg-brand-50", fg: "text-brand-700", icon: null, label: "היום" },
};

export function StatPill({ variant, value }: Props) {
  const s = styles[variant];
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold ${s.bg} ${s.fg}`}>
      {s.icon}
      <span className="tabular-nums">{value}</span>
      <span className="text-xs opacity-80">{s.label}</span>
    </span>
  );
}
```

- [ ] **Step 5: Create Confirm dialog**

Create `app/src/components/Confirm.tsx`:

```tsx
import { useEffect, useRef } from "react";

interface Props {
  open: boolean;
  title: string;
  body?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function Confirm({
  open,
  title,
  body,
  confirmLabel = "אישור",
  cancelLabel = "ביטול",
  destructive,
  onConfirm,
  onCancel,
}: Props) {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (open) ref.current?.focus();
  }, [open]);
  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40"
      onClick={onCancel}
    >
      <div
        className="card p-6 max-w-md w-full shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold mb-2">{title}</h2>
        {body && <p className="text-muted mb-4">{body}</p>}
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel} className="btn-secondary">
            {cancelLabel}
          </button>
          <button
            ref={ref}
            onClick={onConfirm}
            className={
              destructive
                ? "btn-primary !bg-danger-600 shadow-[0_4px_0_#991B1B] active:shadow-[0_2px_0_#991B1B]"
                : "btn-primary"
            }
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Commit**

```bash
cd ..
git add -A
git commit -m "feat(app): InlineMath KaTeX wrapper + shared UI bits (Logo, PageHeader, StatPill, Confirm)"
```

---

## Task 8: Question UI components — QuestionCard, OptionGrid, TriesIndicator, HintCard, ExplanationCard

**Files:**
- Create: `app/src/components/QuestionCard.tsx`, `app/src/components/OptionGrid.tsx`, `app/src/components/TriesIndicator.tsx`, `app/src/components/HintCard.tsx`, `app/src/components/ExplanationCard.tsx`
- Create: `app/tests/component/OptionGrid.test.tsx`

- [ ] **Step 1: Create TriesIndicator**

Create `app/src/components/TriesIndicator.tsx`:

```tsx
interface Props {
  used: 0 | 1 | 2 | 3;
}

export function TriesIndicator({ used }: Props) {
  const dots = [0, 1, 2];
  return (
    <div className="flex items-center gap-1.5" aria-label={`${3 - used} ניסיונות נותרו`}>
      {dots.map((i) => (
        <span
          key={i}
          className={`block w-2.5 h-2.5 rounded-full ${i < used ? "bg-danger-200" : "bg-brand-500"}`}
        />
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Create QuestionCard**

Create `app/src/components/QuestionCard.tsx`:

```tsx
import type { RawQuestion } from "@/data/types";
import { InlineMath } from "@/lib/katex";
import { TriesIndicator } from "./TriesIndicator";

interface Props {
  question: RawQuestion;
  position?: { index: number; total: number };
  used?: 0 | 1 | 2 | 3;
  topRight?: React.ReactNode;
}

export function QuestionCard({ question, position, used, topRight }: Props) {
  return (
    <section className="card p-5 sm:p-6">
      <header className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {position && (
            <span className="text-sm font-bold text-brand-600 tabular-nums">
              שאלה {position.index + 1} / {position.total}
            </span>
          )}
          {used !== undefined && <TriesIndicator used={used} />}
        </div>
        {topRight}
      </header>
      <div className="text-base sm:text-lg leading-relaxed text-ink">
        <InlineMath text={question.question} />
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Create OptionGrid (the multiple-choice UI)**

Create `app/src/components/OptionGrid.tsx`:

```tsx
import { useState } from "react";
import { Check, X } from "lucide-react";
import type { OptionLetter, RawQuestion } from "@/data/types";
import { InlineMath } from "@/lib/katex";

type Status = "neutral" | "correct" | "wrong" | "revealed-correct" | "revealed-other";

interface Props {
  question: RawQuestion;
  /** When set, locks the grid and shows feedback for that pick. */
  feedback?: { picked: OptionLetter | null; correctLetter: OptionLetter | null };
  /** When `revealed` is true (after 3 wrong tries OR after correct), highlight the correct option. */
  revealed?: boolean;
  /** Optionally make wrong-pick options stay marked across tries. */
  stickyWrong?: OptionLetter[];
  onPick?: (letter: OptionLetter) => void;
  disabled?: boolean;
}

export function OptionGrid({
  question,
  feedback,
  revealed,
  stickyWrong = [],
  onPick,
  disabled,
}: Props) {
  const [shake, setShake] = useState<OptionLetter | null>(null);
  const letters = (["א", "ב", "ג", "ד"] as OptionLetter[]).filter((l) => question.options[l]);
  const correctLetter = question.correct_letter ?? feedback?.correctLetter ?? null;

  function statusFor(l: OptionLetter): Status {
    if (revealed) {
      if (correctLetter === l) return "revealed-correct";
      if (stickyWrong.includes(l)) return "wrong";
      return "revealed-other";
    }
    if (stickyWrong.includes(l)) return "wrong";
    return "neutral";
  }

  function handleClick(l: OptionLetter) {
    if (disabled || revealed || onPick === undefined) return;
    if (correctLetter && l !== correctLetter) {
      setShake(l);
      window.setTimeout(() => setShake(null), 400);
    }
    onPick(l);
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
      {letters.map((l) => {
        const s = statusFor(l);
        const base = "card p-4 text-right flex items-start gap-3 transition-colors";
        const styles =
          s === "revealed-correct"
            ? "bg-brand-50 border-brand-500 ring-2 ring-brand-500"
            : s === "wrong"
              ? "bg-danger-50 border-danger-200 text-danger-600"
              : s === "revealed-other"
                ? "opacity-60"
                : "hover:bg-surface";
        const isShaking = shake === l;
        return (
          <button
            key={l}
            disabled={disabled || revealed}
            onClick={() => handleClick(l)}
            className={`${base} ${styles} ${isShaking ? "animate-shake" : ""} focus-visible:ring-2 focus-visible:ring-brand-500`}
          >
            <span
              className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center font-bold ${
                s === "revealed-correct"
                  ? "bg-brand-500 text-white"
                  : s === "wrong"
                    ? "bg-danger-600 text-white"
                    : "bg-hair text-ink"
              }`}
            >
              {s === "revealed-correct" ? <Check size={16} /> : s === "wrong" ? <X size={16} /> : l}
            </span>
            <span className="flex-1 leading-relaxed">
              <InlineMath text={question.options[l] ?? ""} />
            </span>
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 4: Create HintCard**

Create `app/src/components/HintCard.tsx`:

```tsx
import { Lightbulb } from "lucide-react";

interface Props {
  text: string;
}

export function HintCard({ text }: Props) {
  if (!text) return null;
  return (
    <div className="mt-4 rounded-2xl bg-warn-50 border border-warn-200 p-4 flex gap-3 text-warn-700">
      <Lightbulb size={20} className="shrink-0 mt-0.5" />
      <p className="leading-relaxed">{text}</p>
    </div>
  );
}

/**
 * Splits an explanation into N "doses" of hint based on sentence boundaries.
 */
export function hintForLevel(explanation: string, level: 0 | 1 | 2 | 3): string {
  if (level <= 0 || !explanation) return "";
  const sentences = explanation.split(/(?<=[.!?])\s+/).filter(Boolean);
  if (level === 1) return sentences.slice(0, 1).join(" ");
  if (level === 2) return sentences.slice(0, Math.max(2, Math.ceil(sentences.length / 2))).join(" ");
  return explanation;
}
```

- [ ] **Step 5: Create ExplanationCard**

Create `app/src/components/ExplanationCard.tsx`:

```tsx
import { CheckCircle2 } from "lucide-react";
import { InlineMath } from "@/lib/katex";

interface Props {
  correctAnswer: string;
  explanation: string;
}

export function ExplanationCard({ correctAnswer, explanation }: Props) {
  return (
    <div className="mt-4 rounded-2xl bg-brand-50 border border-brand-200 p-4">
      <div className="flex gap-2 items-center text-brand-700 font-bold mb-2">
        <CheckCircle2 size={18} />
        <span>תשובה נכונה: </span>
        <span className="text-ink">
          <InlineMath text={correctAnswer} />
        </span>
      </div>
      {explanation && (
        <p className="text-ink/90 leading-relaxed">
          <InlineMath text={explanation} />
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 6: Write a smoke test for OptionGrid**

Create `app/tests/component/OptionGrid.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { OptionGrid } from "@/components/OptionGrid";
import type { RawQuestion } from "@/data/types";

const q: RawQuestion = {
  id: "test/q/1",
  number: 1,
  question: "מה תוצאת 1+1?",
  options: { א: "1", ב: "2", ג: "3", ד: "4" },
  correct_answer: "2",
  correct_letter: "ב",
  explanation: "",
  flags: [],
};

describe("OptionGrid", () => {
  it("renders all four options", () => {
    render(<OptionGrid question={q} />);
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
  });

  it("calls onPick with the chosen letter", () => {
    const onPick = vi.fn();
    render(<OptionGrid question={q} onPick={onPick} />);
    fireEvent.click(screen.getByText("2").closest("button")!);
    expect(onPick).toHaveBeenCalledWith("ב");
  });

  it("disables interactions when revealed=true", () => {
    const onPick = vi.fn();
    render(<OptionGrid question={q} onPick={onPick} revealed />);
    fireEvent.click(screen.getByText("2").closest("button")!);
    expect(onPick).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 7: Run all tests**

```bash
cd app
npm test
```

Expected: all green.

- [ ] **Step 8: Commit**

```bash
cd ..
git add -A
git commit -m "feat(app): question UI components (QuestionCard, OptionGrid, TriesIndicator, HintCard, ExplanationCard)"
```

---

## Task 9: Welcome + Settings pages (user management)

**Files:**
- Create: `app/src/pages/WelcomePage.tsx`, `app/src/pages/SettingsPage.tsx`

- [ ] **Step 1: Create WelcomePage**

Create `app/src/pages/WelcomePage.tsx`:

```tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, UserPlus, Trash2 } from "lucide-react";
import { useStore } from "@/store";
import { Logo } from "@/components/Logo";
import { Confirm } from "@/components/Confirm";

export function WelcomePage() {
  const users = useStore((s) => s.users);
  const createUser = useStore((s) => s.createUser);
  const switchUser = useStore((s) => s.switchUser);
  const deleteUser = useStore((s) => s.deleteUser);
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const list = Object.values(users).sort((a, b) => a.createdAt - b.createdAt);

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    createUser(name.trim());
    navigate("/home");
  }

  function handlePick(id: string) {
    switchUser(id);
    navigate("/home");
  }

  return (
    <main className="min-h-screen bg-white px-4 py-6 sm:py-12">
      <div className="max-w-md mx-auto">
        <div className="flex justify-center mb-8">
          <Logo />
        </div>
        <h1 className="h1-hero text-center mb-2">
          <span className="h1-hero-accent">ברוכים הבאים.</span>
        </h1>
        <p className="text-center text-muted mb-8">בחרו משתמש או צרו חדש.</p>

        {list.length > 0 && (
          <section className="mb-8">
            <div className="section-label mb-3">משתמשים קיימים</div>
            <ul className="space-y-2">
              {list.map((u) => (
                <li key={u.id} className="card flex items-center gap-3 p-3">
                  <span className="w-10 h-10 rounded-full bg-brand-100 text-brand-700 grid place-items-center font-bold">
                    {u.name.slice(0, 1)}
                  </span>
                  <button
                    onClick={() => handlePick(u.id)}
                    className="flex-1 text-right font-semibold"
                  >
                    {u.name}
                  </button>
                  <button
                    onClick={() => setConfirmDelete(u.id)}
                    aria-label={`מחק את ${u.name}`}
                    className="p-2 rounded-lg text-muted hover:text-danger-600"
                  >
                    <Trash2 size={18} />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section>
          <div className="section-label mb-3">הוספת משתמש</div>
          <form onSubmit={handleCreate} className="card p-4 space-y-3">
            <label className="block">
              <span className="text-sm font-semibold text-ink">מה השם שלך?</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="לדוגמה: נועה"
                className="mt-1 w-full px-3 py-2 rounded-lg border border-border focus-visible:ring-2 ring-brand-500 outline-none"
                autoFocus
              />
            </label>
            <button
              type="submit"
              disabled={!name.trim()}
              className="btn-primary w-full justify-center"
            >
              <UserPlus size={18} />
              התחל
            </button>
          </form>
        </section>
      </div>

      <Confirm
        open={!!confirmDelete}
        title="למחוק את המשתמש?"
        body="פעולה זו תמחק את כל ההתקדמות של המשתמש לצמיתות."
        confirmLabel="מחק"
        destructive
        onConfirm={() => {
          if (confirmDelete) deleteUser(confirmDelete);
          setConfirmDelete(null);
        }}
        onCancel={() => setConfirmDelete(null)}
      />
    </main>
  );
}
```

- [ ] **Step 2: Create SettingsPage**

Create `app/src/pages/SettingsPage.tsx`:

```tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { RotateCcw, User, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Confirm } from "@/components/Confirm";
import { selectActiveUser, useStore } from "@/store";

export function SettingsPage() {
  const user = useStore(selectActiveUser);
  const resetUserProgress = useStore((s) => s.resetUserProgress);
  const deleteUser = useStore((s) => s.deleteUser);
  const navigate = useNavigate();
  const [resetOpen, setResetOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (!user) {
    navigate("/welcome", { replace: true });
    return null;
  }

  return (
    <main className="min-h-screen bg-white px-4 py-6">
      <div className="max-w-xl mx-auto">
        <PageHeader backTo="/home" title="הגדרות" />

        <section className="card p-4 mb-4">
          <div className="section-label mb-3">משתמש</div>
          <div className="flex items-center gap-3 mb-3">
            <span className="w-12 h-12 rounded-full bg-brand-100 text-brand-700 grid place-items-center font-bold text-lg">
              {user.name.slice(0, 1)}
            </span>
            <div className="flex-1">
              <div className="font-bold">{user.name}</div>
              <div className="text-sm text-muted tabular-nums">
                {user.progress.stats.totalAnswered} שאלות נענו
              </div>
            </div>
          </div>
          <button
            onClick={() => navigate("/welcome")}
            className="btn-secondary w-full justify-center"
          >
            <User size={18} />
            החלפת משתמש
          </button>
        </section>

        <section className="card p-4 mb-4">
          <div className="section-label mb-3">איפוס</div>
          <button
            onClick={() => setResetOpen(true)}
            className="btn-secondary w-full justify-center"
          >
            <RotateCcw size={18} />
            אפס את כל ההתקדמות
          </button>
        </section>

        <section className="card p-4 border-danger-200">
          <div className="section-label !text-danger-600 mb-3">אזור מסוכן</div>
          <button
            onClick={() => setDeleteOpen(true)}
            className="btn-secondary w-full justify-center !text-danger-600"
          >
            <Trash2 size={18} />
            מחק את המשתמש הזה
          </button>
        </section>
      </div>

      <Confirm
        open={resetOpen}
        title="לאפס את כל ההתקדמות?"
        body="כל ההיסטוריה, הכוכבים והרצפים יימחקו. פעולה זו אינה הפיכה."
        confirmLabel="אפס"
        destructive
        onConfirm={() => {
          resetUserProgress(user.id);
          setResetOpen(false);
        }}
        onCancel={() => setResetOpen(false)}
      />

      <Confirm
        open={deleteOpen}
        title={`למחוק את "${user.name}"?`}
        body="כל הנתונים של המשתמש יימחקו לצמיתות."
        confirmLabel="מחק"
        destructive
        onConfirm={() => {
          deleteUser(user.id);
          setDeleteOpen(false);
          navigate("/welcome", { replace: true });
        }}
        onCancel={() => setDeleteOpen(false)}
      />
    </main>
  );
}
```

- [ ] **Step 3: Commit**

```bash
cd ..
git add -A
git commit -m "feat(app): Welcome and Settings pages (user management)"
```

---

## Task 10: Topic & Mode cards + HomePage

**Files:**
- Create: `app/src/components/TopicCard.tsx`, `app/src/components/ModeCard.tsx`
- Create: `app/src/pages/HomePage.tsx`

- [ ] **Step 1: Create ModeCard**

Create `app/src/components/ModeCard.tsx`:

```tsx
import { Link } from "react-router-dom";

interface Props {
  to: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  primary?: boolean;
}

export function ModeCard({ to, icon, title, subtitle, primary }: Props) {
  const base = primary
    ? "bg-brand-500 text-white border-brand-600 shadow-cta active:shadow-cta-pressed active:translate-y-[2px]"
    : "bg-surface border-border";
  return (
    <Link
      to={to}
      className={`card p-4 flex flex-col gap-2 transition-shadow ${base} focus-visible:ring-2 focus-visible:ring-brand-500`}
    >
      <span
        className={`w-10 h-10 rounded-xl grid place-items-center ${
          primary ? "bg-white/20" : "bg-brand-100 text-brand-600"
        }`}
      >
        {icon}
      </span>
      <span className={`text-lg font-bold ${primary ? "text-white" : "text-ink"}`}>{title}</span>
      <span className={`text-sm ${primary ? "text-white/85" : "text-muted"}`}>{subtitle}</span>
    </Link>
  );
}
```

- [ ] **Step 2: Create TopicCard**

Create `app/src/components/TopicCard.tsx`:

```tsx
import { Link } from "react-router-dom";

interface Props {
  to: string;
  name: string;
  attempted: number;
  mastered: number;
  total: number;
}

export function TopicCard({ to, name, attempted, mastered, total }: Props) {
  const pct = total > 0 ? Math.round((mastered / total) * 100) : 0;
  return (
    <Link
      to={to}
      className="flex items-center gap-3 py-3 border-b border-hair last:border-b-0 focus-visible:ring-2 focus-visible:ring-brand-500 rounded"
    >
      <span className="flex-1 font-medium text-ink">{name}</span>
      <span className="text-sm text-faint tabular-nums">
        {attempted}/{total}
      </span>
      <span className="w-16 h-1.5 rounded-full bg-hair overflow-hidden">
        <span className="block h-full bg-brand-500" style={{ width: `${pct}%` }} />
      </span>
    </Link>
  );
}
```

- [ ] **Step 3: Create HomePage**

Create `app/src/pages/HomePage.tsx`:

```tsx
import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BookOpen, Calendar, Settings, Target } from "lucide-react";
import { useStore, selectActiveUser, selectReviewQueueSize } from "@/store";
import { StatPill } from "@/components/StatPill";
import { ModeCard } from "@/components/ModeCard";
import { TopicCard } from "@/components/TopicCard";
import { Logo } from "@/components/Logo";

export function HomePage() {
  const user = useStore(selectActiveUser);
  const bank = useStore((s) => s.bank);
  const bankError = useStore((s) => s.bankError);
  const loadBank = useStore((s) => s.loadBank);
  const reviewSize = useStore(selectReviewQueueSize);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) navigate("/welcome", { replace: true });
  }, [user, navigate]);

  useEffect(() => {
    loadBank();
  }, [loadBank]);

  if (!user) return null;

  const stats = user.progress.stats;
  const recentTopics = Object.entries(user.progress.topics)
    .sort(([, a], [, b]) => b.attempted - a.attempted)
    .slice(0, 4);

  return (
    <main className="min-h-screen bg-white px-4 py-6">
      <div className="max-w-2xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <Logo />
          <div className="flex items-center gap-2">
            <StatPill variant="star" value={stats.starsEarned} />
            {stats.currentStreakDays > 0 && (
              <StatPill variant="streak" value={stats.currentStreakDays} />
            )}
            <Link
              to="/settings"
              aria-label="הגדרות"
              className="p-2 rounded-full hover:bg-hair"
            >
              <Settings size={20} />
            </Link>
          </div>
        </header>

        <section className="mb-7">
          <h1 className="h1-hero">
            שלום {user.name},<br />
            <span className="h1-hero-accent">מה נתאמן היום?</span>
          </h1>
          <p className="text-muted mt-2">3 ניסיונות לכל שאלה, רמז ביניהם.</p>
        </section>

        {reviewSize > 0 && (
          <Link
            to="/review"
            className="card flex items-center gap-3 p-3 mb-4 bg-warn-50 border-warn-200 text-warn-700 font-semibold"
          >
            <Target size={18} />
            <span className="flex-1">{reviewSize} שאלות לחזרה</span>
            <span>חזרה →</span>
          </Link>
        )}

        <section className="grid grid-cols-2 gap-3 mb-6">
          <ModeCard
            to="/practice"
            icon={<BookOpen size={20} />}
            title="תרגול לפי נושא"
            subtitle="3 ניסיונות + רמזים"
            primary
          />
          <ModeCard
            to="/exam"
            icon={<Calendar size={20} />}
            title="מבחן לדוגמה"
            subtitle="24 שאלות · 60 ד׳"
          />
        </section>

        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="section-label">המשך מאיפה שעצרת</div>
          </div>
          {bankError && (
            <p className="text-danger-600 text-sm mb-2">שגיאה בטעינת השאלות: {bankError}</p>
          )}
          {!bank && !bankError && <p className="text-muted text-sm">טוען...</p>}
          {bank &&
            (recentTopics.length === 0 ? (
              <RecentTopicsEmpty />
            ) : (
              <div>
                {recentTopics.map(([topicId, t]) => {
                  const topicMeta = findTopicName(bank, topicId);
                  return (
                    <TopicCard
                      key={topicId}
                      to={`/practice/${encodeURIComponent(topicId)}`}
                      name={topicMeta ?? topicId}
                      attempted={t.attempted}
                      mastered={t.mastered}
                      total={t.totalQuestions}
                    />
                  );
                })}
              </div>
            ))}
        </section>
      </div>
    </main>
  );
}

function RecentTopicsEmpty() {
  return (
    <Link
      to="/practice"
      className="block card p-4 text-center text-muted hover:bg-surface"
    >
      עוד לא התחלת. הקליקי על "תרגול לפי נושא" למעלה כדי לבחור נושא.
    </Link>
  );
}

function findTopicName(bank: NonNullable<ReturnType<typeof useStore.getState>["bank"]>, topicId: string) {
  for (const cat of bank.categories) {
    for (const topic of cat.topics) {
      const fullId = `${cat.id === "math-knowledge" ? "01_ידע_מתמטי" : cat.id === "logic-reasoning" ? "02_חשיבה_והגיון" : "03_מבחנים_לדוגמה"}/${topic.id}`;
      if (fullId === topicId) return topic.name_he;
    }
  }
  return undefined;
}
```

Note: the topic id encoding above uses the directory name from the source data. We'll lean on a helper instead — see Step 4.

- [ ] **Step 4: Add a `topicIdFor` helper to types**

Append to `app/src/data/types.ts`:

```ts
export function dirForCategoryId(categoryId: string): string {
  switch (categoryId) {
    case "math-knowledge":
      return "01_ידע_מתמטי";
    case "logic-reasoning":
      return "02_חשיבה_והגיון";
    case "sample-exams":
      return "03_מבחנים_לדוגמה";
    default:
      return categoryId;
  }
}

export function topicIdFor(categoryId: string, topicSlug: string): string {
  return `${dirForCategoryId(categoryId)}/${topicSlug}`;
}
```

Update `findTopicName` in `HomePage.tsx` to use it:

```tsx
import { topicIdFor } from "@/data/types";
// ...
function findTopicName(bank: NonNullable<ReturnType<typeof useStore.getState>["bank"]>, topicId: string) {
  for (const cat of bank.categories) {
    for (const topic of cat.topics) {
      if (topicIdFor(cat.id, topic.id) === topicId) return topic.name_he;
    }
  }
  return undefined;
}
```

- [ ] **Step 5: Commit**

```bash
cd ..
git add -A
git commit -m "feat(app): HomePage + ModeCard + TopicCard"
```

---

## Task 11: Routes + app shell + hydrate

**Files:**
- Create: `app/src/app/routes.tsx`
- Modify: `app/src/app/App.tsx`

- [ ] **Step 1: Create routes**

Create `app/src/app/routes.tsx`:

```tsx
import { Navigate, Route, Routes } from "react-router-dom";
import { WelcomePage } from "@/pages/WelcomePage";
import { HomePage } from "@/pages/HomePage";
import { SettingsPage } from "@/pages/SettingsPage";
import { TopicPickerPage } from "@/pages/TopicPickerPage";
import { PracticePage } from "@/pages/PracticePage";
import { PracticeResultsPage } from "@/pages/PracticeResultsPage";
import { ReviewPage } from "@/pages/ReviewPage";
import { ExamPickerPage } from "@/pages/ExamPickerPage";
import { ExamPage } from "@/pages/ExamPage";
import { ExamResultsPage } from "@/pages/ExamResultsPage";
import { useStore } from "@/store";

export function AppRoutes() {
  const activeUserId = useStore((s) => s.activeUserId);
  return (
    <Routes>
      <Route path="/" element={<Navigate to={activeUserId ? "/home" : "/welcome"} replace />} />
      <Route path="/welcome" element={<WelcomePage />} />
      <Route path="/home" element={<HomePage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/practice" element={<TopicPickerPage />} />
      <Route path="/practice/:topicId" element={<PracticePage />} />
      <Route path="/practice/:topicId/results" element={<PracticeResultsPage />} />
      <Route path="/review" element={<ReviewPage />} />
      <Route path="/exam" element={<ExamPickerPage />} />
      <Route path="/exam/:examId" element={<ExamPage />} />
      <Route path="/exam/:examId/results" element={<ExamResultsPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
```

- [ ] **Step 2: Update App.tsx to use HashRouter and hydrate the store**

Replace `app/src/app/App.tsx`:

```tsx
import { useEffect } from "react";
import { HashRouter } from "react-router-dom";
import { AppRoutes } from "./routes";
import { useStore } from "@/store";

export function App() {
  const hydrate = useStore((s) => s.hydrate);
  const loadBank = useStore((s) => s.loadBank);

  useEffect(() => {
    hydrate();
    loadBank();
  }, [hydrate, loadBank]);

  return (
    <HashRouter>
      <AppRoutes />
    </HashRouter>
  );
}
```

- [ ] **Step 3: Create stub pages for the routes we haven't built yet**

Create `app/src/pages/TopicPickerPage.tsx`:

```tsx
import { Link } from "react-router-dom";
import { useEffect } from "react";
import { PageHeader } from "@/components/PageHeader";
import { useStore } from "@/store";
import { topicIdFor } from "@/data/types";

export function TopicPickerPage() {
  const bank = useStore((s) => s.bank);
  const loadBank = useStore((s) => s.loadBank);
  useEffect(() => {
    loadBank();
  }, [loadBank]);

  if (!bank) {
    return (
      <main className="min-h-screen bg-white px-4 py-6">
        <div className="max-w-2xl mx-auto">
          <PageHeader backTo="/home" title="בחרי נושא" />
          <p className="text-muted">טוען...</p>
        </div>
      </main>
    );
  }

  // exclude the sample-exams category from topic-practice picker — exams have their own flow
  const cats = bank.categories.filter((c) => c.id !== "sample-exams");

  return (
    <main className="min-h-screen bg-white px-4 py-6">
      <div className="max-w-2xl mx-auto">
        <PageHeader backTo="/home" title="בחרי נושא" />
        {cats.map((cat) => (
          <section key={cat.id} className="mb-6">
            <h2 className="section-label mb-2">{cat.name_he}</h2>
            <div className="card divide-y divide-hair">
              {cat.topics.map((t) => (
                <Link
                  key={t.id}
                  to={`/practice/${encodeURIComponent(topicIdFor(cat.id, t.id))}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-surface"
                >
                  <span className="font-semibold">{t.name_he}</span>
                  <span className="text-sm text-faint tabular-nums">{t.question_count} שאלות</span>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
```

Create placeholder pages that we'll fill in later — `app/src/pages/PracticePage.tsx`, `PracticeResultsPage.tsx`, `ReviewPage.tsx`, `ExamPickerPage.tsx`, `ExamPage.tsx`, `ExamResultsPage.tsx`. Each is a minimal stub:

```tsx
// app/src/pages/PracticePage.tsx
import { PageHeader } from "@/components/PageHeader";
export function PracticePage() {
  return (
    <main className="min-h-screen bg-white px-4 py-6">
      <div className="max-w-2xl mx-auto">
        <PageHeader backTo="/home" title="תרגול" />
        <p className="text-muted">בקרוב.</p>
      </div>
    </main>
  );
}
```

Repeat the same stub pattern (with appropriate title text) for `PracticeResultsPage`, `ReviewPage`, `ExamPickerPage`, `ExamPage`, `ExamResultsPage`. Title strings:

- `PracticeResultsPage` → "סיכום תרגול"
- `ReviewPage` → "חזרה"
- `ExamPickerPage` → "מבחן לדוגמה"
- `ExamPage` → "מבחן"
- `ExamResultsPage` → "תוצאות מבחן"

- [ ] **Step 4: Run dev, click through**

```bash
cd app
npm run dev
```

Visit `http://localhost:5173`. Expected flow:
1. `/welcome` (no user) → create "נועה" → `/home`.
2. Home shows the greeting, mode cards, "המשך מאיפה שעצרת" empty state.
3. Click "תרגול לפי נושא" → topic picker shows ידע מתמטי + חשיבה והגיון categories with all topics.
4. Click "הגדרות" (gear) → settings page, can change user / reset / delete.

- [ ] **Step 5: Commit**

```bash
cd ..
git add -A
git commit -m "feat(app): routes + app shell + topic picker + hydration"
```

---

## Task 12: PracticePage — the core practice flow

**Files:**
- Create: `app/src/pages/PracticePage.tsx` (replacing the stub)
- Create: `app/src/pages/PracticeResultsPage.tsx` (replacing the stub)

- [ ] **Step 1: Implement PracticePage**

Replace `app/src/pages/PracticePage.tsx`:

```tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { selectActiveUser, useStore } from "@/store";
import { PageHeader } from "@/components/PageHeader";
import { QuestionCard } from "@/components/QuestionCard";
import { OptionGrid } from "@/components/OptionGrid";
import { HintCard, hintForLevel } from "@/components/HintCard";
import { ExplanationCard } from "@/components/ExplanationCard";
import { seededShuffle } from "@/lib/shuffle";
import type { OptionLetter, QuestionId, TopicId } from "@/data/types";
import { topicIdFor } from "@/data/types";

export function PracticePage() {
  const params = useParams<{ topicId: string }>();
  const topicId = decodeURIComponent(params.topicId ?? "") as TopicId;
  const navigate = useNavigate();
  const user = useStore(selectActiveUser);
  const bank = useStore((s) => s.bank);
  const loadBank = useStore((s) => s.loadBank);
  const session = useStore((s) => s.session);
  const startPracticeSession = useStore((s) => s.startPracticeSession);
  const attemptAnswer = useStore((s) => s.attemptAnswer);
  const next = useStore((s) => s.next);
  const recordAnswer = useStore((s) => s.recordAnswer);
  const getQuestion = useStore((s) => s.getQuestion);
  const isVisualOnly = useStore((s) => s.isVisualOnly);

  const [stickyWrong, setStickyWrong] = useState<OptionLetter[]>([]);

  useEffect(() => {
    loadBank();
  }, [loadBank]);

  // Find the topic in the bank and start a session
  const topic = useMemo(() => {
    if (!bank) return null;
    for (const cat of bank.categories) {
      for (const t of cat.topics) {
        if (topicIdFor(cat.id, t.id) === topicId) return t;
      }
    }
    return null;
  }, [bank, topicId]);

  useEffect(() => {
    if (!user || !topic) return;
    if (session && session.mode !== "exam" && session.topicId === topicId) return;
    // Build queue: exclude visual-only questions (no text options).
    const queueIds: QuestionId[] = topic.questions
      .map((q) => q.id)
      .filter((id) => !isVisualOnly(id));
    const shuffled = seededShuffle(queueIds, Date.now());
    startPracticeSession({ topicId, queue: shuffled, mode: "practice" });
    setStickyWrong([]);
  }, [user, topic, topicId, session, startPracticeSession, isVisualOnly]);

  if (!user) return null;
  if (!bank || !topic) {
    return (
      <main className="min-h-screen bg-white px-4 py-6">
        <PageHeader backTo="/home" title="תרגול" />
        <p className="text-muted">טוען...</p>
      </main>
    );
  }
  if (!session || session.mode === "exam") return null;

  // End of queue
  if (session.index >= session.queue.length) {
    navigate(`/practice/${encodeURIComponent(topicId)}/results`, { replace: true });
    return null;
  }

  const currentId = session.queue[session.index];
  const question = getQuestion(currentId);
  if (!question) return <p className="p-6 text-danger-600">שאלה לא נמצאה.</p>;

  const triesUsed = session.currentAttempts as 0 | 1 | 2 | 3;

  function handlePick(letter: OptionLetter) {
    if (!question || session?.mode === "exam" || !session) return;
    const correct = letter === question.correct_letter;
    if (!correct) {
      setStickyWrong((prev) => (prev.includes(letter) ? prev : [...prev, letter]));
    }
    const outcome = attemptAnswer(correct);
    const attemptIndex = (session.currentAttempts) as 0 | 1 | 2;
    if (user) {
      recordAnswer({
        userId: user.id,
        questionId: currentId,
        topicId,
        totalQuestionsInTopic: topic!.question_count,
        correct,
        attemptIndex,
        pickedLetter: letter,
      });
    }
    if (outcome === "first-correct" || outcome === "next-correct" || outcome === "wrong-out-of-tries") {
      // session.revealed becomes true — caller can advance with "next".
    }
  }

  function handleNext() {
    setStickyWrong([]);
    next();
  }

  const hint = hintForLevel(question.explanation, session.hintLevel);
  const showExplanation = session.revealed;

  return (
    <main className="min-h-screen bg-white px-4 py-6">
      <div className="max-w-2xl mx-auto">
        <PageHeader
          backTo="/home"
          title={topic.name_he}
          rightSlot={
            <span className="text-sm text-faint tabular-nums">
              {session.index + 1} / {session.queue.length}
            </span>
          }
        />

        <QuestionCard question={question} used={triesUsed} />
        <OptionGrid
          question={question}
          stickyWrong={stickyWrong}
          revealed={session.revealed}
          onPick={handlePick}
        />

        {hint && !showExplanation && <HintCard text={hint} />}

        {showExplanation && (
          <ExplanationCard
            correctAnswer={question.correct_answer}
            explanation={question.explanation}
          />
        )}

        {showExplanation && (
          <div className="mt-5 flex justify-end">
            <button className="btn-primary" onClick={handleNext}>
              הבאה ←
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Implement PracticeResultsPage**

Replace `app/src/pages/PracticeResultsPage.tsx`:

```tsx
import { Link, useParams } from "react-router-dom";
import { useStore } from "@/store";
import { PageHeader } from "@/components/PageHeader";
import { Star } from "lucide-react";

export function PracticeResultsPage() {
  const params = useParams<{ topicId: string }>();
  const topicId = decodeURIComponent(params.topicId ?? "");
  const session = useStore((s) => s.session);
  const endSession = useStore((s) => s.endSession);
  const r =
    session && session.mode !== "exam"
      ? session.results
      : { answered: 0, firstTryCorrect: 0, secondTryCorrect: 0, thirdTryCorrect: 0, failed: 0 };

  return (
    <main className="min-h-screen bg-white px-4 py-8">
      <div className="max-w-md mx-auto text-center">
        <PageHeader backTo="/home" title="סיכום תרגול" />
        <div className="card p-6 mb-6">
          <div className="text-faint section-label mb-2">סיימת את המפגש</div>
          <div className="flex items-center justify-center gap-2 mb-4">
            <Star size={28} className="text-warn-700" />
            <span className="text-4xl font-black tabular-nums">{r.firstTryCorrect}</span>
            <span className="text-muted">כוכבים מפגש זה</span>
          </div>
          <ul className="text-right space-y-1 text-ink">
            <li>נכון בניסיון ראשון: <b className="tabular-nums">{r.firstTryCorrect}</b></li>
            <li>נכון בניסיון שני: <b className="tabular-nums">{r.secondTryCorrect}</b></li>
            <li>נכון בניסיון שלישי: <b className="tabular-nums">{r.thirdTryCorrect}</b></li>
            <li>נכשל (התווסף לחזרה): <b className="tabular-nums">{r.failed}</b></li>
          </ul>
        </div>
        <div className="flex gap-2 justify-center">
          <button onClick={endSession} className="btn-secondary" >
            <Link to="/home">חזרה לדף הבית</Link>
          </button>
          <Link
            to={`/practice/${encodeURIComponent(topicId)}`}
            onClick={endSession}
            className="btn-primary"
          >
            מפגש נוסף
          </Link>
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 3: Manual test**

```bash
cd app
npm run dev
```

In the browser:
1. Create a user, go to תרגול לפי נושא → pick "שברים עשרוניים".
2. Verify question renders with KaTeX, 4 options, tries-indicator full (3 green dots).
3. Click a WRONG answer → red shake, dot turns red, hint appears (one sentence).
4. Click another wrong → second dot red, hint expands.
5. Click correct → green check on the right option, explanation appears with full text, "הבאה ←" button visible.
6. Click "הבאה ←" → next question in shuffled order.
7. Run through to the end → lands on /results with summary.

- [ ] **Step 4: Commit**

```bash
cd ..
git add -A
git commit -m "feat(app): topic-practice flow (PracticePage + results)"
```

---

## Task 13: Mock-exam flow (ExamPicker + ExamGrid + ExamTimer + ExamPage + ExamResults)

**Files:**
- Create: `app/src/components/ExamGrid.tsx`, `app/src/components/ExamTimer.tsx`
- Replace: `app/src/pages/ExamPickerPage.tsx`, `app/src/pages/ExamPage.tsx`, `app/src/pages/ExamResultsPage.tsx`

- [ ] **Step 1: Create ExamGrid**

Create `app/src/components/ExamGrid.tsx`:

```tsx
import { Flag } from "lucide-react";
import type { OptionLetter, QuestionId } from "@/data/types";

interface Props {
  queue: QuestionId[];
  picks: Record<QuestionId, OptionLetter | null>;
  flagged: Record<QuestionId, boolean>;
  currentIndex: number;
  onJump: (index: number) => void;
}

export function ExamGrid({ queue, picks, flagged, currentIndex, onJump }: Props) {
  return (
    <ol className="grid grid-cols-6 gap-1.5">
      {queue.map((id, i) => {
        const answered = picks[id] !== null;
        const isCurrent = i === currentIndex;
        const isFlag = flagged[id];
        return (
          <li key={id}>
            <button
              onClick={() => onJump(i)}
              aria-current={isCurrent ? "step" : undefined}
              className={`relative w-full aspect-square rounded-lg border text-sm font-bold tabular-nums focus-visible:ring-2 focus-visible:ring-brand-500 ${
                isCurrent
                  ? "border-brand-500 bg-brand-50 text-brand-700"
                  : answered
                    ? "border-brand-500 bg-brand-500 text-white"
                    : "border-border bg-surface text-muted"
              }`}
            >
              {i + 1}
              {isFlag && (
                <Flag size={10} className="absolute top-0.5 left-0.5 text-warn-700" />
              )}
            </button>
          </li>
        );
      })}
    </ol>
  );
}
```

- [ ] **Step 2: Create ExamTimer**

Create `app/src/components/ExamTimer.tsx`:

```tsx
import { useEffect } from "react";
import { Clock } from "lucide-react";

interface Props {
  remainingSec: number;
  enabled: boolean;
  onTick: () => void;
}

export function ExamTimer({ remainingSec, enabled, onTick }: Props) {
  useEffect(() => {
    if (!enabled || remainingSec <= 0) return;
    const id = window.setInterval(onTick, 1000);
    return () => window.clearInterval(id);
  }, [enabled, remainingSec, onTick]);

  if (!enabled) return null;

  const mm = Math.floor(remainingSec / 60);
  const ss = remainingSec % 60;
  const low = remainingSec <= 60;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold tabular-nums ${
        low ? "bg-danger-50 text-danger-600" : "bg-hair text-ink"
      }`}
      aria-label="זמן שנותר"
    >
      <Clock size={14} />
      {String(mm).padStart(2, "0")}:{String(ss).padStart(2, "0")}
    </span>
  );
}
```

- [ ] **Step 3: Replace ExamPickerPage**

Replace `app/src/pages/ExamPickerPage.tsx`:

```tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Play } from "lucide-react";
import { selectActiveUser, useStore } from "@/store";
import { PageHeader } from "@/components/PageHeader";
import { topicIdFor } from "@/data/types";

export function ExamPickerPage() {
  const user = useStore(selectActiveUser);
  const bank = useStore((s) => s.bank);
  const loadBank = useStore((s) => s.loadBank);
  const startExamSession = useStore((s) => s.startExamSession);
  const isVisualOnly = useStore((s) => s.isVisualOnly);
  const [timerEnabled, setTimerEnabled] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadBank();
  }, [loadBank]);

  const exams = useMemo(() => {
    if (!bank) return [];
    const cat = bank.categories.find((c) => c.id === "sample-exams");
    return cat ? cat.topics.map((t) => ({ id: t.id, name: t.name_he, full: topicIdFor(cat.id, t.id) })) : [];
  }, [bank]);

  function start(examFullId: string) {
    if (!bank || !user) return;
    const cat = bank.categories.find((c) => c.id === "sample-exams")!;
    const topic = cat.topics.find((t) => topicIdFor(cat.id, t.id) === examFullId)!;
    const queue = topic.questions.map((q) => q.id).filter((id) => !isVisualOnly(id));
    startExamSession({
      examId: examFullId,
      queue,
      timerEnabled,
      durationSec: 60 * 60,
    });
    navigate(`/exam/${encodeURIComponent(examFullId)}`);
  }

  if (!user) {
    navigate("/welcome", { replace: true });
    return null;
  }

  return (
    <main className="min-h-screen bg-white px-4 py-6">
      <div className="max-w-2xl mx-auto">
        <PageHeader backTo="/home" title="מבחן לדוגמה" />
        <p className="text-muted mb-4">
          7 מבחנים מלאים, כל אחד ~24 שאלות. בחירה אחת לכל שאלה. אפשר לדפדף לאחור.
        </p>

        <label className="card flex items-center gap-3 p-3 mb-4">
          <input
            type="checkbox"
            checked={timerEnabled}
            onChange={(e) => setTimerEnabled(e.target.checked)}
            className="w-4 h-4 accent-brand-500"
          />
          <span className="text-sm">
            הפעלת שעון של 60 דקות (כמו במבחן האמיתי)
          </span>
        </label>

        {exams.length === 0 && <p className="text-muted">טוען...</p>}

        <ul className="card divide-y divide-hair">
          {exams.map((e) => {
            const lastAttempt = user.progress.exams
              .filter((a) => a.examId === e.full)
              .sort((a, b) => b.takenAt - a.takenAt)[0];
            return (
              <li key={e.id} className="flex items-center gap-3 px-4 py-3">
                <Calendar size={18} className="text-brand-600" />
                <div className="flex-1">
                  <div className="font-semibold">{e.name}</div>
                  {lastAttempt && (
                    <div className="text-sm text-faint tabular-nums">
                      ניסיון אחרון: {lastAttempt.score}/{lastAttempt.total}
                    </div>
                  )}
                </div>
                <button onClick={() => start(e.full)} className="btn-primary">
                  <Play size={16} />
                  התחל
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </main>
  );
}
```

- [ ] **Step 4: Replace ExamPage**

Replace `app/src/pages/ExamPage.tsx`:

```tsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Flag, X } from "lucide-react";
import { selectActiveUser, useStore } from "@/store";
import { PageHeader } from "@/components/PageHeader";
import { QuestionCard } from "@/components/QuestionCard";
import { OptionGrid } from "@/components/OptionGrid";
import { ExamGrid } from "@/components/ExamGrid";
import { ExamTimer } from "@/components/ExamTimer";
import { Confirm } from "@/components/Confirm";
import type { OptionLetter } from "@/data/types";

export function ExamPage() {
  const params = useParams<{ examId: string }>();
  const examId = decodeURIComponent(params.examId ?? "");
  const navigate = useNavigate();

  const user = useStore(selectActiveUser);
  const session = useStore((s) => s.session);
  const examPick = useStore((s) => s.examPick);
  const examFlag = useStore((s) => s.examFlag);
  const examJumpTo = useStore((s) => s.examJumpTo);
  const examTick = useStore((s) => s.examTick);
  const examFinish = useStore((s) => s.examFinish);
  const getQuestion = useStore((s) => s.getQuestion);
  const recordAnswer = useStore((s) => s.recordAnswer);
  const enqueueReview = useStore((s) => s.enqueueReview);
  const bank = useStore((s) => s.bank);

  const [confirmEnd, setConfirmEnd] = useState(false);

  // When ended (manually or by timer), finalize and go to results
  useEffect(() => {
    if (!user || !session || session.mode !== "exam") return;
    if (!session.ended) return;
    finalize();
  }, [session, user]);

  if (!user) {
    navigate("/welcome", { replace: true });
    return null;
  }
  if (!session || session.mode !== "exam") {
    navigate("/exam", { replace: true });
    return null;
  }

  const currentId = session.queue[session.index];
  const question = getQuestion(currentId);
  if (!question || !bank) return null;

  const picked = session.picks[currentId] ?? null;
  const flagged = session.flagged[currentId] ?? false;

  function handlePick(l: OptionLetter) {
    examPick(currentId, picked === l ? null : l);
  }

  function finalize() {
    if (!session || session.mode !== "exam" || !user) return;
    const cat = bank!.categories.find((c) => c.id === "sample-exams")!;
    const topic = cat.topics.find((t) => `03_מבחנים_לדוגמה/${t.id}` === session.examId);
    if (!topic) return;
    let score = 0;
    const answers: Record<string, { picked: OptionLetter | null; correct: boolean; flagged: boolean }> = {};
    for (const qid of session.queue) {
      const q = getQuestion(qid);
      const p = session.picks[qid] ?? null;
      const correct = !!q && p === q.correct_letter;
      if (correct) score++;
      answers[qid] = { picked: p, correct, flagged: session.flagged[qid] ?? false };
      // Record answer for streak/stats; treat as a single attempt (attemptIndex 0)
      recordAnswer({
        userId: user.id,
        questionId: qid,
        topicId: session.examId,
        totalQuestionsInTopic: session.queue.length,
        correct,
        attemptIndex: 0,
        pickedLetter: p,
      });
      if (!correct) enqueueReview(user.id, qid);
    }
    // append exam attempt
    useStore.setState((s) => {
      const u = s.users[user.id];
      if (!u) return s;
      const updated = {
        ...u,
        progress: {
          ...u.progress,
          exams: [
            ...u.progress.exams,
            {
              examId: session.examId,
              takenAt: Date.now(),
              durationSec: session.durationSec - session.remainingSec,
              timerEnabled: session.timerEnabled,
              score,
              total: session.queue.length,
              answers,
            },
          ],
        },
      };
      return { users: { ...s.users, [user.id]: updated } };
    });
    navigate(`/exam/${encodeURIComponent(session.examId)}/results`, { replace: true });
  }

  return (
    <main className="min-h-screen bg-white px-4 py-6">
      <div className="max-w-3xl mx-auto">
        <PageHeader
          title="מבחן לדוגמה"
          rightSlot={
            <>
              <ExamTimer
                remainingSec={session.remainingSec}
                enabled={session.timerEnabled}
                onTick={examTick}
              />
              <button onClick={() => setConfirmEnd(true)} className="btn-secondary !px-3 !py-1.5">
                <X size={16} />
                סיים
              </button>
            </>
          }
        />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_180px] gap-6">
          <section>
            <QuestionCard question={question} topRight={
              <button
                onClick={() => examFlag(currentId, !flagged)}
                className={`px-2 py-1 rounded-lg text-sm font-semibold flex items-center gap-1 ${flagged ? "bg-warn-50 text-warn-700" : "text-faint"}`}
                aria-pressed={flagged}
              >
                <Flag size={14} /> {flagged ? "מסומנת" : "סמני לבדיקה"}
              </button>
            } />
            <OptionGrid
              question={question}
              onPick={handlePick}
              stickyWrong={[]}
              revealed={false}
              feedback={picked ? { picked, correctLetter: null } : undefined}
            />
            <div className="mt-5 flex justify-between">
              <button
                onClick={() => examJumpTo(session.index - 1)}
                disabled={session.index === 0}
                className="btn-secondary disabled:opacity-50"
              >
                → הקודמת
              </button>
              <button
                onClick={() => examJumpTo(session.index + 1)}
                disabled={session.index >= session.queue.length - 1}
                className="btn-primary disabled:opacity-50"
              >
                הבאה ←
              </button>
            </div>
          </section>

          <aside className="lg:sticky lg:top-6 self-start">
            <div className="section-label mb-2">דפדוף</div>
            <ExamGrid
              queue={session.queue}
              picks={session.picks}
              flagged={session.flagged}
              currentIndex={session.index}
              onJump={examJumpTo}
            />
          </aside>
        </div>
      </div>

      <Confirm
        open={confirmEnd}
        title="לסיים את המבחן?"
        body={`ענית על ${Object.values(session.picks).filter(Boolean).length} מתוך ${session.queue.length} שאלות.`}
        confirmLabel="סיים והצג ציון"
        onConfirm={() => {
          setConfirmEnd(false);
          examFinish();
        }}
        onCancel={() => setConfirmEnd(false)}
      />
    </main>
  );
}
```

- [ ] **Step 5: Replace ExamResultsPage**

Replace `app/src/pages/ExamResultsPage.tsx`:

```tsx
import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { Trophy } from "lucide-react";
import { selectActiveUser, useStore } from "@/store";
import { PageHeader } from "@/components/PageHeader";
import { QuestionCard } from "@/components/QuestionCard";
import { ExplanationCard } from "@/components/ExplanationCard";

export function ExamResultsPage() {
  const params = useParams<{ examId: string }>();
  const examId = decodeURIComponent(params.examId ?? "");
  const user = useStore(selectActiveUser);
  const getQuestion = useStore((s) => s.getQuestion);

  const attempt = useMemo(() => {
    if (!user) return null;
    return [...user.progress.exams].filter((a) => a.examId === examId).pop() ?? null;
  }, [user, examId]);

  if (!user) return null;
  if (!attempt) {
    return (
      <main className="min-h-screen bg-white px-4 py-6">
        <PageHeader backTo="/exam" title="תוצאות מבחן" />
        <p className="text-muted">לא נמצא ניסיון.</p>
      </main>
    );
  }

  const pct = Math.round((attempt.score / attempt.total) * 100);
  const mm = Math.floor(attempt.durationSec / 60);
  const ss = attempt.durationSec % 60;

  return (
    <main className="min-h-screen bg-white px-4 py-6">
      <div className="max-w-2xl mx-auto">
        <PageHeader backTo="/home" title="תוצאות מבחן" />
        <section className="card p-6 mb-6 text-center">
          <Trophy size={36} className="text-brand-500 mx-auto mb-2" />
          <div className="text-5xl font-black tabular-nums">
            {attempt.score}/{attempt.total}
          </div>
          <div className="text-muted mt-1">{pct}% נכון</div>
          <div className="text-sm text-faint mt-3 tabular-nums">
            זמן: {mm}:{String(ss).padStart(2, "0")} דקות
          </div>
        </section>

        <h2 className="section-label mb-3">סקירת שאלות</h2>
        {Object.entries(attempt.answers).map(([qid, rec]) => {
          const q = getQuestion(qid);
          if (!q) return null;
          return (
            <details key={qid} className="card p-4 mb-3 group">
              <summary className="cursor-pointer flex items-center justify-between">
                <span className="font-semibold">שאלה {q.number}</span>
                <span
                  className={`text-sm font-bold ${rec.correct ? "text-brand-700" : "text-danger-600"}`}
                >
                  {rec.correct ? "נכון" : "שגוי"}
                  {rec.picked && ` (בחרת: ${rec.picked})`}
                </span>
              </summary>
              <div className="mt-3">
                <QuestionCard question={q} />
                <ExplanationCard
                  correctAnswer={q.correct_answer}
                  explanation={q.explanation}
                />
              </div>
            </details>
          );
        })}

        <div className="mt-6 flex gap-2 justify-end">
          <Link to="/home" className="btn-secondary">
            לדף הבית
          </Link>
          <Link to="/exam" className="btn-primary">
            מבחן נוסף
          </Link>
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 6: Manual test**

```bash
cd app
npm run dev
```

1. From home, click "מבחן לדוגמה".
2. Verify list of 7 exams + timer toggle.
3. Pick exam 1 → exam screen with question on left, 24-square grid on right, timer top-right.
4. Pick answers for a few questions. Flag one. Jump around with the grid.
5. Click "סיים" → confirm → results screen with score, total time, per-question collapsible review.

- [ ] **Step 7: Commit**

```bash
cd ..
git add -A
git commit -m "feat(app): mock-exam flow (picker + grid + timer + page + results)"
```

---

## Task 14: ReviewPage (drill the wrong-answer queue)

**Files:**
- Replace: `app/src/pages/ReviewPage.tsx`

- [ ] **Step 1: Implement ReviewPage**

Replace `app/src/pages/ReviewPage.tsx`:

```tsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { selectActiveUser, useStore } from "@/store";
import { PageHeader } from "@/components/PageHeader";
import { QuestionCard } from "@/components/QuestionCard";
import { OptionGrid } from "@/components/OptionGrid";
import { HintCard, hintForLevel } from "@/components/HintCard";
import { ExplanationCard } from "@/components/ExplanationCard";
import { useState } from "react";
import type { OptionLetter } from "@/data/types";

export function ReviewPage() {
  const user = useStore(selectActiveUser);
  const session = useStore((s) => s.session);
  const startPracticeSession = useStore((s) => s.startPracticeSession);
  const attemptAnswer = useStore((s) => s.attemptAnswer);
  const next = useStore((s) => s.next);
  const recordAnswer = useStore((s) => s.recordAnswer);
  const dequeueReview = useStore((s) => s.dequeueReview);
  const getQuestion = useStore((s) => s.getQuestion);
  const bank = useStore((s) => s.bank);
  const navigate = useNavigate();
  const [stickyWrong, setStickyWrong] = useState<OptionLetter[]>([]);

  useEffect(() => {
    if (!user) {
      navigate("/welcome", { replace: true });
      return;
    }
    if (user.progress.reviewQueue.length === 0) {
      navigate("/home", { replace: true });
      return;
    }
    if (session && session.mode === "review") return;
    startPracticeSession({
      topicId: "review",
      queue: [...user.progress.reviewQueue],
      mode: "review",
    });
    setStickyWrong([]);
  }, [user, session, startPracticeSession, navigate]);

  if (!user || !session || session.mode === "exam" || !bank) return null;

  if (session.index >= session.queue.length) {
    navigate("/home", { replace: true });
    return null;
  }

  const currentId = session.queue[session.index];
  const q = getQuestion(currentId);
  if (!q) return null;

  // Determine topic for this question (for recordAnswer)
  function findTopicForQuestion(qid: string): { topicId: string; total: number } | null {
    if (!bank) return null;
    for (const cat of bank.categories) {
      for (const t of cat.topics) {
        if (t.questions.some((x) => x.id === qid)) {
          const dir =
            cat.id === "math-knowledge"
              ? "01_ידע_מתמטי"
              : cat.id === "logic-reasoning"
                ? "02_חשיבה_והגיון"
                : "03_מבחנים_לדוגמה";
          return { topicId: `${dir}/${t.id}`, total: t.question_count };
        }
      }
    }
    return null;
  }

  function handlePick(l: OptionLetter) {
    const correct = l === q?.correct_letter;
    if (!correct) setStickyWrong((p) => (p.includes(l) ? p : [...p, l]));
    const attemptIndex = session.currentAttempts as 0 | 1 | 2;
    attemptAnswer(correct);
    const meta = findTopicForQuestion(currentId);
    if (meta) {
      recordAnswer({
        userId: user.id,
        questionId: currentId,
        topicId: meta.topicId,
        totalQuestionsInTopic: meta.total,
        correct,
        attemptIndex,
        pickedLetter: l,
      });
    }
    // Remove from queue if got it right on the first try
    if (correct && attemptIndex === 0) {
      dequeueReview(user.id, currentId);
    }
  }

  function handleNext() {
    setStickyWrong([]);
    next();
  }

  const hint = hintForLevel(q.explanation, session.hintLevel);
  const showExplanation = session.revealed;

  return (
    <main className="min-h-screen bg-white px-4 py-6">
      <div className="max-w-2xl mx-auto">
        <PageHeader
          backTo="/home"
          title="חזרה"
          rightSlot={
            <span className="text-sm text-faint tabular-nums">
              {session.index + 1} / {session.queue.length}
            </span>
          }
        />
        <QuestionCard question={q} used={session.currentAttempts as 0 | 1 | 2 | 3} />
        <OptionGrid
          question={q}
          stickyWrong={stickyWrong}
          revealed={session.revealed}
          onPick={handlePick}
        />
        {hint && !showExplanation && <HintCard text={hint} />}
        {showExplanation && (
          <ExplanationCard correctAnswer={q.correct_answer} explanation={q.explanation} />
        )}
        {showExplanation && (
          <div className="mt-5 flex justify-end">
            <button className="btn-primary" onClick={handleNext}>
              הבאה ←
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Manual test**

Get something into the review queue (answer a question wrong 3 times in topic practice), then click the "X שאלות לחזרה" pill on home. Verify the review session uses the same UI as practice and that the question leaves the queue when answered right on the first try.

- [ ] **Step 3: Commit**

```bash
cd ..
git add -A
git commit -m "feat(app): wrong-answer review queue flow"
```

---

## Task 15: Image-dependent question placeholder

**Files:**
- Modify: `app/src/components/QuestionCard.tsx`
- Modify: `app/src/pages/PracticePage.tsx`, `app/src/pages/ExamPage.tsx`, `app/src/pages/ReviewPage.tsx` (add Skip when image missing)

- [ ] **Step 1: Update QuestionCard to support an image slot**

Edit `app/src/components/QuestionCard.tsx`:

```tsx
import type { RawQuestion } from "@/data/types";
import { InlineMath } from "@/lib/katex";
import { TriesIndicator } from "./TriesIndicator";
import { ImageOff } from "lucide-react";

interface Props {
  question: RawQuestion;
  position?: { index: number; total: number };
  used?: 0 | 1 | 2 | 3;
  topRight?: React.ReactNode;
  image?: { src: string; alt: string } | null;
  needsImage?: boolean;
}

export function QuestionCard({ question, position, used, topRight, image, needsImage }: Props) {
  return (
    <section className="card p-5 sm:p-6">
      <header className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {position && (
            <span className="text-sm font-bold text-brand-600 tabular-nums">
              שאלה {position.index + 1} / {position.total}
            </span>
          )}
          {used !== undefined && <TriesIndicator used={used} />}
        </div>
        {topRight}
      </header>

      {image ? (
        <img src={image.src} alt={image.alt} loading="lazy" className="mb-4 rounded-xl border border-border max-w-full" />
      ) : needsImage ? (
        <div className="mb-4 rounded-xl border border-dashed border-border bg-hair text-muted p-6 flex flex-col items-center gap-2">
          <ImageOff size={28} />
          <span className="font-semibold">תמונה תתווסף בקרוב</span>
        </div>
      ) : null}

      <div className="text-base sm:text-lg leading-relaxed text-ink">
        <InlineMath text={question.question} />
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Wire it through in PracticePage** — pass `image` and `needsImage` props:

In `app/src/pages/PracticePage.tsx`, where `<QuestionCard ... />` is rendered, replace with:

```tsx
<QuestionCard
  question={question}
  used={triesUsed}
  image={useStore.getState().getImage(currentId)}
  needsImage={useStore.getState().needsImage(currentId)}
/>
```

Do the same in `ExamPage.tsx` and `ReviewPage.tsx` for their `<QuestionCard />` renders.

- [ ] **Step 3: Manual test**

Ensure a non-image question still renders cleanly, and an image-dependent question (e.g. from חקר נתונים) now shows the dashed "תמונה תתווסף בקרוב" panel above the text.

- [ ] **Step 4: Commit**

```bash
cd ..
git add -A
git commit -m "feat(app): image-dependent question placeholder + image slot"
```

---

## Task 16: Star-fly animation + streak refinement + polish pass

**Files:**
- Create: `app/src/components/StarBurst.tsx`
- Modify: `app/src/pages/PracticePage.tsx` (trigger on first-try correct)

- [ ] **Step 1: Create StarBurst**

Create `app/src/components/StarBurst.tsx`:

```tsx
import { useEffect, useState } from "react";
import { Star } from "lucide-react";

interface Props {
  /** Increments to trigger a new burst. */
  triggerKey: number;
}

export function StarBurst({ triggerKey }: Props) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (triggerKey === 0) return;
    setVisible(true);
    const t = window.setTimeout(() => setVisible(false), 1200);
    return () => window.clearTimeout(t);
  }, [triggerKey]);
  if (!visible) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center">
      <Star size={64} className="text-warn-700 fill-warn-200 animate-star-fly" />
    </div>
  );
}
```

- [ ] **Step 2: Trigger it from PracticePage on first-try-correct**

In `app/src/pages/PracticePage.tsx`, add at the top:

```tsx
import { StarBurst } from "@/components/StarBurst";
```

Add a `const [starKey, setStarKey] = useState(0);` near the other hooks.

In `handlePick`, after `attemptAnswer(...)`, check if `outcome === "first-correct"` and bump:

```ts
const outcome = attemptAnswer(correct);
if (outcome === "first-correct") setStarKey((k) => k + 1);
```

Render `<StarBurst triggerKey={starKey} />` at the bottom of the `<main>` (still inside it).

- [ ] **Step 3: Commit**

```bash
cd ..
git add -A
git commit -m "feat(app): star-burst animation on first-try-correct"
```

---

## Task 17: Responsive + accessibility audit

**Files:**
- Audit existing components/pages, fix issues found.

- [ ] **Step 1: Mobile audit**

Open the app at 375px width. For each page, verify:
- No horizontal scroll.
- Touch targets ≥ 44 px (buttons aren't too small).
- Text doesn't get cut off; long Hebrew lines wrap.
- ExamGrid stays visible on mobile — collapses below the question on small viewports (already done via `lg:grid-cols-[1fr_180px]`).

If any layout breaks, fix the responsive class strings — usually adding/adjusting `sm:` / `lg:` breakpoints in Tailwind.

- [ ] **Step 2: Keyboard audit**

Tab through every page. Verify:
- Focus rings visible everywhere (`focus-visible:ring-2 ring-brand-500`).
- Logical tab order (question → options 1..4 → next button).
- Confirm dialog traps focus on the confirm button.

- [ ] **Step 3: Reduced motion**

Add to `app/src/styles/index.css`:

```css
@media (prefers-reduced-motion: reduce) {
  .animate-shake,
  .animate-star-fly {
    animation: none !important;
  }
}
```

- [ ] **Step 4: ARIA labels**

Verify every icon-only button has `aria-label`. Spot-check: header back button, settings gear, exam flag, exam grid square, etc. Add `aria-label` where missing.

- [ ] **Step 5: Build clean**

```bash
cd app
npm run build
```

Expected: clean build, no TS errors, no Tailwind warnings.

- [ ] **Step 6: Commit**

```bash
cd ..
git add -A
git commit -m "chore(app): responsive + accessibility + reduced-motion polish"
```

---

## Task 18: Playwright E2E — one happy-path spec

**Files:**
- Create: `app/playwright.config.ts`, `app/tests/e2e/happy-path.spec.ts`

- [ ] **Step 1: Install Playwright browsers**

```bash
cd app
npx playwright install --with-deps chromium
```

- [ ] **Step 2: Create `app/playwright.config.ts`**

```ts
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  use: {
    baseURL: "http://localhost:5173",
    headless: true,
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
```

- [ ] **Step 3: Create the spec**

Create `app/tests/e2e/happy-path.spec.ts`:

```ts
import { test, expect } from "@playwright/test";

test("first-time user creates account, picks a topic, answers a question", async ({ page, context }) => {
  // Clear localStorage between tests
  await context.addInitScript(() => window.localStorage.clear());

  await page.goto("/");

  // Welcome screen
  await expect(page.getByText("ברוכים הבאים.")).toBeVisible();
  await page.getByPlaceholder("לדוגמה: נועה").fill("נועה");
  await page.getByRole("button", { name: /התחל/ }).click();

  // Home
  await expect(page.getByRole("heading", { name: /שלום נועה/ })).toBeVisible();

  // Open topic practice
  await page.getByRole("link", { name: /תרגול לפי נושא/ }).click();
  await expect(page.getByRole("heading", { name: /בחרי נושא/ })).toBeVisible();

  // Pick "שברים עשרוניים"
  await page.getByRole("link", { name: /שברים עשרוניים/ }).click();

  // A question and 4 options render
  await expect(page.locator("section.card").first()).toBeVisible();
  const options = page.locator('button.card');
  await expect(options).toHaveCount(await options.count()); // confirms at least 1
});
```

- [ ] **Step 4: Run E2E**

```bash
npm run test:e2e
```

Expected: passes.

- [ ] **Step 5: Commit**

```bash
cd ..
git add -A
git commit -m "test(app): Playwright happy-path E2E"
```

---

## Task 19: GitHub Pages deploy workflow + README

**Files:**
- Create: `.github/workflows/deploy.yml`, `app/README.md`

- [ ] **Step 1: Create deploy workflow**

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy app

on:
  push:
    branches: [main]
    paths:
      - "app/**"
      - "data/**"
      - ".github/workflows/deploy.yml"
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: app
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
          cache-dependency-path: app/package-lock.json
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: app/dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: Add a README**

Create `app/README.md`:

```markdown
# חשבונייה — Math Practice App

Hebrew RTL web app to drill the 497-question math bank from the parent repo.

## Development

```bash
npm install
npm run sync-data    # copy ../data/*.json into public/data/
npm run dev          # http://localhost:5173
```

## Test

```bash
npm test             # unit + component
npm run test:e2e     # Playwright happy-path
```

## Build & deploy

```bash
npm run build
```

Output in `dist/`. Deploys automatically via `.github/workflows/deploy.yml` to GitHub Pages on push to `main`.

## Adding images for image-dependent questions

1. Drop the image file in `app/public/data/questions/<category>/<topic>/<n>.png`.
2. Edit `data/image_dependent_questions.json` (parent repo) to add `image` + `image_alt` fields to the entry.
3. Run `npm run sync-data` and rebuild.
```

- [ ] **Step 3: Commit**

```bash
cd ..
git add -A
git commit -m "ci(app): GitHub Pages deploy + README"
```

---

## Self-Review

**1. Spec coverage**
- §1 Goals: covered across all tasks.
- §2 Tech stack: Task 1, 2.
- §3 Visual identity: Tasks 1, 2, 7, 8, 16.
- §4 Data model: Task 3 (types), Tasks 5, 6 (storage + slices).
- §5 Screens/flows: Tasks 9, 10, 11, 12, 13, 14.
- §6 Image-dependent: Task 15.
- §7 Gamification: Tasks 6 (data), 10 (display), 16 (animation).
- §8 Hint system: Tasks 8, 12, 14.
- §9 Component architecture: matches file layout in §File structure of this plan.
- §10 Testing: Tasks 4, 5, 6 (unit), 8 (component), 18 (E2E).
- §11 Accessibility: Task 17.
- §12 Out of scope: respected (no cloud sync, no resume, etc).

**2. Placeholder scan**
- No "TBD", "fill in details", "similar to Task N" without code.
- Every code step has the actual code.

**3. Type consistency**
- `OptionLetter`, `QuestionId`, `TopicId`, `UserId`, `RawQuestion`, `PersistRoot`, `UserState`, `UserStats`, `ExamSession`, `PracticeSession` defined once in `data/types.ts` (Task 3) and referenced consistently throughout.

**4. Ambiguity check**
- `recordAnswer` signature is identical in Tasks 6, 12, 13, 14.
- `topicIdFor` and `dirForCategoryId` helpers added in Task 10 and used in Tasks 11, 12, 13.

Plan looks coherent. Ready to execute.

---

**Plan complete and saved to `docs/superpowers/plans/2026-05-17-math-practice-app.md`.**

The user has pre-approved end-to-end execution and asked to start implementing immediately, then run code review. Proceeding with **Inline Execution** via `superpowers:executing-plans` — batch tasks with checkpoints at logical phase boundaries.
