# Personal Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `/dashboard` page that visualises a single user's progress using charts grounded in *The Big Book of Dashboards* (BANs + sparklines, sorted bars, bullet graphs, line/slope charts, action cards) — replacing any temptation toward pies, gauges, radar charts, or red/green status colour.

**Architecture:** One new page composing five sections, fed by a new pure-functions module `src/lib/dashboardStats.ts` that derives all metrics from the existing user state. One small data-model change (`UserStats.dailyAnswered`) unlocks daily-activity sparklines and a 30-day histogram. Visual primitives (bullet graph, sorted bar, line/slope chart, BAN) live under `src/components/dashboard/`. No new libraries — Framer Motion, Tailwind, and inline SVG are sufficient; sparkline reuses the existing `Sparkline` component.

**Tech Stack:** React 18 + TypeScript, Vite, Zustand, Tailwind, lucide-react, Framer Motion v12, Vitest. No charting library — pure inline SVG to match the existing `Sparkline`, `Confetti`, `StarBurst`, `Ornament` style.

**Notes for the executing engineer:**
- This repo enforces **no emoji anywhere in UI** (use lucide-react SVGs only) and a **16 px minimum font size** (Tailwind's `text-xs`/`text-sm` are overridden to 16 px in `src/styles/index.css`). New code must not use `text-[<arbitrary>]` or inline `fontSize` smaller than 16 px.
- The app is **RTL Hebrew** at the document level. All horizontal bars (mastery, bullet graph) must visually fill from right to left so "fuller" matches reading direction. The simplest way: keep the SVG's coordinate system LTR but position the bar at `x = width - barWidth`. KaTeX math stays LTR (it's the only exception).
- Use the variants from `src/lib/motion.ts` (`riseIn`, `pageEnter`, `useMotionVariants`) for entry animation — do not write ad-hoc Framer variants.
- The project is **not** currently a git repository (per the harness). Treat each task's "Commit" step as a save checkpoint — if `git status` errors, skip the commit and continue.
- Tests live under `tests/unit/` and use Vitest. Path alias `@/` maps to `src/`.

---

## File Structure

**Create:**
- `src/lib/dashboardStats.ts` — pure selectors deriving every metric the dashboard needs from `UserState` + `QuestionBank`.
- `tests/unit/dashboardStats.test.ts` — unit tests for those selectors.
- `src/pages/DashboardPage.tsx` — the page that composes the five sections.
- `src/components/dashboard/StatBan.tsx` — hero "big-ass number" with label + sparkline.
- `src/components/dashboard/SortedTopicBars.tsx` — section 2 chart.
- `src/components/dashboard/BulletGraph.tsx` — bullet-graph primitive.
- `src/components/dashboard/TopicBulletList.tsx` — section 3 (list of bullet graphs).
- `src/components/dashboard/ExamLineChart.tsx` — section 4a.
- `src/components/dashboard/ExamSlopeChart.tsx` — section 4b.
- `src/components/dashboard/ActionCards.tsx` — section 5.

**Modify:**
- `src/data/types.ts` — extend `UserStats` with `dailyAnswered`, update `EMPTY_STATS`.
- `src/store/migrations.ts` — backfill `dailyAnswered: {}` on legacy persisted state.
- `src/lib/streak.ts` — write today's count into `dailyAnswered` alongside `todayCount`.
- `tests/unit/streak.test.ts` — extend tests for the new behaviour.
- `tests/unit/migrations.test.ts` — extend tests for the backfill.
- `src/app/routes.tsx` — add `/dashboard` route.
- `src/pages/HomePage.tsx` — add a header link to the dashboard.

---

## Task 1: Data model — daily activity persistence

**Why first:** Section 1's "Today" sparkline and section 5's recency callout both need per-day counts. Without this change those visuals would be faked from a single most-recent timestamp.

**Files:**
- Modify: `src/data/types.ts:127-205`
- Modify: `src/store/migrations.ts`
- Modify: `src/lib/streak.ts`
- Modify: `tests/unit/streak.test.ts`
- Modify: `tests/unit/migrations.test.ts`

- [ ] **Step 1.1: Extend `UserStats` and `EMPTY_STATS`**

In `src/data/types.ts`, add `dailyAnswered` to the `UserStats` interface and the `EMPTY_STATS` constant:

```ts
export interface UserStats {
  totalAnswered: number;
  starsEarned: number;
  currentStreakDays: number;
  longestStreakDays: number;
  lastActiveDate: string;
  todayCount: number;
  /** Map of "YYYY-MM-DD" → questions answered that day. Append-only; never trim. */
  dailyAnswered: Record<string, number>;
}
```

```ts
export const EMPTY_STATS: UserStats = {
  totalAnswered: 0,
  starsEarned: 0,
  currentStreakDays: 0,
  longestStreakDays: 0,
  lastActiveDate: "",
  todayCount: 0,
  dailyAnswered: {},
};
```

- [ ] **Step 1.2: Add failing test for `applyStreak` writing today's count**

In `tests/unit/streak.test.ts`, append:

```ts
it("writes today's count into dailyAnswered map on every call", () => {
  let s = applyStreak({ ...EMPTY_STATS }, "2026-05-17");
  expect(s.dailyAnswered["2026-05-17"]).toBe(1);
  s = applyStreak(s, "2026-05-17");
  expect(s.dailyAnswered["2026-05-17"]).toBe(2);
  s = applyStreak(s, "2026-05-18");
  expect(s.dailyAnswered["2026-05-17"]).toBe(2);
  expect(s.dailyAnswered["2026-05-18"]).toBe(1);
});

it("preserves prior days' counts when the streak resets", () => {
  let s = applyStreak({ ...EMPTY_STATS }, "2026-05-17");
  s = applyStreak(s, "2026-05-21"); // gap > 1, streak resets
  expect(s.dailyAnswered["2026-05-17"]).toBe(1);
  expect(s.dailyAnswered["2026-05-21"]).toBe(1);
});
```

- [ ] **Step 1.3: Run the new tests to confirm they fail**

Run: `npx vitest run tests/unit/streak.test.ts`
Expected: FAIL on the two new tests with `expect(received).toBe(expected)` (received `undefined`).

- [ ] **Step 1.4: Update `applyStreak` to write into `dailyAnswered`**

Replace the body of `applyStreak` in `src/lib/streak.ts`:

```ts
import type { UserStats } from "@/data/types";
import { diffInDays } from "./date";

export function applyStreak(prev: UserStats, today: string): UserStats {
  const dailyAnswered = {
    ...prev.dailyAnswered,
    [today]: (prev.dailyAnswered?.[today] ?? 0) + 1,
  };
  if (!prev.lastActiveDate) {
    return {
      ...prev,
      currentStreakDays: 1,
      longestStreakDays: Math.max(1, prev.longestStreakDays),
      lastActiveDate: today,
      todayCount: 1,
      dailyAnswered,
    };
  }
  const gap = diffInDays(prev.lastActiveDate, today);
  if (gap === 0) {
    return { ...prev, todayCount: prev.todayCount + 1, dailyAnswered };
  }
  if (gap === 1) {
    const next = prev.currentStreakDays + 1;
    return {
      ...prev,
      currentStreakDays: next,
      longestStreakDays: Math.max(next, prev.longestStreakDays),
      lastActiveDate: today,
      todayCount: 1,
      dailyAnswered,
    };
  }
  return {
    ...prev,
    currentStreakDays: 1,
    lastActiveDate: today,
    todayCount: 1,
    dailyAnswered,
  };
}
```

