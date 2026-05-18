# Lesson explanations — design spec

**Date:** 2026-05-18
**Status:** Draft, awaiting user review before writing-plans hand-off
**Owner:** Liraz

## 1. Goal

Teach kids (ages ~9–12) *how* to solve each kind of problem in the bank — long division, short division, multiplying with decimals, percentages of a number, adding fractions with different denominators, and so on. Today the app only drills the bank; there is no teaching surface. We are adding one mini-lesson per discrete *skill*, surfaced inline from each practice question via an "איך פותרים?" button.

## 2. Scope

### In scope (v1)

- ~50 Hebrew mini-lessons, one per discrete skill, authored as markdown.
- A `q_id → skill_id` mapping covering all 497 questions in the bank.
- A new `lessonsSlice` in the Zustand store; in-memory only.
- An "איך פותרים?" button on each practice question header that opens the relevant lesson in a modal.
- The same button in exam mode, gated by a confirmation dialog.
- A one-time pulse animation on the button to surface discoverability.
- A new build step: `tools/parse_lessons.py` validates lesson markdown and writes `data/lessons.json`.
- `npm run sync-data` extended to copy `lessons.json` and `question_skills.json` into `public/data/`.
- Unit tests for the slice, the parser, and the modal component.

### Out of scope (v1)

- No `/learn` route, no top-level "Learn" tile, no browseable lesson catalog.
- No lesson progress tracking (no "read" state, no stars or streaks for reading).
- No cross-lesson navigation ("up next", "related").
- No search across lessons.
- No localization layer — Hebrew strings live directly in markdown.
- Logic topics (truth/falsehood, sequences, spatial reasoning, combinatorics) get at most 1–2 lessons each — they are puzzle types where strategy varies per problem; mass instruction has low ROI.
- No new e2e tests; Playwright suite stays as-is.

These can all be added later if the inline-only experience proves too hidden. Easier to add discoverability than remove it.

## 3. Data flow

```
data/lessons/<topic-slug>/<skill-slug>.md        (Hebrew markdown, hand-authored)
   │
   │ tools/parse_lessons.py
   ▼
data/lessons.json                                 (build artifact: all lessons)
data/question_skills.json                         (hand-curated: q_id → skill_id)
   │
   │ npm run sync-data
   ▼
public/data/lessons.json
public/data/question_skills.json
   │
   │ fetch() in lessonsSlice.loadLessons
   ▼
in-memory lessonMap + skillMap                   (consumed by UI)
```

This mirrors the existing two-tier `data/db/**/*.md → data/questions.json → public/data/questions.json` pattern exactly. Markdown is the source of truth; JSON is a build artifact and must not be hand-edited.

`<topic-slug>` reuses the existing ASCII URL slugs from `TOPIC_URL_SLUGS` in `src/data/types.ts` (`decimal-fractions`, `simple-fractions`, etc.), so there is no new naming system.

## 4. Lesson content shape

### 4.1 File layout

```
data/lessons/
  decimal-fractions/
    multiply-decimals.md
    divide-decimals-by-decimals.md
    compare-decimals.md
    decimal-to-fraction.md
    long-division-with-decimals.md
  simple-fractions/
    add-fractions-same-denominator.md
    add-fractions-different-denominator.md
    multiply-fractions.md
    divide-fractions.md
    mixed-to-improper.md
  percentages/
    percent-of-number.md
    percent-increase.md
    convert-decimal-to-percent.md
    find-original-from-percent.md
  ...
```

The exact skill list per topic is enumerated during implementation by scanning the actual question bank. Rough target: ~5 skills per topic across ~10 topics with teachable procedures, plus 1–2 for each logic topic ≈ **~50 lessons total**.

### 4.2 Markdown format

Each lesson is YAML frontmatter plus a body with exactly three H2 sections, in this order:

```markdown
---
id: multiply-decimals
title: כפל שברים עשרוניים
topic: decimal-fractions
aliases: [ "מכפלת עשרוניים" ]
---

## איך עושים זאת?
1. נכפול את שני המספרים בלי להתחשב בנקודה.
2. נספור כמה ספרות אחרי הנקודה יש בשני המספרים יחד.
3. נשים את הנקודה בתוצאה כך שיהיו בה אותו מספר ספרות.

## דוגמה
$$0.4 \times 0.7 = ?$$
- $4 \times 7 = 28$
- בשני המספרים יחד יש 2 ספרות אחרי הנקודה
- תשובה: $0.28$

## לשים לב
טעות נפוצה: לשכוח לספור את הספרות בשני המספרים — לא רק באחד.
```

**Frontmatter — required fields:**

| Field | Type | Notes |
|---|---|---|
| `id` | string (kebab-case) | The `skill_id`. Must be globally unique. Matches values used in `question_skills.json`. |
| `title` | string (Hebrew) | Modal header. |
| `topic` | string (kebab-case) | Topic slug from `TOPIC_URL_SLUGS`. Parser rejects unknown values. |
| `aliases` | string[] (Hebrew) | Optional. Reserved for future search; ignored at runtime. |

**Body — required structure:**

- Exactly three H2 headings: `## איך עושים זאת?`, `## דוגמה`, `## לשים לב`, in that order.
- Math expressions use KaTeX (`$inline$` and `$$display$$`) — already supported in the app.
- Parser fails the build if any of the three sections is missing or out of order, or if extra H2s appear.

### 4.3 Copy register

Warm and direct, in first-person plural ("נכפול", "נספור"), addressing the kid as a collaborator rather than a student. Avoid formal imperative ("עליך להכפיל") and avoid talking down. Audience is ages ~9–12.

### 4.4 Skill ID naming conventions

- Kebab-case English, consistent with URL slugs.
- One ID per discrete teachable technique. Sibling techniques get sibling IDs (`add-fractions-same-denominator` vs `add-fractions-different-denominator`) rather than being merged into one lesson.
- Skill IDs are stable once shipped — they appear in `question_skills.json` and breaking changes require a coordinated migration.

## 5. Question → skill mapping

A new file `data/question_skills.json` is a flat object:

```json
{
  "01_ידע_מתמטי/שברים_עשרוניים/q_1": "multiply-decimals",
  "01_ידע_מתמטי/שברים_עשרוניים/q_2": "long-division-with-decimals",
  "01_ידע_מתמטי/שברים_עשרוניים/q_3": "compare-decimals",
  ...
}
```

- Generated by a one-time Claude classification pass during the implementation phase. The user spot-checks at least 5 random tags per topic before merging.
- Stable thereafter — checked into git as a curated artifact.
- Decoupled from `questions.json` so adding/changing tags does not require rebuilding the question bank.
- Questions for which no lesson applies (e.g. some logic puzzles) are simply absent from the file — the explain button hides itself when there is no mapping.

## 6. State management

### 6.1 New slice: `src/store/lessonsSlice.ts`

```ts
export interface RawLesson {
  id: string;                  // skill_id, e.g. "multiply-decimals"
  title: string;               // Hebrew title
  topic: string;               // topic slug, e.g. "decimal-fractions"
  body: string;                // markdown body (3 H2 sections)
  aliases?: string[];
}

export interface LessonsSlice {
  lessons: Record<string, RawLesson> | null;        // skill_id → lesson
  questionSkills: Record<string, string> | null;    // q_id → skill_id
  loadLessons(): Promise<void>;
  lessonForQuestion(qId: QuestionId): RawLesson | null;
}
```

- In-memory only; not persisted. `loadLessons` runs inside the existing `loadBank` orchestration in `App.tsx` so bank + lessons are both ready before first render.
- `lessonForQuestion(qId)` is the single accessor the UI uses. It composes the two maps and returns either a lesson or `null`. UI must not reach into the maps directly.
- The slice has no mutators beyond `loadLessons` — lessons are read-only at runtime.

### 6.2 Persistence change: `usersSlice`

Add one boolean field to `UserStats`:

```ts
interface UserStats {
  // ...existing fields
  lessonHintSeen: boolean;     // true once user has seen the pulse animation
}
```