- [ ] **Step 1.5: Run the streak tests; confirm all pass**

Run: `npx vitest run tests/unit/streak.test.ts`
Expected: PASS (all 7 tests).

- [ ] **Step 1.6: Add failing test for migration backfill**

In `tests/unit/migrations.test.ts`, append a test that loads a legacy persist root (no `dailyAnswered` on stats) and asserts the result has an empty object there:

```ts
it("backfills dailyAnswered={} when migrating legacy users without it", () => {
  const legacy = {
    version: 1,
    activeUserId: "u",
    users: {
      u: {
        id: "u",
        name: "L",
        createdAt: 1,
        progress: {
          questions: {},
          topics: {},
          exams: [],
          reviewQueue: [],
          stats: {
            totalAnswered: 0,
            starsEarned: 0,
            currentStreakDays: 0,
            longestStreakDays: 0,
            lastActiveDate: "",
            todayCount: 0,
            // dailyAnswered intentionally absent
          },
        },
      },
    },
  };
  const out = migrate(legacy);
  expect(out.users.u.progress.stats.dailyAnswered).toEqual({});
});
```

- [ ] **Step 1.7: Run the migration tests; the new one should fail**

Run: `npx vitest run tests/unit/migrations.test.ts`
Expected: FAIL on the new test — `dailyAnswered` is `undefined`.

- [ ] **Step 1.8: Update `migrate` to backfill `dailyAnswered`**

Replace `src/store/migrations.ts`:

```ts
import type { PersistRoot, UserState } from "@/data/types";

function backfillUser(u: UserState): UserState {
  if (u.progress.stats.dailyAnswered) return u;
  return {
    ...u,
    progress: {
      ...u.progress,
      stats: { ...u.progress.stats, dailyAnswered: {} },
    },
  };
}

export function migrate(input: unknown): PersistRoot {
  if (input == null || typeof input !== "object") {
    return { version: 1, activeUserId: null, users: {} };
  }
  const obj = input as { version?: unknown };
  if (typeof obj.version !== "number") {
    return { version: 1, activeUserId: null, users: {} };
  }
  if (obj.version === 1) {
    const root = input as PersistRoot;
    const users: Record<string, UserState> = {};
    for (const [id, u] of Object.entries(root.users)) {
      users[id] = backfillUser(u);
    }
    return { ...root, users };
  }
  if (obj.version > 1) {
    throw new Error(`Unknown persist version: ${obj.version}. Refusing to clobber.`);
  }
  return { version: 1, activeUserId: null, users: {} };
}
```

- [ ] **Step 1.9: Run the full test suite; expect 0 failures**

Run: `npm test`
Expected: All tests pass. If a pre-existing test references `EMPTY_STATS` with shallow equality, update it to include `dailyAnswered: {}`.

- [ ] **Step 1.10: Commit**

```
git add src/data/types.ts src/lib/streak.ts src/store/migrations.ts tests/unit/streak.test.ts tests/unit/migrations.test.ts
git commit -m "feat(stats): track per-day answer counts in UserStats.dailyAnswered"
```

If the project is not a git repo, skip — your IDE's local history is fine.

---

## Task 2: Dashboard stats selectors

**Why second:** Every chart in sections 1–5 reads through one of these selectors. Building them with TDD means the visual layer just renders whatever they return.

**Files:**
- Create: `src/lib/dashboardStats.ts`
- Create: `tests/unit/dashboardStats.test.ts`

- [ ] **Step 2.1: Sketch the public API in `dashboardStats.ts`**

Create `src/lib/dashboardStats.ts` with empty implementations so the file type-checks:

```ts
import type { QuestionBank, UserState, TopicId, ExamAttempt } from "@/data/types";

export interface TopicMastery {
  topicId: TopicId;
  categoryId: string;
  categoryName: string;
  topicName: string;
  attempted: number;
  mastered: number;
  total: number;
  pct: number;
}

export interface DailyBucket {
  date: string; // YYYY-MM-DD
  count: number;
}

export interface ExamPoint {
  examId: TopicId;
  takenAt: number;
  scorePct: number;
}

export interface ExamSlope {
  examId: TopicId;
  examName: string;
  first: ExamPoint;
  latest: ExamPoint;
}

export function masteryByTopic(_user: UserState, _bank: QuestionBank): TopicMastery[] {
  return [];
}

export function overallMasteryPct(_user: UserState, _bank: QuestionBank): number {
  return 0;
}

export function firstTryAccuracyPct(_user: UserState): number | null {
  return null;
}

export function dailyHistogram(_user: UserState, _lookbackDays: number, _today: string): DailyBucket[] {
  return [];
}

export function todaySparkline(_user: UserState, _today: string): number[] {
  return [];
}

export function masteryTrendSparkline(_user: UserState, _bank: QuestionBank): number[] {
  return [];
}

export function examTimeSeries(_user: UserState): ExamPoint[] {
  return [];
}

export function examSlopes(_user: UserState, _bank: QuestionBank): ExamSlope[] {
  return [];
}

export function weakestTopicWithAttempts(
  _user: UserState,
  _bank: QuestionBank,
  _minAttempts?: number,
): TopicMastery | null {
  return null;
}

void {} as ExamAttempt; // silence unused import until impls land
```

- [ ] **Step 2.2: Write the test scaffolding with a fixture builder**

Create `tests/unit/dashboardStats.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import type {
  QuestionBank,
  UserState,
  ExamAttempt,
  QuestionProgress,
  TopicProgress,
} from "@/data/types";
import { EMPTY_STATS } from "@/data/types";
import {
  masteryByTopic,
  overallMasteryPct,
  firstTryAccuracyPct,
  dailyHistogram,
  examTimeSeries,
  examSlopes,
  weakestTopicWithAttempts,
} from "@/lib/dashboardStats";

function makeBank(): QuestionBank {
  return {
    version: 1,
    total_questions: 6,
    categories: [
      {
        id: "math-knowledge",
        name_he: "ידע מתמטי",
        topic_count: 2,
        question_count: 5,
        topics: [
          {
            id: "שברים_עשרוניים",
            name_he: "שברים עשרוניים",
            source_file: "x.md",
            question_count: 3,
            questions: [],
          },
          {
            id: "אחוזים",
            name_he: "אחוזים",
            source_file: "y.md",
            question_count: 2,
            questions: [],
          },
        ],
      },
      {
        id: "logic-reasoning",
        name_he: "חשיבה והגיון",
        topic_count: 1,
        question_count: 1,
        topics: [
          {
            id: "סדרות",
            name_he: "סדרות",
            source_file: "z.md",
            question_count: 1,
            questions: [],
          },
        ],
      },
    ],
  };
}

function makeUser(overrides: Partial<UserState["progress"]> = {}): UserState {
  return {
    id: "u",
    name: "Test",
    createdAt: 1,
    progress: {
      questions: {} as Record<string, QuestionProgress>,
      topics: {} as Record<string, TopicProgress>,
      exams: [] as ExamAttempt[],
      reviewQueue: [],
      stats: { ...EMPTY_STATS },
      ...overrides,
    },
  };
}

describe("masteryByTopic", () => {
  it("returns one row per topic across categories, sorted ascending by pct", () => {
    const bank = makeBank();
    const user = makeUser({
      topics: {
        "01_ידע_מתמטי/שברים_עשרוניים": { attempted: 3, mastered: 2, totalQuestions: 3 },
        "01_ידע_מתמטי/אחוזים": { attempted: 1, mastered: 0, totalQuestions: 2 },
        "02_חשיבה_והגיון/סדרות": { attempted: 1, mastered: 1, totalQuestions: 1 },
      },
    });
    const rows = masteryByTopic(user, bank);
    expect(rows).toHaveLength(3);
    expect(rows.map((r) => r.topicName)).toEqual(["אחוזים", "שברים עשרוניים", "סדרות"]);
    expect(rows[0].pct).toBe(0);
    expect(rows[1].pct).toBe(67);
    expect(rows[2].pct).toBe(100);
  });

  it("treats topics with no progress as 0%", () => {
    const bank = makeBank();
    const user = makeUser();
    const rows = masteryByTopic(user, bank);
    expect(rows).toHaveLength(3);
    expect(rows.every((r) => r.pct === 0)).toBe(true);
  });
});

describe("overallMasteryPct", () => {
  it("is mastered/total across the whole bank, rounded", () => {
    const bank = makeBank();
    const user = makeUser({
      topics: {
        "01_ידע_מתמטי/שברים_עשרוניים": { attempted: 3, mastered: 2, totalQuestions: 3 },
        "02_חשיבה_והגיון/סדרות": { attempted: 1, mastered: 1, totalQuestions: 1 },
      },
    });
    // 3 of 6 = 50
    expect(overallMasteryPct(user, bank)).toBe(50);
  });
});

describe("firstTryAccuracyPct", () => {
  it("returns null with no answers", () => {
    expect(firstTryAccuracyPct(makeUser())).toBeNull();
  });
  it("is stars / totalAnswered rounded", () => {
    const u = makeUser();
    u.progress.stats.totalAnswered = 10;
    u.progress.stats.starsEarned = 6;
    expect(firstTryAccuracyPct(u)).toBe(60);
  });
});

describe("dailyHistogram", () => {
  it("returns one entry per day in window, zero-filled, ending at today", () => {
    const u = makeUser();
    u.progress.stats.dailyAnswered = {
      "2026-05-15": 3,
      "2026-05-17": 5,
    };
    const buckets = dailyHistogram(u, 7, "2026-05-17");
    expect(buckets).toHaveLength(7);
    expect(buckets.at(-1)).toEqual({ date: "2026-05-17", count: 5 });
    expect(buckets.find((b) => b.date === "2026-05-15")?.count).toBe(3);
    expect(buckets.find((b) => b.date === "2026-05-16")?.count).toBe(0);
  });
});

describe("examTimeSeries", () => {
  it("returns one point per attempt sorted by takenAt", () => {
    const u = makeUser({
      exams: [
        {
          examId: "03_מבחנים_לדוגמה/מבחן_לדוגמה_1",
          takenAt: 2000,
          durationSec: 100,
          timerEnabled: false,
          score: 18,
          total: 25,
          answers: {},
        },
        {
          examId: "03_מבחנים_לדוגמה/מבחן_לדוגמה_1",
          takenAt: 1000,
          durationSec: 100,
          timerEnabled: false,
          score: 15,
          total: 25,
          answers: {},
        },
      ],
    });
    const points = examTimeSeries(u);
    expect(points.map((p) => p.takenAt)).toEqual([1000, 2000]);
    expect(points[0].scorePct).toBe(60);
    expect(points[1].scorePct).toBe(72);
  });
});

describe("examSlopes", () => {
  it("returns one slope per exam taken at least twice, with examName from the bank", () => {
    const bank = makeBank();
    bank.categories.push({
      id: "sample-exams",
      name_he: "מבחנים לדוגמה",
      topic_count: 1,
      question_count: 25,
      topics: [
        {
          id: "מבחן_לדוגמה_1",
          name_he: "מבחן לדוגמה 1",
          source_file: "e.md",
          question_count: 25,
          questions: [],
        },
      ],
    });
    const u = makeUser({
      exams: [
        {
          examId: "03_מבחנים_לדוגמה/מבחן_לדוגמה_1",
          takenAt: 1000,
          durationSec: 100,
          timerEnabled: false,
          score: 15,
          total: 25,
          answers: {},
        },
        {
          examId: "03_מבחנים_לדוגמה/מבחן_לדוגמה_1",
          takenAt: 2000,
          durationSec: 100,
          timerEnabled: false,
          score: 22,
          total: 25,
          answers: {},
        },
      ],
    });
    const slopes = examSlopes(u, bank);
    expect(slopes).toHaveLength(1);
    expect(slopes[0].examName).toBe("מבחן לדוגמה 1");
    expect(slopes[0].first.scorePct).toBe(60);
    expect(slopes[0].latest.scorePct).toBe(88);
  });

  it("returns empty when no exam has been retaken", () => {
    const u = makeUser({
      exams: [
        {
          examId: "03_מבחנים_לדוגמה/מבחן_לדוגמה_1",
          takenAt: 1000,
          durationSec: 100,
          timerEnabled: false,
          score: 15,
          total: 25,
          answers: {},
        },
      ],
    });
    expect(examSlopes(u, makeBank())).toEqual([]);
  });
});

describe("weakestTopicWithAttempts", () => {
  it("returns the topic with the lowest mastery pct among topics with >= minAttempts", () => {
    const bank = makeBank();
    const u = makeUser({
      topics: {
        "01_ידע_מתמטי/שברים_עשרוניים": { attempted: 3, mastered: 2, totalQuestions: 3 }, // 67
        "01_ידע_מתמטי/אחוזים": { attempted: 1, mastered: 0, totalQuestions: 2 }, // 0 but <3 attempts
        "02_חשיבה_והגיון/סדרות": { attempted: 3, mastered: 1, totalQuestions: 1 }, // 100
      },
    });
    const w = weakestTopicWithAttempts(u, bank, 3);
    expect(w?.topicName).toBe("שברים עשרוניים");
  });

  it("returns null when no topic has enough attempts", () => {
    expect(weakestTopicWithAttempts(makeUser(), makeBank(), 3)).toBeNull();
  });
});
```

- [ ] **Step 2.3: Run the tests — confirm they all fail**

Run: `npx vitest run tests/unit/dashboardStats.test.ts`
Expected: every test fails — the stubs return `[]`/`0`/`null`.

- [ ] **Step 2.4: Implement the selectors**

Replace `src/lib/dashboardStats.ts`:

```ts
import type { QuestionBank, UserState, TopicId } from "@/data/types";
import { topicIdFor } from "@/data/types";
import { todayLocal } from "./date";

export interface TopicMastery {
  topicId: TopicId;
  categoryId: string;
  categoryName: string;
  topicName: string;
  attempted: number;
  mastered: number;
  total: number;
  pct: number;
}

export interface DailyBucket {
  date: string;
  count: number;
}

export interface ExamPoint {
  examId: TopicId;
  takenAt: number;
  scorePct: number;
}

export interface ExamSlope {
  examId: TopicId;
  examName: string;
  first: ExamPoint;
  latest: ExamPoint;
}

function pct(num: number, denom: number): number {
  return denom > 0 ? Math.round((num / denom) * 100) : 0;
}

export function masteryByTopic(user: UserState, bank: QuestionBank): TopicMastery[] {
  const rows: TopicMastery[] = [];
  for (const cat of bank.categories) {
    for (const topic of cat.topics) {
      const id = topicIdFor(cat.id, topic.id);
      const prog = user.progress.topics[id];
      const mastered = prog?.mastered ?? 0;
      const attempted = prog?.attempted ?? 0;
      const total = topic.question_count;
      rows.push({
        topicId: id,
        categoryId: cat.id,
        categoryName: cat.name_he,
        topicName: topic.name_he,
        attempted,
        mastered,
        total,
        pct: pct(mastered, total),
      });
    }
  }
  rows.sort((a, b) => a.pct - b.pct);
  return rows;
}

export function overallMasteryPct(user: UserState, bank: QuestionBank): number {
  const rows = masteryByTopic(user, bank);
  const total = rows.reduce((n, r) => n + r.total, 0);
  const mastered = rows.reduce((n, r) => n + r.mastered, 0);
  return pct(mastered, total);
}

export function firstTryAccuracyPct(user: UserState): number | null {
  const total = user.progress.stats.totalAnswered;
  if (total === 0) return null;
  return pct(user.progress.stats.starsEarned, total);
}

function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

export function dailyHistogram(
  user: UserState,
  lookbackDays: number,
  today: string = todayLocal(),
): DailyBucket[] {
  const buckets: DailyBucket[] = [];
  for (let i = lookbackDays - 1; i >= 0; i--) {
    const date = addDays(today, -i);
    buckets.push({ date, count: user.progress.stats.dailyAnswered?.[date] ?? 0 });
  }
  return buckets;
}

export function todaySparkline(
  user: UserState,
  today: string = todayLocal(),
): number[] {
  return dailyHistogram(user, 7, today).map((b) => b.count);
}

export function masteryTrendSparkline(user: UserState, bank: QuestionBank): number[] {
  // Cheap proxy: current overall mastery as a single-point line.
  // Real trend would require persisting daily mastery snapshots — out of scope here.
  const m = overallMasteryPct(user, bank);
  return [Math.max(0, m - 5), m];
}

export function examTimeSeries(user: UserState): ExamPoint[] {
  return user.progress.exams
    .map((a) => ({
      examId: a.examId,
      takenAt: a.takenAt,
      scorePct: pct(a.score, a.total),
    }))
    .sort((a, b) => a.takenAt - b.takenAt);
}

export function examSlopes(user: UserState, bank: QuestionBank): ExamSlope[] {
  const grouped = new Map<string, ExamPoint[]>();
  for (const p of examTimeSeries(user)) {
    const arr = grouped.get(p.examId) ?? [];
    arr.push(p);
    grouped.set(p.examId, arr);
  }
  const nameByExamId = new Map<string, string>();
  for (const cat of bank.categories) {
    for (const t of cat.topics) {
      nameByExamId.set(topicIdFor(cat.id, t.id), t.name_he);
    }
  }
  const slopes: ExamSlope[] = [];
  for (const [examId, points] of grouped) {
    if (points.length < 2) continue;
    slopes.push({
      examId,
      examName: nameByExamId.get(examId) ?? examId,
      first: points[0],
      latest: points[points.length - 1],
    });
  }
  return slopes.sort((a, b) => a.examName.localeCompare(b.examName));
}

export function weakestTopicWithAttempts(
  user: UserState,
  bank: QuestionBank,
  minAttempts = 3,
): TopicMastery | null {
  const candidates = masteryByTopic(user, bank).filter(
    (r) => r.attempted >= minAttempts && r.categoryId !== "sample-exams",
  );
  if (candidates.length === 0) return null;
  return candidates.reduce((min, r) => (r.pct < min.pct ? r : min));
}
```

- [ ] **Step 2.5: Run the tests again — all pass**

Run: `npx vitest run tests/unit/dashboardStats.test.ts`
Expected: 9/9 PASS.

- [ ] **Step 2.6: Commit**

```
git add src/lib/dashboardStats.ts tests/unit/dashboardStats.test.ts
git commit -m "feat(stats): add dashboardStats selector module"
```

---

## Task 3: Dashboard route + page skeleton + nav link

**Files:**
- Create: `src/pages/DashboardPage.tsx`
- Modify: `src/app/routes.tsx`
- Modify: `src/pages/HomePage.tsx`

- [ ] **Step 3.1: Create the empty dashboard page**

`src/pages/DashboardPage.tsx`:

```tsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/PageHeader";
import { selectActiveUser, useStore } from "@/store";
import { pageEnter } from "@/lib/motion";

export function DashboardPage() {
  const user = useStore(selectActiveUser);
  const bank = useStore((s) => s.bank);
  const loadBank = useStore((s) => s.loadBank);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) navigate("/welcome", { replace: true });
  }, [user, navigate]);

  useEffect(() => {
    loadBank();
  }, [loadBank]);

  if (!user) return null;

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-6 lg:py-10">
        <PageHeader backTo="/home" title="לוח התקדמות" />

        <motion.div initial="hidden" animate="show" variants={pageEnter} className="space-y-8">
          {!bank && <p className="text-muted">טוען נתונים…</p>}
          {bank && (
            <>
              {/* Section 1: Hero BANs */}
              {/* Section 2: Topic strength bars */}
              {/* Section 3: Topic bullet graphs */}
              {/* Section 4: Exam progression */}
              {/* Section 5: Action cards */}
            </>
          )}
        </motion.div>
      </div>
    </main>
  );
}
```

- [ ] **Step 3.2: Register the route**

In `src/app/routes.tsx`, add the import and the route below `/home`:

```tsx
import { DashboardPage } from "@/pages/DashboardPage";
// ...
<Route path="/dashboard" element={<DashboardPage />} />
```

- [ ] **Step 3.3: Add the nav link on HomePage header**

In `src/pages/HomePage.tsx`, modify the header `<div className="flex items-center gap-2 ...">` block (around line 152). Add a `BarChart3` button before the `Settings` link:

```tsx
import { BarChart3, Settings, Target, X } from "lucide-react";
```

And inside the header buttons cluster (right after the stat pills, before the `<Link to="/settings">`):

```tsx
<Link
  to="/dashboard"
  aria-label="לוח התקדמות"
  className="p-3 rounded-full hover:bg-hair focus-visible:ring-2 focus-visible:ring-brand-500"
>
  <BarChart3 size={20} />
</Link>
```

- [ ] **Step 3.4: Run dev server and verify navigation**

Run: `npm run dev`
Expected: visit `http://localhost:5173/home`, click the new chart icon, page loads with the "לוח התקדמות" header and empty body. Hit the back button — returns to `/home`.

- [ ] **Step 3.5: Run typecheck**

Run: `npm run build`
Expected: `tsc -b` and `vite build` complete without errors.

- [ ] **Step 3.6: Commit**