- Default `false`. Set to `true` the first time the pulse animation fires.
- Per-user (lives inside `UserState.progress.stats`), persisted via the existing hand-rolled `persist()`/`writePersist()` path in `usersSlice.ts`.
- `EMPTY_STATS` in `src/data/types.ts` gets the new default (`lessonHintSeen: false`) so newly-created users have it.
- `src/store/migrations.ts` gets an extension to `backfillUser()`: if `progress.stats.lessonHintSeen` is missing, add it as `false`. Mirrors the existing `dailyAnswered` backfill pattern exactly. Existing persisted users do not lose data.

## 7. UI surface

### 7.1 The "איך פותרים?" button

- Placement: in the practice/exam question header, near the question number. Lucide icon `BookOpen` plus the label "איך פותרים?".
- Sizing: matches existing secondary header actions (e.g. the back button), font size ≥16px per the project-wide rule.
- Hidden when:
  - `lessonForQuestion(currentQId)` returns `null` (no mapping or no lesson).
  - The fetch for lessons failed at boot (slice maps are `null`).
- First-time discoverability: if `lessonHintSeen` is `false` and the button is visible, it plays a one-time pulse animation (Framer Motion, reduced-motion-safe). On click — or after ~3 cycles — the animation stops and `markLessonHintSeen()` flips the flag.

### 7.2 The lesson modal

- Pattern: slide-up sheet on mobile, scale-in modal on desktop. Reuses the HomePage category-modal motion variants from `src/lib/motion.ts`. No new motion primitives.
- Contents:
  - Header: lesson title + close button.
  - Body: rendered markdown. Each H2 becomes a section with the existing `section-label` style. KaTeX math via the existing renderer used in questions.
  - Footer: a single secondary action **"חזרה לתרגיל"** that closes the modal. No "next lesson", no "browse all".
- Close behaviors: explicit close button, overlay click, Escape key, mobile swipe-down — all consistent with the existing modal.
- Reduced-motion: fade-only entry/exit via `useMotionVariants()`.

### 7.3 Exam mode

- The button appears in `ExamPage` as well.
- Tapping it opens a confirmation dialog first:
  > **"לפתוח עזרה? זה לא ייפסל מהציון אבל זה משנה את אופי המבחן."**
  - Default focus on the dismiss action.
  - Confirm → opens the lesson modal exactly as in practice mode.
- No state is recorded about whether help was used during an exam. We are not policing this.
- The confirmation copy is final and not configurable.

## 8. Build pipeline

### 8.1 New: `tools/parse_lessons.py`

- No third-party dependencies. Mirrors `tools/parse_questions.py` in style and ergonomics.
- Walks `data/lessons/**/*.md`, parses each file, validates:
  - Frontmatter has required fields with valid types.
  - `topic` exists in `TOPIC_URL_SLUGS` (the script reads the slug list from `src/data/types.ts` — see note below).
  - Body has exactly three H2 sections in the prescribed order with the prescribed Hebrew titles.
- Cross-checks `data/question_skills.json`:
  - Every `skill_id` value must match a lesson `id` in the parsed set.
  - Every `q_id` key must exist in `data/questions.json`.