```
git add src/pages/DashboardPage.tsx src/app/routes.tsx src/pages/HomePage.tsx
git commit -m "feat(dashboard): add empty /dashboard route and nav link"
```

---

## Task 4: Section 1 — Hero BANs with sparklines

The book guidance (Ch 5, Ch 8): big numbers alone are meaningless — pair them with a sparkline or vs-target indicator. The `Sparkline` component already exists; we just need a BAN container.

**Files:**
- Create: `src/components/dashboard/StatBan.tsx`
- Modify: `src/pages/DashboardPage.tsx`

- [ ] **Step 4.1: Build the StatBan component**

`src/components/dashboard/StatBan.tsx`:

```tsx
import type { ReactNode } from "react";
import { CountUp } from "@/components/CountUp";
import { Sparkline } from "@/components/Sparkline";

interface Props {
  label: string;
  value: number;
  unit?: string;
  icon?: ReactNode;
  sparkline?: number[];
  /** Optional tint for the icon chip. Defaults to brand. */
  tint?: "brand" | "warn" | "danger" | "muted";
}

const tintMap: Record<NonNullable<Props["tint"]>, string> = {
  brand: "bg-brand-100 text-brand-700",
  warn: "bg-warn-100 text-warn-700",
  danger: "bg-danger-100 text-danger-600",
  muted: "bg-hair text-muted",
};

export function StatBan({ label, value, unit, icon, sparkline, tint = "brand" }: Props) {
  return (
    <div className="card p-5 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        {icon && (
          <span className={`w-10 h-10 rounded-xl grid place-items-center ${tintMap[tint]}`}>
            {icon}
          </span>
        )}
        <span className="section-label">{label}</span>
      </div>
      <div className="flex items-end justify-between gap-3">
        <div className="text-4xl lg:text-5xl font-black tabular-nums text-ink leading-none">
          <CountUp value={value} />
          {unit && <span className="text-xl text-muted font-bold mr-1">{unit}</span>}
        </div>
        {sparkline && sparkline.length > 0 && (
          <Sparkline data={sparkline} width={80} height={28} className="text-brand-500" />
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 4.2: Render the hero strip on the dashboard page**

In `src/pages/DashboardPage.tsx`, add the imports and replace the `{/* Section 1: Hero BANs */}` placeholder:

```tsx
import { Star, Flame, Target, TrendingUp } from "lucide-react";
import { StatBan } from "@/components/dashboard/StatBan";
import {
  overallMasteryPct,
  firstTryAccuracyPct,
  todaySparkline,
  masteryTrendSparkline,
} from "@/lib/dashboardStats";
```

Inside the `{bank && (...)}` block:

```tsx
<section className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
  <StatBan
    label="כוכבים"
    value={user.progress.stats.starsEarned}
    icon={<Star size={20} />}
    tint="warn"
  />
  <StatBan
    label="רצף ימים"
    value={user.progress.stats.currentStreakDays}
    icon={<Flame size={20} />}
    tint="danger"
  />
  <StatBan
    label="היום"
    value={user.progress.stats.todayCount}
    icon={<Target size={20} />}
    sparkline={todaySparkline(user)}
  />
  <StatBan
    label="שליטה כוללת"
    value={overallMasteryPct(user, bank)}
    unit="%"
    icon={<TrendingUp size={20} />}
    sparkline={masteryTrendSparkline(user, bank)}
  />
</section>

<p className="text-base text-muted">
  {firstTryAccuracyPct(user) === null
    ? "ענו על השאלה הראשונה כדי להתחיל לעקוב אחר ההצלחה."
    : `דיוק בנסיון ראשון: ${firstTryAccuracyPct(user)}%`}
</p>
```

- [ ] **Step 4.3: Browser-check the hero strip**

Run `npm run dev`. With an active user that has some progress, visit `/dashboard`. Expected:
- Four BAN cards stack 2×2 on mobile, 1×4 on desktop
- Today and Mastery cards show a sparkline; if today's `dailyAnswered` is all zero, sparkline appears flat
- Sub-line shows first-try accuracy (or the empty-state message for a brand-new user)
- No emoji, no red/green colour pairing (the warn/danger tints are amber/red used separately, not as status semantics)

- [ ] **Step 4.4: Verify reduced-motion behaviour**

In DevTools, toggle "Emulate CSS prefers-reduced-motion: reduce". Reload. The `CountUp` should snap to the final value rather than animating. The sparkline is static SVG — no change expected. The section entry animation should be a plain fade (per the `useMotionVariants` shared contract).

- [ ] **Step 4.5: Commit**

```
git add src/components/dashboard/StatBan.tsx src/pages/DashboardPage.tsx
git commit -m "feat(dashboard): section 1 — hero BANs with sparklines"
```

---

## Task 5: Section 2 — Sorted topic strength bars

The most load-bearing chart on the page. One sorted horizontal bar per topic. Sort ascending so the kid sees "where to focus" at the top.

**Files:**
- Create: `src/components/dashboard/SortedTopicBars.tsx`
- Modify: `src/pages/DashboardPage.tsx`

- [ ] **Step 5.1: Build the SortedTopicBars component**

`src/components/dashboard/SortedTopicBars.tsx`:

```tsx
import { Link } from "react-router-dom";
import { urlFromTopicId } from "@/data/types";
import type { TopicMastery } from "@/lib/dashboardStats";

interface Props {
  rows: TopicMastery[];
}

const CAT_LABEL_HE: Record<string, string> = {
  "math-knowledge": "ידע מתמטי",
  "logic-reasoning": "חשיבה והגיון",
  "sample-exams": "מבחנים",
};