- On success, writes `data/lessons.json` shaped as `{ version: 1, lessons: RawLesson[] }`.
- On any failure, prints a per-file report (matching the style of `parse_questions.py`'s report mode) and exits non-zero.

**Note on `TOPIC_URL_SLUGS`:** the Python script needs the valid slug list. `src/data/types.ts` remains the single source of truth. The parser extracts slugs from it with a narrow regex over the `TOPIC_URL_SLUGS: Record<string, string> = { ... }` literal — every value matching `: "<slug>"` becomes an accepted topic slug. The format is stable in the existing code; if it ever changes the parser fails loudly and we update the regex in one place. No companion JSON file needed.

### 8.2 New: `tools/classify_questions.py` (implementation-phase helper)

- One-time script that emits a Claude-ready prompt template per question (`q_id` + question text + options + an enumerated skill list for that topic).
- Used during the implementation phase to draft `data/question_skills.json`.
- Not run during the regular build. Lives in `tools/` for reproducibility.

### 8.3 Changes to existing scripts

- `scripts/sync-data.mjs` — add `lessons.json` and `question_skills.json` to the list of copied files.
- `package.json` — add a `parse-lessons` script as a convenience: `"parse-lessons": "PYTHONIOENCODING=utf-8 python tools/parse_lessons.py"`. The Windows note in `CLAUDE.md` continues to apply.
- `dev`/`build` already chain through `sync-data`; no further change needed there.

## 9. Error handling

| Failure | Surface | Behavior |
|---|---|---|
| Malformed lesson markdown | Build (`parse_lessons.py`) | Loud per-file failure, non-zero exit, no `lessons.json` written. |
| `question_skills.json` references unknown `skill_id` | Build | Loud failure listing every offending q_id. |
| `question_skills.json` references unknown `q_id` | Build | Loud failure listing every offending q_id. |
| `fetch('/data/lessons.json')` fails at runtime | App | `lessons` stays `null`. "איך פותרים?" button never renders. No error toast — feature is a strict enhancement, never a blocker. The kid never knew it existed. |
| Question has no mapping | App | Button hidden. |
| Mapping exists but no lesson found | App | Button hidden. Defensive only — build-time cross-check should make this impossible. |

## 10. Testing

Unit tests added alongside existing `tests/unit/` style:

1. **`lessonsSlice.test.ts`**
   - `loadLessons` populates both maps from mocked fetch responses.
   - `lessonForQuestion(qId)` returns the right lesson for a mapped q_id.
   - `lessonForQuestion(qId)` returns `null` for unmapped q_ids.
   - `lessonForQuestion(qId)` returns `null` when the skill_id has no matching lesson (defensive).
   - `loadLessons` failure path: both maps remain `null`, no throw.

2. **`tools/test_parse_lessons.py`** (new — there are no existing Python tests in the repo, so this introduces a stdlib `unittest` convention. Run via `python -m unittest tools/test_parse_lessons.py`.)
   - Valid lesson parses successfully.
   - Missing required frontmatter field → failure.
   - Missing one of the three required H2 sections → failure.
   - H2 sections out of order → failure.
   - Unknown topic slug in frontmatter → failure.
   - Cross-check: skill_id referenced in `question_skills.json` but no lesson → failure.
   - Cross-check: q_id referenced but not in `questions.json` → failure.

   No new dependencies — stdlib only. Fixtures live inline in the test file as strings written to temp dirs.

3. **`LessonModal.test.tsx`**
   - Renders Hebrew title and three sections.
   - Renders inline + display KaTeX math without throwing.
   - Close button, overlay click, and Escape key all call the close handler.
   - With `prefers-reduced-motion: reduce`, fade variants are used (assert via Variants prop, not visual diff).

No e2e tests in this pass.

## 11. Implementation phasing

The implementation plan will sequence the work roughly as:

1. **Skill enumeration.** Scan the bank, draft the per-topic skill list, get user sign-off on the list before writing any lessons or tags.
2. **Tagging.** Generate `data/question_skills.json` via `classify_questions.py`. User spot-checks ≥5 random tags per topic.
3. **Parser + types + slice.** Build `parse_lessons.py`, add `RawLesson` types, add `lessonsSlice`, wire into `loadBank` orchestration. Tests passing on a tiny inline fixture lesson before any real content exists.
4. **UI surface.** Add the button, the modal, and the exam confirmation. Working end-to-end against the fixture lesson.
5. **Content authoring.** Draft lesson markdown topic-by-topic, user reviews each batch before moving on. Decimal fractions, simple fractions, percentages first (most common skills); logic topics last.
6. **Polish + ship.** Pulse animation, reduced-motion verification, final dev-server smoke test in browser.

## 12. Open questions

None at spec time. Both register ("warm and direct, first-person plural") and button copy ("איך פותרים?") are decided. Final skill-list enumeration happens in step 1 of implementation with user approval before any lessons are written.