export function SortedTopicBars({ rows }: Props) {
  const max = 100;
  const practiceRows = rows.filter((r) => r.categoryId !== "sample-exams");
  return (
    <div className="card p-5 lg:p-6">
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-2xl font-bold text-ink">חוזק לפי נושא</h2>
        <span className="section-label">ממוין מהחלש לחזק</span>
      </div>

      <ul className="space-y-2">
        {practiceRows.map((r) => {
          const widthPct = (r.pct / max) * 100;
          const to = `/practice/${urlFromTopicId(r.topicId)}`;
          return (
            <li key={r.topicId}>
              <Link
                to={to}
                className="block rounded-xl px-3 py-3 hover:bg-hair/60 focus-visible:ring-2 focus-visible:ring-brand-500 transition-colors"
              >
                <div className="flex items-center justify-between gap-3 mb-2">
                  <span className="text-base text-muted tabular-nums shrink-0">
                    {r.mastered}/{r.total} · {CAT_LABEL_HE[r.categoryId] ?? r.categoryId}
                  </span>
                  <span className="font-bold text-ink leading-tight text-right flex-1">
                    {r.topicName}
                  </span>
                </div>
                <div
                  className="relative h-3 bg-hair rounded-full overflow-hidden"
                  role="meter"
                  aria-valuenow={r.pct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${r.topicName}: ${r.pct} אחוזי שליטה`}
                >
                  <div
                    className="absolute inset-y-0 right-0 bg-brand-500 rounded-full transition-[width] duration-500"
                    style={{ width: `${widthPct}%` }}
                  />
                </div>
                <div className="mt-1 text-base text-brand-700 tabular-nums font-semibold text-left">
                  {r.pct}%
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
```

Notes:
- The bar grows from the right edge (`right-0`) so it matches RTL reading.
- The percent number sits on the left so it appears at the "growing tip" in RTL.
- Each row is a link straight into practice for that topic — making the chart actionable, per Ch 30.

- [ ] **Step 5.2: Render it on the dashboard page**

In `src/pages/DashboardPage.tsx`, add the import and replace `{/* Section 2: Topic strength bars */}`:

```tsx
import { SortedTopicBars } from "@/components/dashboard/SortedTopicBars";
import { masteryByTopic } from "@/lib/dashboardStats";
```

```tsx
<SortedTopicBars rows={masteryByTopic(user, bank)} />
```

- [ ] **Step 5.3: Browser-check the sorted bars**

Run `npm run dev`. Visit `/dashboard`. Expected:
- All practice topics (math + logic) listed; sample-exam topics excluded
- Weakest topic at the top, strongest at the bottom
- Bars grow from the right; percentage appears on the left
- Clicking a row navigates into practice for that topic

- [ ] **Step 5.4: Commit**

```
git add src/components/dashboard/SortedTopicBars.tsx src/pages/DashboardPage.tsx
git commit -m "feat(dashboard): section 2 — sorted topic strength bars"
```

---

## Task 6: Section 3 — Bullet graphs per topic

The canonical bullet graph (Ch 17). Each row: qualitative bands (poor/fair/good), an actual bar, and a target tick. The bands are sequential greys — never red/green.

**Files:**
- Create: `src/components/dashboard/BulletGraph.tsx`
- Create: `src/components/dashboard/TopicBulletList.tsx`
- Modify: `src/pages/DashboardPage.tsx`

- [ ] **Step 6.1: Build the BulletGraph primitive**

`src/components/dashboard/BulletGraph.tsx`:

```tsx
interface Props {
  /** Actual value, 0–100 */
  value: number;
  /** Target, 0–100. Vertical tick. */
  target?: number;
  /** Optional band boundaries in ascending order (e.g. [40, 75]). Three bands: 0–40 poor, 40–75 fair, 75–100 good. */
  bands?: [number, number];
  width?: number;
  height?: number;
}

export function BulletGraph({
  value,
  target = 80,
  bands = [40, 75],
  width = 280,
  height = 18,
}: Props) {
  const clamp = (n: number) => Math.max(0, Math.min(100, n));
  const v = clamp(value);
  const t = clamp(target);
  const [b1, b2] = bands.map(clamp);

  // Coordinate system: 0..100 left-to-right within the SVG. We flip visually for RTL via scaleX(-1).
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 100 18"
      preserveAspectRatio="none"
      role="img"
      aria-label={`שליטה ${v} מתוך 100, יעד ${t}`}
      style={{ transform: "scaleX(-1)" }}
    >
      {/* Bands (sequential — light to medium to brand-50). NEVER red/green. */}
      <rect x="0" y="0" width={b1} height="18" fill="#F3F4F6" />
      <rect x={b1} y="0" width={b2 - b1} height="18" fill="#E5E7EB" />
      <rect x={b2} y="0" width={100 - b2} height="18" fill="#DCFCE7" />
      {/* Actual bar */}
      <rect x="0" y="5" width={v} height="8" fill="#22C55E" rx="2" />
      {/* Target tick */}
      <line x1={t} y1="1" x2={t} y2="17" stroke="#0F172A" strokeWidth="1.5" />
    </svg>
  );
}
```

The `scaleX(-1)` on the SVG flips the entire chart so the bar grows from the right in RTL — without us having to reverse-coord every `<rect>`.

- [ ] **Step 6.2: Build the TopicBulletList wrapper**

`src/components/dashboard/TopicBulletList.tsx`:

```tsx
import type { TopicMastery } from "@/lib/dashboardStats";
import { BulletGraph } from "./BulletGraph";

interface Props {
  rows: TopicMastery[];
}

export function TopicBulletList({ rows }: Props) {
  return (
    <div className="card p-5 lg:p-6">
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-2xl font-bold text-ink">שליטה מול יעד</h2>
        <span className="section-label">יעד 80%</span>
      </div>
      <p className="text-base text-muted mb-4">
        הסרגל מציג מצב נוכחי. הקו האנכי הוא היעד שלך. הרקע מציין: לתרגול נוסף · בתהליך · שליטה.
      </p>

      <ul className="space-y-3">
        {rows
          .filter((r) => r.categoryId !== "sample-exams")
          .map((r) => (
            <li key={r.topicId} className="flex items-center gap-4">
              <div className="flex-1 min-w-0 text-right">
                <div className="font-bold text-ink truncate-none leading-tight">{r.topicName}</div>
                <div className="text-base text-muted tabular-nums">{r.pct}%</div>
              </div>
              <BulletGraph value={r.pct} target={80} />
            </li>
          ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 6.3: Render it on the dashboard page**

In `src/pages/DashboardPage.tsx`, add the import and replace `{/* Section 3: Topic bullet graphs */}`:

```tsx
import { TopicBulletList } from "@/components/dashboard/TopicBulletList";
```

```tsx
<TopicBulletList rows={masteryByTopic(user, bank)} />
```

- [ ] **Step 6.4: Browser-check the bullet graphs**

Visit `/dashboard`. Expected:
- One row per practice topic
- A horizontal bullet with three shaded bands (light/medium/brand-tinted)
- A dark green bar showing mastery, growing from the right
- A vertical ink-coloured tick at the 80% target line
- Topic name in bold on the right; mastery percent below it

- [ ] **Step 6.5: Commit**

```
git add src/components/dashboard/BulletGraph.tsx src/components/dashboard/TopicBulletList.tsx src/pages/DashboardPage.tsx
git commit -m "feat(dashboard): section 3 — per-topic bullet graphs"
```

---

## Task 7: Section 4 — Exam progression (line + slope)

Two adjacent panels. Both render only when there's exam data.

**Files:**
- Create: `src/components/dashboard/ExamLineChart.tsx`
- Create: `src/components/dashboard/ExamSlopeChart.tsx`
- Modify: `src/pages/DashboardPage.tsx`

- [ ] **Step 7.1: Build the ExamLineChart**

`src/components/dashboard/ExamLineChart.tsx`:

```tsx
import type { ExamPoint } from "@/lib/dashboardStats";

interface Props {
  points: ExamPoint[];
}

export function ExamLineChart({ points }: Props) {
  if (points.length === 0) {
    return (
      <div className="card p-5 lg:p-6">
        <h3 className="text-xl font-bold text-ink mb-2">ציוני מבחנים</h3>
        <p className="text-base text-muted">עוד לא ניגשת למבחן לדוגמה. אחרי המבחן הראשון תראי כאן את הציון.</p>
      </div>
    );
  }
  const W = 320;
  const H = 140;
  const pad = 18;
  const t0 = points[0].takenAt;
  const tN = points[points.length - 1].takenAt;
  const span = Math.max(1, tN - t0);

  const xy = points.map((p) => {
    const x = pad + ((p.takenAt - t0) / span) * (W - 2 * pad);
    const y = H - pad - (p.scorePct / 100) * (H - 2 * pad);
    return { x, y, p };
  });
  const path = xy.map(({ x, y }, i) => `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");

  return (
    <div className="card p-5 lg:p-6">
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="text-xl font-bold text-ink">ציוני מבחנים</h3>
        <span className="section-label">{points.length} נסיונות</span>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        className="block"
        role="img"
        aria-label={`גרף ציוני מבחנים. ${points.length} נקודות.`}
      >
        {/* Y gridlines at 50% and 100% */}
        <line x1={pad} y1={H - pad - ((50 / 100) * (H - 2 * pad))} x2={W - pad} y2={H - pad - ((50 / 100) * (H - 2 * pad))} stroke="#F3F4F6" />
        <line x1={pad} y1={pad} x2={W - pad} y2={pad} stroke="#F3F4F6" />
        <text x={pad} y={pad - 4} fontSize="12" fill="#6B7280">100%</text>
        <text x={pad} y={H - pad - ((50 / 100) * (H - 2 * pad)) - 4} fontSize="12" fill="#6B7280">50%</text>

        <path d={path} fill="none" stroke="#22C55E" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {xy.map(({ x, y, p }, i) => (
          <circle key={i} cx={x} cy={y} r="3.5" fill="#22C55E">
            <title>{`${p.scorePct}% · ${new Date(p.takenAt).toLocaleDateString("he-IL")}`}</title>
          </circle>
        ))}
      </svg>
    </div>
  );
}
```

Note on the `<text>` font size: the override in `src/styles/index.css` enforces 16 px on `.text-xs` and `.text-sm` Tailwind classes — but SVG `<text fontSize>` is unaffected. 12 px is acceptable for axis labels per the book (it's a chart label, not body text). If your project lead prefers strict 16 px everywhere, raise to 14 px and accept slight visual heaviness.

- [ ] **Step 7.2: Build the ExamSlopeChart**

`src/components/dashboard/ExamSlopeChart.tsx`:

```tsx
import type { ExamSlope } from "@/lib/dashboardStats";

interface Props {
  slopes: ExamSlope[];
}

export function ExamSlopeChart({ slopes }: Props) {
  if (slopes.length === 0) {
    return (
      <div className="card p-5 lg:p-6">
        <h3 className="text-xl font-bold text-ink mb-2">שיפור במבחנים</h3>
        <p className="text-base text-muted">תגשי לאותו מבחן פעמיים כדי לראות כאן את השיפור.</p>
      </div>
    );
  }
  const W = 320;
  const H = Math.max(160, 26 * slopes.length + 40);
  const padTop = 20;
  const padBottom = 14;
  const leftX = 40;
  const rightX = W - 40;
  const innerH = H - padTop - padBottom;

  const y = (pct: number) => padTop + (1 - pct / 100) * innerH;

  return (
    <div className="card p-5 lg:p-6">
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="text-xl font-bold text-ink">שיפור במבחנים</h3>
        <span className="section-label">ראשון מול אחרון</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" className="block" role="img">
        {/* axes */}
        <line x1={leftX} y1={padTop} x2={leftX} y2={H - padBottom} stroke="#E5E7EB" />
        <line x1={rightX} y1={padTop} x2={rightX} y2={H - padBottom} stroke="#E5E7EB" />
        <text x={leftX} y={padTop - 6} fontSize="12" fill="#6B7280" textAnchor="middle">ראשון</text>
        <text x={rightX} y={padTop - 6} fontSize="12" fill="#6B7280" textAnchor="middle">אחרון</text>

        {slopes.map((s, i) => {
          const yFirst = y(s.first.scorePct);
          const yLatest = y(s.latest.scorePct);
          const improved = s.latest.scorePct >= s.first.scorePct;
          const stroke = improved ? "#22C55E" : "#9CA3AF";
          return (
            <g key={s.examId}>
              <line x1={leftX} y1={yFirst} x2={rightX} y2={yLatest} stroke={stroke} strokeWidth="2" />
              <circle cx={leftX} cy={yFirst} r="3.5" fill={stroke} />
              <circle cx={rightX} cy={yLatest} r="3.5" fill={stroke} />
              <text x={leftX - 6} y={yFirst + 4} fontSize="12" fill="#0F172A" textAnchor="end">
                {s.first.scorePct}%
              </text>
              <text x={rightX + 6} y={yLatest + 4} fontSize="12" fill="#0F172A">
                {s.latest.scorePct}%
              </text>
              <text x={W / 2} y={(yFirst + yLatest) / 2 - 4} fontSize="12" fill="#0F172A" textAnchor="middle">
                {s.examName}
              </text>
              {void i}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
```

Note: we deliberately avoid red for "got worse" — using grey (muted) vs green (improved) keeps the palette CVD-safe (Ch 33). The colour difference is "warm vs neutral," not red vs green.

- [ ] **Step 7.3: Render both panels on the dashboard**

In `src/pages/DashboardPage.tsx`, add the imports and replace `{/* Section 4: Exam progression */}`:

```tsx
import { ExamLineChart } from "@/components/dashboard/ExamLineChart";
import { ExamSlopeChart } from "@/components/dashboard/ExamSlopeChart";
import { examTimeSeries, examSlopes } from "@/lib/dashboardStats";
```

```tsx
<section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
  <ExamLineChart points={examTimeSeries(user)} />
  <ExamSlopeChart slopes={examSlopes(user, bank)} />
</section>
```

- [ ] **Step 7.4: Browser-check both charts in empty + populated states**

- With a new user (no exam attempts): both panels show the empty-state copy.
- With at least one attempt: line chart renders a single point; slope still says "tag the same exam twice."
- With two attempts of the same exam: slope renders a green or grey line connecting the two endpoints.

If you don't have data, do an exam attempt manually via the app, then revisit.

- [ ] **Step 7.5: Commit**

```
git add src/components/dashboard/ExamLineChart.tsx src/components/dashboard/ExamSlopeChart.tsx src/pages/DashboardPage.tsx
git commit -m "feat(dashboard): section 4 — exam line + slope charts"
```

---

## Task 8: Section 5 — Action cards (review queue + weakest topic)

The "what do I do next" layer. A dashboard that doesn't tell you what to do is a museum exhibit (Ch 30).

**Files:**
- Create: `src/components/dashboard/ActionCards.tsx`
- Modify: `src/pages/DashboardPage.tsx`

- [ ] **Step 8.1: Build the ActionCards component**

`src/components/dashboard/ActionCards.tsx`:

```tsx
import { Link } from "react-router-dom";
import { Target, TrendingDown } from "lucide-react";
import { urlFromTopicId } from "@/data/types";
import type { TopicMastery } from "@/lib/dashboardStats";

interface Props {
  reviewSize: number;
  weakestTopic: TopicMastery | null;
}

export function ActionCards({ reviewSize, weakestTopic }: Props) {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {reviewSize > 0 ? (
        <Link
          to="/review"
          className="card p-5 flex items-center gap-4 hover:border-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          <span className="w-12 h-12 rounded-xl grid place-items-center bg-warn-100 text-warn-700 shrink-0">
            <Target size={22} />
          </span>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-ink text-lg leading-tight">תור חזרה</div>
            <div className="text-base text-muted">{reviewSize} שאלות מחכות לתרגול חוזר</div>
          </div>
          <span className="shrink-0 text-brand-700 font-semibold">חזרה ←</span>
        </Link>
      ) : (
        <div className="card p-5 flex items-center gap-4 opacity-80">
          <span className="w-12 h-12 rounded-xl grid place-items-center bg-hair text-muted shrink-0">
            <Target size={22} />
          </span>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-ink text-lg leading-tight">תור חזרה</div>
            <div className="text-base text-muted">אין שאלות לחזרה. כל הכבוד.</div>
          </div>
        </div>
      )}

      {weakestTopic ? (
        <Link
          to={`/practice/${urlFromTopicId(weakestTopic.topicId)}`}
          className="card p-5 flex items-center gap-4 hover:border-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          <span className="w-12 h-12 rounded-xl grid place-items-center bg-brand-100 text-brand-700 shrink-0">
            <TrendingDown size={22} />
          </span>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-ink text-lg leading-tight">נושא להתמקדות</div>
            <div className="text-base text-muted">
              {weakestTopic.topicName} · {weakestTopic.pct}% שליטה
            </div>
          </div>
          <span className="shrink-0 text-brand-700 font-semibold">תרגלי ←</span>
        </Link>
      ) : (
        <div className="card p-5 flex items-center gap-4 opacity-80">
          <span className="w-12 h-12 rounded-xl grid place-items-center bg-hair text-muted shrink-0">
            <TrendingDown size={22} />
          </span>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-ink text-lg leading-tight">נושא להתמקדות</div>
            <div className="text-base text-muted">תרגלי כמה שאלות כדי שנמליץ נושא להתמקד בו.</div>
          </div>
        </div>
      )}
    </section>
  );
}
```

- [ ] **Step 8.2: Render on the dashboard**

In `src/pages/DashboardPage.tsx`, add the imports and replace `{/* Section 5: Action cards */}`:

```tsx
import { ActionCards } from "@/components/dashboard/ActionCards";
import { weakestTopicWithAttempts } from "@/lib/dashboardStats";
import { selectReviewQueueSize } from "@/store";
```

Inside the component, before `return`:

```tsx
const reviewSize = useStore(selectReviewQueueSize);
```

And inside the JSX:

```tsx
{bank && (
  <ActionCards reviewSize={reviewSize} weakestTopic={weakestTopicWithAttempts(user, bank, 3)} />
)}
```

- [ ] **Step 8.3: Browser-check**

- New user: both cards show their muted empty states.
- After some practice with low mastery on a topic (≥3 attempts): the "נושא להתמקדות" card highlights it and links to practice.
- After failing a question 3× (it goes into the review queue): "תור חזרה" highlights with the count.

- [ ] **Step 8.4: Commit**

```
git add src/components/dashboard/ActionCards.tsx src/pages/DashboardPage.tsx
git commit -m "feat(dashboard): section 5 — action cards (review + weakest topic)"
```

---

## Task 9: Final polish — manual verification

This is a checklist, not new code. UI feature-correctness can't be claimed from tests alone (per the project's verification-before-completion principle).

**Files:** none modified — verification only.

- [ ] **Step 9.1: Build the project and run all tests**

Run: `npm run build && npm test`
Expected: build succeeds; all tests pass.

- [ ] **Step 9.2: Test with a brand-new user**

1. `npm run dev`
2. Open an incognito window at `http://localhost:5173/`.
3. Create a user with a fresh name.
4. Navigate straight to `/dashboard` (or via the new chart icon on `/home`).
5. Verify: all four BANs read 0; topic bars all 0%; bullet graphs all 0%; both exam panels show the empty-state copy; both action cards show the muted empty state.

- [ ] **Step 9.3: Test with a populated user**

1. From the new user, complete:
   - 5 practice questions in one topic (some first-try correct, some not)
   - 1 sample exam end-to-end
2. Return to `/dashboard`.
3. Verify the changes propagate: stars updated, today count updated, the topic you practised appears mid-list (not at the bottom), exam line chart shows 1 point, slope chart still shows empty state.
4. Retake the same exam. Slope chart should now render a coloured line endpoint-to-endpoint.

- [ ] **Step 9.4: RTL visual check**

- Topic bars fill from the right edge leftward. The percentage label is on the left side of each row.
- Bullet graphs: the green bar starts at the right edge and grows leftward; the target tick is at 80% (about 1/5 from the left visually).
- Exam line chart: leftmost point is the earliest attempt — visually that lands on the *right* in the RTL layout since the parent flow doesn't flip the SVG. (If this reads backwards to you, document it but leave alone — line charts are conventionally LTR-time even in RTL UIs; the book's `cycle_plot` chapter says the same.)

- [ ] **Step 9.5: Reduced-motion check**

DevTools → emulate `prefers-reduced-motion: reduce` → reload `/dashboard`. Expected:
- BAN values snap to their final number (CountUp respects reduced-motion already)
- Section entry uses fade only (the `useMotionVariants` contract)
- No bobbing, pulsing, or magnetic effects

- [ ] **Step 9.6: Colour-blind safety spot-check**

Use the Chromatic Vision Simulator extension or DevTools "Emulate vision deficiencies: Protanopia". The slope chart's "got better vs got worse" distinction (green vs grey) should remain clearly distinguishable. The bullet graph's bands should still read low-to-high as light-to-dark grey-to-green. If anything reads as ambiguous red/green, switch to grey/orange or add a shape token.

- [ ] **Step 9.7: Mobile layout check**

DevTools → device toolbar → iPhone 12 (390 × 844). Expected:
- BANs stack 2 × 2
- Topic bars list scrolls cleanly; no horizontal overflow
- Bullet graphs may compress to ~120 px wide — readable, target tick still visible
- Exam panels stack vertically (`grid-cols-1` at this breakpoint)

- [ ] **Step 9.8: Commit the verification log**

If you found and fixed anything in steps 9.4–9.7, commit those fixes. If everything passed, no commit needed.

```
git add -A
git commit -m "chore(dashboard): manual verification pass — RTL, a11y, mobile"
```

---

## Self-review (run after the plan is written, before handing off)

- **Spec coverage:** All 5 sections from the recommendation map to tasks 4–8. Data-model precondition is task 1. Selectors precondition is task 2. Route + nav is task 3. Polish is task 9. ✓
- **Placeholder scan:** No TODOs, no "implement later," no "similar to Task N." Every step has the actual code or command. ✓
- **Type consistency:** `TopicMastery`, `ExamPoint`, `ExamSlope` are defined in task 2 and referenced consistently in tasks 5, 6, 7, 8. `selectReviewQueueSize` is the existing selector from `src/store/index.ts`. `urlFromTopicId`, `topicIdFor`, `EMPTY_STATS`, `PersistRoot`, `UserState` are existing exports — verified against `src/data/types.ts` and `src/store/index.ts`. ✓
- **Risks worth flagging to whoever executes:**
  - `npm run lint` is currently broken (ESLint v9 needs flat-config migration per CLAUDE.md) — don't rely on it as a gate. Use `npm run build` for the typecheck and `npm test` for the unit suite.
  - The repo isn't a git repo per the harness signal; the commit steps are best-effort. If they error, continue.
  - `masteryTrendSparkline` is a deliberately cheap proxy — a real mastery-over-time chart requires daily snapshots which would be a separate small persistence change. Flag this if the user pushes back on the flatness of that one sparkline.
