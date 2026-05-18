# Lesson Explanations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship inline mini-lesson explanations on each practice/exam question — kids tap "איך פותרים?" and get a 3-section Hebrew lesson teaching the underlying skill (long division, multiplying decimals, percentages of a number, etc.).

**Architecture:** Hebrew markdown lessons under `data/lessons/` are parsed at build time into `data/lessons.json` by a new Python tool. A sidecar `data/question_skills.json` maps each `q_id` to a `skill_id`. The runtime loads both via a new in-memory `lessonsSlice` and renders the relevant lesson in a modal triggered from a header button on every question. Tiny custom renderer turns the constrained markdown body (3 fixed H2s, lists, KaTeX) into JSX — no new runtime dependency.

**Tech Stack:** Python 3 (stdlib only, parser + tests), TypeScript + React + Zustand 4 (existing), Framer Motion 12 (existing), Lucide icons (existing), KaTeX via `react-katex` (existing), Vitest 3 (existing).

**Spec:** `docs/superpowers/specs/2026-05-18-lesson-explanations-design.md`

---

## Phase A — Types & parser foundation

This phase builds the strict markdown→JSON pipeline with TDD. The parser is the contract; everything downstream depends on it.

### Task A1: Add lesson types to `src/data/types.ts`

**Files:**
- Modify: `src/data/types.ts` (append a new section near the end, before `TOPIC_URL_SLUGS`)

- [ ] **Step 1: Append the new types**

Add to `src/data/types.ts`, after the `ImageMapping` interface (around line 92, before the per-user state section):

```ts
// ============================================================
// Lesson explanations
// ============================================================

export type SkillId = string;

export interface RawLesson {
  /** skill_id, kebab-case, globally unique (e.g. "multiply-decimals"). */
  id: SkillId;
  /** Hebrew title shown as the modal header. */
  title: string;
  /** Topic slug from TOPIC_URL_SLUGS (e.g. "decimal-fractions"). */
  topic: string;
  /** Markdown body — three H2 sections in order: how-to, example, watch-out. */
  body: string;
  /** Optional Hebrew aliases reserved for future search. */
  aliases?: string[];
}

export interface LessonBank {
  version: 1;
  total_lessons: number;
  lessons: RawLesson[];
}

/** Flat map { q_id: skill_id } — questions without a mapping are omitted. */
export type QuestionSkillMap = Record<QuestionId, SkillId>;
```

- [ ] **Step 2: Add `lessonHintSeen` to `UserStats` and `EMPTY_STATS`**

Find the `UserStats` interface (around line 127). Add the field at the end of the interface:

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
  /** Flipped true the first time the kid sees the "איך פותרים?" pulse animation. */
  lessonHintSeen: boolean;
}
```

Find `EMPTY_STATS` (around line 200). Add the field:

```ts
export const EMPTY_STATS: UserStats = {
  totalAnswered: 0,
  starsEarned: 0,
  currentStreakDays: 0,
  longestStreakDays: 0,
  lastActiveDate: "",
  todayCount: 0,
  dailyAnswered: {},
  lessonHintSeen: false,
};
```

- [ ] **Step 3: Run typecheck**

Run: `npx tsc -b --noEmit`
Expected: PASS (no type errors). If anything fails, it's because existing code expects `UserStats` literally — those call sites need the new field set to `false`. Fix any failures by adding `lessonHintSeen: false` to literal initializers.

- [ ] **Step 4: Commit**

```bash
git add src/data/types.ts
git commit -m "feat(lessons): add RawLesson types and lessonHintSeen flag"
```

---

### Task A2: Write parser tests (`tools/test_parse_lessons.py`)

**Files:**
- Create: `tools/test_parse_lessons.py`

These tests describe the contract `parse_lessons.py` must satisfy. They will fail until A3.

- [ ] **Step 1: Write the test file**

Create `tools/test_parse_lessons.py`:

```python
"""Unit tests for tools/parse_lessons.py.

Run with: python -m unittest tools/test_parse_lessons.py
Requires PYTHONIOENCODING=utf-8 on Windows.
"""

import json
import os
import shutil
import subprocess
import sys
import tempfile
import unittest

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
PARSE_SCRIPT = os.path.join(REPO_ROOT, "tools", "parse_lessons.py")

VALID_LESSON = """---
id: multiply-decimals
title: כפל שברים עשרוניים
topic: decimal-fractions
---

## איך עושים זאת?
1. נכפול את שני המספרים בלי להתחשב בנקודה.
2. נספור כמה ספרות אחרי הנקודה יש בשני המספרים יחד.

## דוגמה
$$0.4 \\times 0.7 = ?$$
- $4 \\times 7 = 28$
- תשובה: $0.28$

## לשים לב
טעות נפוצה: לשכוח לספור את הספרות בשני המספרים.
"""

# Minimal fake questions.json the parser cross-references.
FAKE_QUESTIONS = {
    "version": 1,
    "total_questions": 1,
    "categories": [
        {
            "id": "math-knowledge",
            "name_he": "ידע מתמטי",
            "topic_count": 1,
            "question_count": 1,
            "topics": [
                {
                    "id": "שברים_עשרוניים",
                    "name_he": "שברים עשרוניים",
                    "source_file": "x.md",
                    "question_count": 1,
                    "questions": [
                        {
                            "id": "01_ידע_מתמטי/שברים_עשרוניים/q_1",
                            "number": 1,
                            "question": "x",
                            "options": {"א": "1"},
                            "correct_answer": "1",
                            "correct_letter": "א",
                            "explanation": "",
                            "flags": [],
                        }
                    ],
                }
            ],
        }
    ],
}

# Minimal fake types.ts the parser reads to learn valid topic slugs.
FAKE_TYPES_TS = """\
export const TOPIC_URL_SLUGS: Record<string, string> = {
  "01_ידע_מתמטי/שברים_עשרוניים": "decimal-fractions",
  "01_ידע_מתמטי/שברים_פשוטים": "simple-fractions",
};
"""


class ParseLessonsTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.mkdtemp(prefix="lessons-")
        self.lessons_dir = os.path.join(self.tmp, "data", "lessons")
        os.makedirs(os.path.join(self.lessons_dir, "decimal-fractions"))

        # questions.json
        os.makedirs(os.path.join(self.tmp, "data"))
        with open(os.path.join(self.tmp, "data", "questions.json"), "w", encoding="utf-8") as f:
            json.dump(FAKE_QUESTIONS, f, ensure_ascii=False)

        # fake src/data/types.ts
        os.makedirs(os.path.join(self.tmp, "src", "data"))
        with open(os.path.join(self.tmp, "src", "data", "types.ts"), "w", encoding="utf-8") as f:
            f.write(FAKE_TYPES_TS)

        # empty question_skills.json (parser must accept absent mappings)
        with open(os.path.join(self.tmp, "data", "question_skills.json"), "w", encoding="utf-8") as f:
            json.dump({}, f)

    def tearDown(self):
        shutil.rmtree(self.tmp, ignore_errors=True)

    def write_lesson(self, slug, body):
        path = os.path.join(self.lessons_dir, "decimal-fractions", slug + ".md")
        with open(path, "w", encoding="utf-8") as f:
            f.write(body)

    def write_question_skills(self, mapping):
        with open(os.path.join(self.tmp, "data", "question_skills.json"), "w", encoding="utf-8") as f:
            json.dump(mapping, f, ensure_ascii=False)

    def run_parser(self):
        env = {**os.environ, "PYTHONIOENCODING": "utf-8"}
        return subprocess.run(
            [sys.executable, PARSE_SCRIPT, "--root", self.tmp],
            capture_output=True,
            text=True,
            env=env,
        )

    def test_valid_lesson_parses(self):
        self.write_lesson("multiply-decimals", VALID_LESSON)
        result = self.run_parser()
        self.assertEqual(result.returncode, 0, msg=result.stderr)
        with open(os.path.join(self.tmp, "data", "lessons.json"), encoding="utf-8") as f:
            bank = json.load(f)
        self.assertEqual(bank["total_lessons"], 1)
        self.assertEqual(bank["lessons"][0]["id"], "multiply-decimals")
        self.assertEqual(bank["lessons"][0]["topic"], "decimal-fractions")

    def test_missing_frontmatter_id_fails(self):
        bad = VALID_LESSON.replace("id: multiply-decimals\n", "")
        self.write_lesson("x", bad)
        result = self.run_parser()
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("id", result.stderr.lower())

    def test_missing_section_fails(self):
        bad = VALID_LESSON.replace("## לשים לב\nטעות נפוצה: לשכוח לספור את הספרות בשני המספרים.\n", "")
        self.write_lesson("x", bad)
        result = self.run_parser()
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("לשים לב", result.stderr)

    def test_sections_out_of_order_fails(self):
        bad = VALID_LESSON.replace(
            "## איך עושים זאת?", "## דוגמה_TMP"
        ).replace(
            "## דוגמה\n", "## איך עושים זאת?\n", 1
        ).replace("## דוגמה_TMP", "## דוגמה")
        # ^ swaps first two H2s
        self.write_lesson("x", bad)
        result = self.run_parser()
        self.assertNotEqual(result.returncode, 0)

    def test_unknown_topic_slug_fails(self):
        bad = VALID_LESSON.replace("topic: decimal-fractions", "topic: not-a-real-topic")
        self.write_lesson("x", bad)
        result = self.run_parser()
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("not-a-real-topic", result.stderr)

    def test_skill_map_unknown_skill_fails(self):
        self.write_lesson("multiply-decimals", VALID_LESSON)
        self.write_question_skills(
            {"01_ידע_מתמטי/שברים_עשרוניים/q_1": "no-such-skill"}
        )
        result = self.run_parser()
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("no-such-skill", result.stderr)

    def test_skill_map_unknown_qid_fails(self):
        self.write_lesson("multiply-decimals", VALID_LESSON)
        self.write_question_skills({"ghost_q_id": "multiply-decimals"})
        result = self.run_parser()
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("ghost_q_id", result.stderr)


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `PYTHONIOENCODING=utf-8 python -m unittest tools/test_parse_lessons.py` (PowerShell: `$env:PYTHONIOENCODING="utf-8"; python -m unittest tools/test_parse_lessons.py`)

Expected: all 7 tests fail because `tools/parse_lessons.py` doesn't exist yet. The failure message should mention "No such file or directory" or a non-zero exit code from the subprocess.

- [ ] **Step 3: Commit**

```bash
git add tools/test_parse_lessons.py
git commit -m "test(lessons): add failing tests for parse_lessons.py"
```

---

### Task A3: Implement `tools/parse_lessons.py`

**Files:**
- Create: `tools/parse_lessons.py`

- [ ] **Step 1: Write the parser**

Create `tools/parse_lessons.py`:

```python
"""Parse data/lessons/**/*.md into data/lessons.json.

Strict format: YAML-frontmatter + body with exactly three H2 sections
("## איך עושים זאת?", "## דוגמה", "## לשים לב") in that order.

Cross-checks data/question_skills.json against the parsed lessons and
data/questions.json — every skill_id must map to a lesson, every q_id
must exist in the bank.

Run from the repo root:
    PYTHONIOENCODING=utf-8 python tools/parse_lessons.py
Or with --root <dir> for testing against a synthetic tree.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
from dataclasses import asdict, dataclass, field
from typing import Iterator

REQUIRED_SECTIONS = ["איך עושים זאת?", "דוגמה", "לשים לב"]


@dataclass
class Lesson:
    id: str
    title: str
    topic: str
    body: str
    aliases: list[str] = field(default_factory=list)


def fail(msg: str) -> None:
    print(msg, file=sys.stderr)


def read_topic_slugs(types_ts_path: str) -> set[str]:
    """Pull valid topic slugs from src/data/types.ts via narrow regex.

    Looks for the TOPIC_URL_SLUGS literal and extracts every value matching
    `: "<slug>"`. If the format ever changes, this fails loudly.
    """
    with open(types_ts_path, encoding="utf-8") as f:
        text = f.read()
    m = re.search(
        r"TOPIC_URL_SLUGS\s*:\s*Record<string,\s*string>\s*=\s*\{([^}]+)\}",
        text,
        flags=re.DOTALL,
    )
    if not m:
        raise RuntimeError(f"could not find TOPIC_URL_SLUGS literal in {types_ts_path}")
    body = m.group(1)
    return set(re.findall(r":\s*\"([a-z0-9\-/]+)\"", body))


def parse_frontmatter(text: str, source: str) -> tuple[dict, str]:
    """Split YAML frontmatter from body. Raises on malformed input."""
    if not text.startswith("---\n"):
        raise ValueError(f"{source}: missing opening frontmatter delimiter")
    end = text.find("\n---\n", 4)
    if end == -1:
        raise ValueError(f"{source}: missing closing frontmatter delimiter")
    head = text[4:end]
    body = text[end + 5 :]
    fm: dict = {}
    for line in head.splitlines():
        line = line.rstrip()
        if not line:
            continue
        if ":" not in line:
            raise ValueError(f"{source}: malformed frontmatter line: {line!r}")
        key, _, value = line.partition(":")
        key = key.strip()
        value = value.strip()
        # very small YAML subset: scalars and inline arrays only.
        if value.startswith("[") and value.endswith("]"):
            inner = value[1:-1].strip()
            if not inner:
                fm[key] = []
            else:
                items = [
                    s.strip().strip('"').strip("'") for s in inner.split(",")
                ]
                fm[key] = [s for s in items if s]
        else:
            fm[key] = value.strip('"').strip("'")
    return fm, body


def extract_sections(body: str, source: str) -> list[str]:
    """Return ordered list of H2 titles in the body."""
    titles = []
    for line in body.splitlines():
        if line.startswith("## "):
            titles.append(line[3:].strip())
    return titles


def parse_lesson(path: str) -> Lesson:
    with open(path, encoding="utf-8") as f:
        text = f.read()
    fm, body = parse_frontmatter(text, path)

    for field_name in ("id", "title", "topic"):
        if field_name not in fm or not fm[field_name]:
            raise ValueError(f"{path}: missing required frontmatter field {field_name!r}")

    titles = extract_sections(body, path)
    for needed in REQUIRED_SECTIONS:
        if needed not in titles:
            raise ValueError(f"{path}: missing required section '## {needed}'")
    if [t for t in titles if t in REQUIRED_SECTIONS] != REQUIRED_SECTIONS:
        raise ValueError(
            f"{path}: required sections must appear in order {REQUIRED_SECTIONS}"
        )

    aliases = fm.get("aliases") or []
    if not isinstance(aliases, list):
        raise ValueError(f"{path}: aliases must be a list")

    return Lesson(
        id=fm["id"],
        title=fm["title"],
        topic=fm["topic"],
        body=body.strip() + "\n",
        aliases=aliases,
    )


def walk_lessons(root_lessons: str) -> Iterator[str]:
    for dirpath, _dirnames, filenames in os.walk(root_lessons):
        for name in sorted(filenames):
            if name.endswith(".md"):
                yield os.path.join(dirpath, name)


def collect_question_ids(questions_json_path: str) -> set[str]:
    with open(questions_json_path, encoding="utf-8") as f:
        bank = json.load(f)
    ids: set[str] = set()
    for cat in bank["categories"]:
        for topic in cat["topics"]:
            for q in topic["questions"]:
                ids.add(q["id"])
    return ids


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--root", default=os.getcwd(), help="repo root")
    args = ap.parse_args()
    root = os.path.abspath(args.root)

    lessons_dir = os.path.join(root, "data", "lessons")
    if not os.path.isdir(lessons_dir):
        print(f"no lessons dir at {lessons_dir} — writing empty bank", file=sys.stderr)
        out = {"version": 1, "total_lessons": 0, "lessons": []}
        with open(os.path.join(root, "data", "lessons.json"), "w", encoding="utf-8") as f:
            json.dump(out, f, ensure_ascii=False, indent=2)
        return 0

    try:
        valid_topics = read_topic_slugs(os.path.join(root, "src", "data", "types.ts"))
    except Exception as e:
        fail(f"failed reading topic slugs: {e}")
        return 1

    errors: list[str] = []
    lessons: list[Lesson] = []
    seen_ids: set[str] = set()

    for path in walk_lessons(lessons_dir):
        try:
            lesson = parse_lesson(path)
        except ValueError as e:
            errors.append(str(e))
            continue
        if lesson.topic not in valid_topics:
            errors.append(f"{path}: unknown topic slug {lesson.topic!r}")
            continue
        if lesson.id in seen_ids:
            errors.append(f"{path}: duplicate skill_id {lesson.id!r}")
            continue
        seen_ids.add(lesson.id)
        lessons.append(lesson)

    if errors:
        for e in errors:
            fail(e)
        fail(f"\n{len(errors)} lesson error(s) — aborting")
        return 1

    # Cross-check question_skills.json
    qs_path = os.path.join(root, "data", "question_skills.json")
    questions_path = os.path.join(root, "data", "questions.json")
    if os.path.exists(qs_path) and os.path.exists(questions_path):
        with open(qs_path, encoding="utf-8") as f:
            mapping = json.load(f)
        valid_qids = collect_question_ids(questions_path)
        bad_qids = [q for q in mapping.keys() if q not in valid_qids]
        bad_skills = [
            s for s in mapping.values() if s not in seen_ids
        ]
        if bad_qids:
            fail(
                "question_skills.json references unknown q_ids: "
                + ", ".join(sorted(bad_qids))
            )
        if bad_skills:
            fail(
                "question_skills.json references unknown skill_ids: "
                + ", ".join(sorted(set(bad_skills)))
            )
        if bad_qids or bad_skills:
            return 1

    out = {
        "version": 1,
        "total_lessons": len(lessons),
        "lessons": [asdict(l) for l in lessons],
    }
    with open(os.path.join(root, "data", "lessons.json"), "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)
    print(f"wrote {len(lessons)} lessons to data/lessons.json")
    return 0


if __name__ == "__main__":
    sys.exit(main())
```

- [ ] **Step 2: Run tests to verify they pass**

Run: `PYTHONIOENCODING=utf-8 python -m unittest tools/test_parse_lessons.py -v`
Expected: 7 tests pass.

- [ ] **Step 3: Run parser against the real (empty) tree to confirm it doesn't crash**

Run: `PYTHONIOENCODING=utf-8 python tools/parse_lessons.py`
Expected: prints `no lessons dir at <path> — writing empty bank` (because `data/lessons/` doesn't exist yet) AND creates `data/lessons.json` with `total_lessons: 0`. Exit 0.

- [ ] **Step 4: Add `parse-lessons` to `package.json`**

Edit `package.json` scripts (around line 6):

```json
"parse-lessons": "node -e \"const {execSync}=require('child_process');execSync('python tools/parse_lessons.py',{stdio:'inherit',env:{...process.env,PYTHONIOENCODING:'utf-8'}})\"",
```

Place it between `"sync-data"` and `"gen-share-images"` to keep alphabetical-adjacent grouping with the other parse-style script. Manually verify by running `npm run parse-lessons`.

- [ ] **Step 5: Commit**

```bash
git add tools/parse_lessons.py data/lessons.json package.json
git commit -m "feat(lessons): add parse_lessons.py parser and npm script"
```

---

## Phase B — Sync pipeline + lessons slice

### Task B1: Extend `scripts/sync-data.mjs`

**Files:**
- Modify: `scripts/sync-data.mjs:15`

- [ ] **Step 1: Add the new files to the copy list**

Find line 15 in `scripts/sync-data.mjs`:

```js
const dataFiles = ["questions.json", "image_dependent_questions.json"];
```

Change to:

```js
const dataFiles = [
  "questions.json",
  "image_dependent_questions.json",
  "lessons.json",
  "question_skills.json",
];
```

- [ ] **Step 2: Create stub `data/question_skills.json` so sync doesn't warn**

Write `data/question_skills.json`:

```json
{}
```

- [ ] **Step 3: Verify sync runs clean**

Run: `npm run sync-data`
Expected: prints `lessons.json` and `question_skills.json` among the copied files, no `! missing source:` warnings.

- [ ] **Step 4: Commit**

```bash
git add scripts/sync-data.mjs data/question_skills.json
git commit -m "feat(lessons): pipe lessons.json and question_skills.json through sync-data"
```

---

### Task B2: Write `lessonsSlice` tests

**Files:**
- Create: `tests/unit/lessonsSlice.test.ts`

- [ ] **Step 1: Write the failing test file**

Create `tests/unit/lessonsSlice.test.ts`:

```ts
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { create } from "zustand";
import { createLessonsSlice, type LessonsSlice } from "@/store/lessonsSlice";
import type { LessonBank, QuestionSkillMap, RawLesson } from "@/data/types";

const SAMPLE_LESSON: RawLesson = {
  id: "multiply-decimals",
  title: "כפל שברים עשרוניים",
  topic: "decimal-fractions",
  body: "## איך עושים זאת?\n1. ...\n\n## דוגמה\n...\n\n## לשים לב\n...\n",
};

const BANK: LessonBank = {
  version: 1,
  total_lessons: 1,
  lessons: [SAMPLE_LESSON],
};

const SKILLS: QuestionSkillMap = {
  "01_ידע_מתמטי/שברים_עשרוניים/q_1": "multiply-decimals",
};

function makeStore() {
  return create<LessonsSlice>()((...a) => createLessonsSlice(...a));
}

function mockFetchWith(banks: { lessons?: unknown; skills?: unknown; lessonsOk?: boolean; skillsOk?: boolean }) {
  vi.stubGlobal(
    "fetch",
    vi.fn((input: RequestInfo | URL) => {
      const url = input.toString();
      if (url.includes("lessons.json")) {
        return Promise.resolve({
          ok: banks.lessonsOk ?? true,
          json: () => Promise.resolve(banks.lessons),
        } as Response);
      }
      if (url.includes("question_skills.json")) {
        return Promise.resolve({
          ok: banks.skillsOk ?? true,
          json: () => Promise.resolve(banks.skills),
        } as Response);
      }
      return Promise.reject(new Error("unexpected fetch: " + url));
    }),
  );
}

describe("lessonsSlice", () => {
  beforeEach(() => {
    vi.stubGlobal("document", { baseURI: "http://localhost/" });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("loadLessons populates both maps", async () => {
    mockFetchWith({ lessons: BANK, skills: SKILLS });
    const store = makeStore();
    await store.getState().loadLessons();
    expect(store.getState().lessons).toEqual({ "multiply-decimals": SAMPLE_LESSON });
    expect(store.getState().questionSkills).toEqual(SKILLS);
  });

  it("lessonForQuestion returns the right lesson for a mapped q_id", async () => {
    mockFetchWith({ lessons: BANK, skills: SKILLS });
    const store = makeStore();
    await store.getState().loadLessons();
    expect(store.getState().lessonForQuestion("01_ידע_מתמטי/שברים_עשרוניים/q_1")).toEqual(
      SAMPLE_LESSON,
    );
  });

  it("lessonForQuestion returns null for an unmapped q_id", async () => {
    mockFetchWith({ lessons: BANK, skills: SKILLS });
    const store = makeStore();
    await store.getState().loadLessons();
    expect(store.getState().lessonForQuestion("ghost")).toBeNull();
  });

  it("lessonForQuestion returns null when skill has no matching lesson (defensive)", async () => {
    mockFetchWith({
      lessons: { version: 1, total_lessons: 0, lessons: [] },
      skills: SKILLS,
    });
    const store = makeStore();
    await store.getState().loadLessons();
    expect(store.getState().lessonForQuestion("01_ידע_מתמטי/שברים_עשרוניים/q_1")).toBeNull();
  });

  it("loadLessons failure leaves both maps as null without throwing", async () => {
    mockFetchWith({ lessonsOk: false, skillsOk: false, lessons: null, skills: null });
    const store = makeStore();
    await expect(store.getState().loadLessons()).resolves.toBeUndefined();
    expect(store.getState().lessons).toBeNull();
    expect(store.getState().questionSkills).toBeNull();
  });

  it("loadLessons is idempotent (second call is a no-op)", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(BANK),
    } as Response);
    vi.stubGlobal("fetch", fetchSpy);
    const store = makeStore();
    await store.getState().loadLessons();
    const callsAfterFirst = fetchSpy.mock.calls.length;
    await store.getState().loadLessons();
    expect(fetchSpy.mock.calls.length).toBe(callsAfterFirst);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/unit/lessonsSlice.test.ts`
Expected: all tests fail with `Cannot find module '@/store/lessonsSlice'` or similar.

- [ ] **Step 3: Commit**

```bash
git add tests/unit/lessonsSlice.test.ts
git commit -m "test(lessons): add failing tests for lessonsSlice"
```

---

### Task B3: Implement `src/store/lessonsSlice.ts`

**Files:**
- Create: `src/store/lessonsSlice.ts`
- Modify: `src/store/index.ts`
- Modify: `src/app/App.tsx`

- [ ] **Step 1: Write the slice**

Create `src/store/lessonsSlice.ts`:

```ts
import type { StateCreator } from "zustand";
import type { LessonBank, QuestionId, QuestionSkillMap, RawLesson } from "@/data/types";

export interface LessonsSlice {
  lessons: Record<string, RawLesson> | null;
  questionSkills: QuestionSkillMap | null;
  lessonsLoading: boolean;
  loadLessons: () => Promise<void>;
  lessonForQuestion: (qId: QuestionId) => RawLesson | null;
}

export const createLessonsSlice: StateCreator<LessonsSlice, [], [], LessonsSlice> = (
  set,
  get,
) => ({
  lessons: null,
  questionSkills: null,
  lessonsLoading: false,

  loadLessons: async () => {
    if (get().lessons !== null || get().lessonsLoading) return;
    set({ lessonsLoading: true });
    try {
      const [lessonsRes, skillsRes] = await Promise.all([
        fetch(new URL("data/lessons.json", document.baseURI)),
        fetch(new URL("data/question_skills.json", document.baseURI)),
      ]);
      if (!lessonsRes.ok || !skillsRes.ok) {
        set({ lessonsLoading: false });
        return;
      }
      const bank = (await lessonsRes.json()) as LessonBank;
      const skills = (await skillsRes.json()) as QuestionSkillMap;
      const lessonMap: Record<string, RawLesson> = {};
      for (const l of bank.lessons) lessonMap[l.id] = l;
      set({ lessons: lessonMap, questionSkills: skills, lessonsLoading: false });
    } catch {
      set({ lessonsLoading: false });
    }
  },

  lessonForQuestion: (qId) => {
    const lessons = get().lessons;
    const skills = get().questionSkills;
    if (!lessons || !skills) return null;
    const skillId = skills[qId];
    if (!skillId) return null;
    return lessons[skillId] ?? null;
  },
});
```

- [ ] **Step 2: Wire into the store**

Edit `src/store/index.ts`:

```ts
import { create } from "zustand";
import { createBankSlice, type BankSlice } from "./bankSlice";
import { createUsersSlice, type UsersSlice } from "./usersSlice";
import { createSessionSlice, type SessionSlice } from "./sessionSlice";
import { createLessonsSlice, type LessonsSlice } from "./lessonsSlice";

export type AppStore = BankSlice & UsersSlice & SessionSlice & LessonsSlice;

export const useStore = create<AppStore>()((...a) => ({
  ...createBankSlice(...a),
  ...createUsersSlice(...a),
  ...createSessionSlice(...a),
  ...createLessonsSlice(...a),
}));

export const selectActiveUser = (s: AppStore) =>
  s.activeUserId ? s.users[s.activeUserId] : null;
export const selectReviewQueueSize = (s: AppStore) =>
  selectActiveUser(s)?.progress.reviewQueue.length ?? 0;
```

- [ ] **Step 3: Trigger `loadLessons` at boot**

Edit `src/app/App.tsx`:

```tsx
import { useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import { AppRoutes } from "./routes";
import { useStore } from "@/store";
import { GrainOverlay } from "@/components/GrainOverlay";
import { InstallPromptSheet } from "@/components/InstallPromptSheet";

useStore.getState().hydrate();

export function App() {
  const loadBank = useStore((s) => s.loadBank);
  const loadLessons = useStore((s) => s.loadLessons);

  useEffect(() => {
    loadBank();
    loadLessons();
  }, [loadBank, loadLessons]);

  return (
    <BrowserRouter>
      <GrainOverlay />
      <InstallPromptSheet />
      <AppRoutes />
    </BrowserRouter>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/unit/lessonsSlice.test.ts`
Expected: all 6 tests pass.

- [ ] **Step 5: Run full test suite**

Run: `npm test`
Expected: all tests pass (40 existing + 6 new = 46).

- [ ] **Step 6: Commit**

```bash
git add src/store/lessonsSlice.ts src/store/index.ts src/app/App.tsx
git commit -m "feat(lessons): add lessonsSlice and wire loadLessons at boot"
```

---

## Phase C — Markdown renderer + LessonModal

### Task C1: Build a tiny structured-markdown renderer

The body is constrained: H2 headings, paragraphs, ordered lists (`1.`/`2.`/...), unordered lists (`- `), inline `$math$`, display `$$math$$`. A ~70-line renderer is cleaner than pulling in `react-markdown` + `remark-math` + `rehype-katex` (~50 KB gzipped).

**Files:**
- Create: `src/components/LessonContent.tsx`
- Create: `tests/unit/lessonContent.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `tests/unit/lessonContent.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LessonContent } from "@/components/LessonContent";

describe("LessonContent", () => {
  it("renders three H2 sections as section-label headers", () => {
    const body =
      "## איך עושים זאת?\ntext\n\n## דוגמה\ntext\n\n## לשים לב\ntext\n";
    render(<LessonContent body={body} />);
    expect(screen.getByText("איך עושים זאת?")).toBeInTheDocument();
    expect(screen.getByText("דוגמה")).toBeInTheDocument();
    expect(screen.getByText("לשים לב")).toBeInTheDocument();
  });

  it("renders an ordered list", () => {
    const body =
      "## איך עושים זאת?\n1. first\n2. second\n\n## דוגמה\n.\n\n## לשים לב\n.\n";
    const { container } = render(<LessonContent body={body} />);
    const ol = container.querySelector("ol");
    expect(ol).not.toBeNull();
    expect(ol?.querySelectorAll("li").length).toBe(2);
  });

  it("renders an unordered list", () => {
    const body =
      "## איך עושים זאת?\n.\n\n## דוגמה\n- a\n- b\n\n## לשים לב\n.\n";
    const { container } = render(<LessonContent body={body} />);
    const ul = container.querySelector("ul");
    expect(ul).not.toBeNull();
    expect(ul?.querySelectorAll("li").length).toBe(2);
  });

  it("renders inline math via react-katex InlineMath", () => {
    const body =
      "## איך עושים זאת?\nresult is $4 \\times 7 = 28$ done.\n\n## דוגמה\n.\n\n## לשים לב\n.\n";
    const { container } = render(<LessonContent body={body} />);
    expect(container.querySelector(".katex")).not.toBeNull();
  });

  it("renders display math via react-katex BlockMath", () => {
    const body =
      "## איך עושים זאת?\n$$0.4 \\times 0.7 = 0.28$$\n\n## דוגמה\n.\n\n## לשים לב\n.\n";
    const { container } = render(<LessonContent body={body} />);
    expect(container.querySelector(".katex-display")).not.toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/unit/lessonContent.test.tsx`
Expected: all 5 tests fail with module-not-found.

- [ ] **Step 3: Write the renderer**

Create `src/components/LessonContent.tsx`:

```tsx
import { Fragment, type ReactNode } from "react";
import { InlineMath, BlockMath } from "react-katex";

interface Props {
  body: string;
}

type Block =
  | { kind: "h2"; text: string }
  | { kind: "p"; text: string }
  | { kind: "ol"; items: string[] }
  | { kind: "ul"; items: string[] }
  | { kind: "displayMath"; tex: string };

function parseBlocks(body: string): Block[] {
  const lines = body.split("\n");
  const blocks: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === "") {
      i++;
      continue;
    }
    if (line.startsWith("## ")) {
      blocks.push({ kind: "h2", text: line.slice(3).trim() });
      i++;
      continue;
    }
    if (line.startsWith("$$") && line.endsWith("$$") && line.length > 4) {
      blocks.push({ kind: "displayMath", tex: line.slice(2, -2) });
      i++;
      continue;
    }
    if (/^\d+\.\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s/, ""));
        i++;
      }
      blocks.push({ kind: "ol", items });
      continue;
    }
    if (line.startsWith("- ")) {
      const items: string[] = [];
      while (i < lines.length && lines[i].startsWith("- ")) {
        items.push(lines[i].slice(2));
        i++;
      }
      blocks.push({ kind: "ul", items });
      continue;
    }
    blocks.push({ kind: "p", text: line });
    i++;
  }
  return blocks;
}

function renderInline(text: string): ReactNode {
  // Split on $...$ pairs. Even indices are plain text, odd indices are math.
  const parts = text.split(/\$([^$]+)\$/g);
  return parts.map((part, idx) =>
    idx % 2 === 0 ? <Fragment key={idx}>{part}</Fragment> : <InlineMath key={idx} math={part} />,
  );
}

export function LessonContent({ body }: Props) {
  const blocks = parseBlocks(body);
  return (
    <div className="lesson-content space-y-4">
      {blocks.map((block, i) => {
        switch (block.kind) {
          case "h2":
            return (
              <h3 key={i} className="section-label">
                {block.text}
              </h3>
            );
          case "p":
            return <p key={i}>{renderInline(block.text)}</p>;
          case "ol":
            return (
              <ol key={i} className="list-decimal pr-6 space-y-1">
                {block.items.map((item, j) => (
                  <li key={j}>{renderInline(item)}</li>
                ))}
              </ol>
            );
          case "ul":
            return (
              <ul key={i} className="list-disc pr-6 space-y-1">
                {block.items.map((item, j) => (
                  <li key={j}>{renderInline(item)}</li>
                ))}
              </ul>
            );
          case "displayMath":
            return <BlockMath key={i} math={block.tex} />;
        }
      })}
    </div>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/unit/lessonContent.test.tsx`
Expected: 5 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/LessonContent.tsx tests/unit/lessonContent.test.tsx
git commit -m "feat(lessons): tiny structured markdown renderer with KaTeX"
```

---

### Task C2: Build `LessonModal`

**Files:**
- Create: `src/components/LessonModal.tsx`
- Create: `tests/unit/lessonModal.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `tests/unit/lessonModal.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { LessonModal } from "@/components/LessonModal";
import type { RawLesson } from "@/data/types";

const LESSON: RawLesson = {
  id: "multiply-decimals",
  title: "כפל שברים עשרוניים",
  topic: "decimal-fractions",
  body: "## איך עושים זאת?\n1. one\n\n## דוגמה\ntext\n\n## לשים לב\nwatch out\n",
};

describe("LessonModal", () => {
  it("renders the lesson title when open", () => {
    render(<LessonModal open lesson={LESSON} onClose={() => {}} />);
    expect(screen.getByText("כפל שברים עשרוניים")).toBeInTheDocument();
  });

  it("renders nothing when closed", () => {
    render(<LessonModal open={false} lesson={LESSON} onClose={() => {}} />);
    expect(screen.queryByText("כפל שברים עשרוניים")).toBeNull();
  });

  it("calls onClose when the close button is clicked", () => {
    const onClose = vi.fn();
    render(<LessonModal open lesson={LESSON} onClose={onClose} />);
    fireEvent.click(screen.getByLabelText("סגירה"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when Escape is pressed", () => {
    const onClose = vi.fn();
    render(<LessonModal open lesson={LESSON} onClose={onClose} />);
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when the overlay is clicked", () => {
    const onClose = vi.fn();
    render(<LessonModal open lesson={LESSON} onClose={onClose} />);
    const overlay = document.querySelector("[data-lesson-overlay]");
    expect(overlay).not.toBeNull();
    fireEvent.click(overlay!);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/unit/lessonModal.test.tsx`
Expected: tests fail with module-not-found.

- [ ] **Step 3: Build `LessonModal`**

Create `src/components/LessonModal.tsx`. Mirror the DownloadTestsModal pattern (`src/components/DownloadTestsModal.tsx`) for animation/reduced-motion handling.

```tsx
import { useEffect, useRef } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import type { RawLesson } from "@/data/types";
import { LessonContent } from "./LessonContent";

interface Props {
  open: boolean;
  lesson: RawLesson | null;
  onClose: () => void;
}

export function LessonModal({ open, lesson, onClose }: Props) {
  const reduced = useReducedMotion();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const panelInitial = reduced ? { opacity: 0 } : { y: 32, opacity: 0, scale: 0.96 };
  const panelAnimate = reduced ? { opacity: 1 } : { y: 0, opacity: 1, scale: 1 };
  const panelExit = reduced ? { opacity: 0 } : { y: 24, opacity: 0, scale: 0.98 };
  const panelTransition = reduced
    ? { duration: 0.15 }
    : { type: "spring" as const, stiffness: 340, damping: 28 };

  return (
    <AnimatePresence>
      {open && lesson && (
        <motion.div
          data-lesson-overlay
          className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center px-0 sm:px-4 py-0 sm:py-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-white w-full max-w-2xl rounded-t-2xl sm:rounded-2xl shadow-xl flex flex-col max-h-[85vh] overflow-hidden"
            initial={panelInitial}
            animate={panelAnimate}
            exit={panelExit}
            transition={panelTransition}
            onClick={(e) => e.stopPropagation()}
          >
            <header className="flex items-center justify-between px-5 py-4 border-b border-ink/10">
              <h2 className="text-lg font-bold text-ink">{lesson.title}</h2>
              <button
                ref={closeRef}
                aria-label="סגירה"
                className="p-2 rounded-md hover:bg-ink/5 focus-visible:ring-2 focus-visible:ring-brand-500"
                onClick={onClose}
              >
                <X size={20} />
              </button>
            </header>
            <div className="px-5 py-5 overflow-y-auto">
              <LessonContent body={lesson.body} />
            </div>
            <footer className="px-5 py-3 border-t border-ink/10 flex justify-end">
              <button
                className="px-4 py-2 rounded-md text-brand-700 hover:bg-brand-50 focus-visible:ring-2 focus-visible:ring-brand-500"
                onClick={onClose}
              >
                חזרה לתרגיל
              </button>
            </footer>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run tests/unit/lessonModal.test.tsx`
Expected: 5 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/LessonModal.tsx tests/unit/lessonModal.test.tsx
git commit -m "feat(lessons): LessonModal with reduced-motion + ESC/overlay close"
```

---

## Phase D — ExplainButton + integration

### Task D1: Build `ExplainButton`

**Files:**
- Create: `src/components/ExplainButton.tsx`
- Create: `tests/unit/explainButton.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `tests/unit/explainButton.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ExplainButton } from "@/components/ExplainButton";

describe("ExplainButton", () => {
  it("renders the 'איך פותרים?' label", () => {
    render(<ExplainButton onClick={() => {}} pulse={false} />);
    expect(screen.getByText("איך פותרים?")).toBeInTheDocument();
  });

  it("calls onClick when tapped", () => {
    const onClick = vi.fn();
    render(<ExplainButton onClick={onClick} pulse={false} />);
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("applies a pulse data-attr when pulse=true", () => {
    render(<ExplainButton onClick={() => {}} pulse={true} />);
    expect(screen.getByRole("button").getAttribute("data-pulse")).toBe("true");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/unit/explainButton.test.tsx`
Expected: fail with module-not-found.

- [ ] **Step 3: Build the button**

Create `src/components/ExplainButton.tsx`:

```tsx
import { BookOpen } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

interface Props {
  onClick: () => void;
  pulse: boolean;
}

export function ExplainButton({ onClick, pulse }: Props) {
  const reduced = useReducedMotion();
  const animate =
    pulse && !reduced
      ? {
          scale: [1, 1.06, 1, 1.06, 1, 1.06, 1],
          transition: { duration: 2.4, times: [0, 0.08, 0.16, 0.24, 0.32, 0.4, 0.48] },
        }
      : { scale: 1 };

  return (
    <motion.button
      type="button"
      onClick={onClick}
      data-pulse={pulse ? "true" : "false"}
      className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-brand-700 bg-brand-50 hover:bg-brand-100 focus-visible:ring-2 focus-visible:ring-brand-500"
      animate={animate}
    >
      <BookOpen size={18} />
      <span className="font-medium">איך פותרים?</span>
    </motion.button>
  );
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run tests/unit/explainButton.test.tsx`
Expected: 3 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/ExplainButton.tsx tests/unit/explainButton.test.tsx
git commit -m "feat(lessons): ExplainButton component with pulse animation hook"
```

---

### Task D2: Add `markLessonHintSeen` to `usersSlice` + migration backfill

**Files:**
- Modify: `src/store/usersSlice.ts`
- Modify: `src/store/migrations.ts`
- Modify: `tests/unit/migrations.test.ts` (add one test)

- [ ] **Step 1: Add migration test**

Append to `tests/unit/migrations.test.ts`, before the closing `});`:

```ts
  it("backfills lessonHintSeen=false when migrating legacy users without it", () => {
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
              dailyAnswered: {},
              // lessonHintSeen intentionally absent
            },
          },
        },
      },
    };
    const out = migrate(legacy);
    expect(out.users.u.progress.stats.lessonHintSeen).toBe(false);
  });
```

- [ ] **Step 2: Run the new test to confirm it fails**

Run: `npx vitest run tests/unit/migrations.test.ts -t lessonHintSeen`
Expected: FAIL — current `backfillUser` doesn't add the field.

- [ ] **Step 3: Extend `backfillUser` in `src/store/migrations.ts`**

Replace the `backfillUser` function:

```ts
function backfillUser(u: UserState): UserState {
  const stats = u.progress.stats;
  const needsDaily = !stats.dailyAnswered;
  const needsLessonHint = stats.lessonHintSeen === undefined;
  if (!needsDaily && !needsLessonHint) return u;
  return {
    ...u,
    progress: {
      ...u.progress,
      stats: {
        ...stats,
        ...(needsDaily ? { dailyAnswered: {} } : {}),
        ...(needsLessonHint ? { lessonHintSeen: false } : {}),
      },
    },
  };
}
```

- [ ] **Step 4: Add `markLessonHintSeen` action to `usersSlice`**

Add to the `UsersSlice` interface in `src/store/usersSlice.ts`:

```ts
  /** Set lessonHintSeen=true for the active user (called after the first pulse fires). */
  markLessonHintSeen: (userId: UserId) => void;
```

Add the implementation alongside the other actions in `createUsersSlice`:

```ts
  markLessonHintSeen: (userId) => {
    set((s) => {
      const user = s.users[userId];
      if (!user || user.progress.stats.lessonHintSeen) return s;
      const next: UserState = {
        ...user,
        progress: {
          ...user.progress,
          stats: { ...user.progress.stats, lessonHintSeen: true },
        },
      };
      const users = { ...s.users, [userId]: next };
      persist({ activeUserId: s.activeUserId, users });
      return { users };
    });
  },
```

- [ ] **Step 5: Run tests**

Run: `npm test`
Expected: all tests pass including the new migration test.

- [ ] **Step 6: Commit**

```bash
git add src/store/usersSlice.ts src/store/migrations.ts tests/unit/migrations.test.ts
git commit -m "feat(lessons): markLessonHintSeen action + migration backfill"
```

---

### Task D3: Wire `ExplainButton` + `LessonModal` into `PracticePage`

**Files:**
- Modify: `src/pages/PracticePage.tsx`

- [ ] **Step 1: Wire it in**

In `src/pages/PracticePage.tsx`, add these imports near the top:

```tsx
import { useState } from "react";  // ensure useState is already imported alongside others
import { ExplainButton } from "@/components/ExplainButton";
import { LessonModal } from "@/components/LessonModal";
```

Inside the component, add selectors and local state:

```tsx
  const lessonForQuestion = useStore((s) => s.lessonForQuestion);
  const markLessonHintSeen = useStore((s) => s.markLessonHintSeen);
  const [lessonOpen, setLessonOpen] = useState(false);
```

After `const question = getQuestion(currentId);` (around line 86), add:

```tsx
  const lesson = lessonForQuestion(currentId);
  const showPulse = lesson != null && user.progress.stats.lessonHintSeen === false;
```

Render the button in the header area, just before the `<QuestionCard ... />` line:

```tsx
  {lesson && (
    <div className="flex justify-start mb-3">
      <ExplainButton
        pulse={showPulse}
        onClick={() => {
          setLessonOpen(true);
          if (showPulse) markLessonHintSeen(user.id);
        }}
      />
    </div>
  )}
```

Render the modal at the end of the JSX, just before the closing `</main>`:

```tsx
  <LessonModal open={lessonOpen} lesson={lesson} onClose={() => setLessonOpen(false)} />
```

- [ ] **Step 2: Typecheck and run tests**

Run: `npx tsc -b --noEmit && npm test`
Expected: clean typecheck, all tests still pass.

- [ ] **Step 3: Smoke test in dev**

Run: `npm run dev`
Then in browser:
- Open `/practice/math-knowledge/decimal-fractions`.
- Confirm the `איך פותרים?` button does NOT appear (no lessons exist yet — `lessonForQuestion` returns `null`). The page renders unchanged.

This proves the integration is null-safe before any content exists.

- [ ] **Step 4: Commit**

```bash
git add src/pages/PracticePage.tsx
git commit -m "feat(lessons): wire ExplainButton + LessonModal into PracticePage"
```

---

## Phase E — Exam-mode integration

### Task E1: Confirmation dialog + ExamPage wiring

**Files:**
- Create: `src/components/ExamLessonConfirmDialog.tsx`
- Modify: `src/pages/ExamPage.tsx`

- [ ] **Step 1: Build the confirmation dialog**

Create `src/components/ExamLessonConfirmDialog.tsx`:

```tsx
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

interface Props {
  open: boolean;
  onConfirm: () => void;
  onDismiss: () => void;
}

export function ExamLessonConfirmDialog({ open, onConfirm, onDismiss }: Props) {
  const reduced = useReducedMotion();
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onDismiss}
        >
          <motion.div
            className="bg-white max-w-md w-full rounded-2xl p-6 shadow-xl"
            initial={reduced ? { opacity: 0 } : { y: 12, opacity: 0 }}
            animate={reduced ? { opacity: 1 } : { y: 0, opacity: 1 }}
            exit={reduced ? { opacity: 0 } : { y: 8, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-ink font-medium leading-relaxed">
              לפתוח עזרה? זה לא ייפסל מהציון אבל זה משנה את אופי המבחן.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                autoFocus
                onClick={onDismiss}
                className="px-4 py-2 rounded-md text-ink hover:bg-ink/5 focus-visible:ring-2 focus-visible:ring-brand-500"
              >
                ביטול
              </button>
              <button
                onClick={onConfirm}
                className="px-4 py-2 rounded-md text-white bg-brand-600 hover:bg-brand-700 focus-visible:ring-2 focus-visible:ring-brand-500"
              >
                כן, לפתוח
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

- [ ] **Step 2: Wire into `ExamPage`**

In `src/pages/ExamPage.tsx`, add imports:

```tsx
import { ExplainButton } from "@/components/ExplainButton";
import { LessonModal } from "@/components/LessonModal";
import { ExamLessonConfirmDialog } from "@/components/ExamLessonConfirmDialog";
```

Inside the component, add state and selectors near the other `useState` calls:

```tsx
  const lessonForQuestion = useStore((s) => s.lessonForQuestion);
  const [lessonOpen, setLessonOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
```

Where the current question is identified (locate `const question = ...` / `currentId`), add:

```tsx
  const lesson = currentId ? lessonForQuestion(currentId) : null;
```

In the header/question area (placement matching the practice page), render:

```tsx
  {lesson && (
    <div className="flex justify-start mb-3">
      <ExplainButton pulse={false} onClick={() => setConfirmOpen(true)} />
    </div>
  )}
```

At the end of the JSX, render the dialog and modal:

```tsx
  <ExamLessonConfirmDialog
    open={confirmOpen}
    onConfirm={() => {
      setConfirmOpen(false);
      setLessonOpen(true);
    }}
    onDismiss={() => setConfirmOpen(false)}
  />
  <LessonModal open={lessonOpen} lesson={lesson} onClose={() => setLessonOpen(false)} />
```

- [ ] **Step 3: Typecheck and run tests**

Run: `npx tsc -b --noEmit && npm test`
Expected: pass.

- [ ] **Step 4: Smoke test**

Run: `npm run dev`. Open a sample exam (`/exam/sample-exams/exam-1`). Confirm the page still works; the button stays hidden until lessons exist.

- [ ] **Step 5: Commit**

```bash
git add src/components/ExamLessonConfirmDialog.tsx src/pages/ExamPage.tsx
git commit -m "feat(lessons): exam-mode confirmation gate before opening lesson"
```

---

## Phase F — Skill enumeration

This phase produces an artifact (the per-topic skill list) that the user reviews before any content gets authored.

### Task F1: Build `tools/classify_questions.py` (one-shot helper)

**Files:**
- Create: `tools/classify_questions.py`

This is a writer's tool. It doesn't ship to production. It enumerates each question alongside an LLM prompt scaffold so the implementer (Claude in a later phase) can fill in skill IDs without losing context.

- [ ] **Step 1: Write the script**

Create `tools/classify_questions.py`:

```python
"""Print a Claude-ready prompt template per question for one topic.

Usage:
    PYTHONIOENCODING=utf-8 python tools/classify_questions.py <topic-slug>

Where <topic-slug> is one of the ASCII slugs in src/data/types.ts (e.g.
"decimal-fractions"). Output is a stream of questions, each with its q_id,
text, options, and a blank "skill_id: " line for the human (or LLM) to fill.
"""

from __future__ import annotations

import json
import os
import re
import sys

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))


def hebrew_topic_for_slug(slug: str) -> str | None:
    with open(os.path.join(REPO_ROOT, "src", "data", "types.ts"), encoding="utf-8") as f:
        text = f.read()
    m = re.search(r"TOPIC_URL_SLUGS\s*:\s*Record<string,\s*string>\s*=\s*\{([^}]+)\}", text, flags=re.DOTALL)
    if not m:
        return None
    for line in m.group(1).splitlines():
        m2 = re.match(r'\s*"([^"]+)"\s*:\s*"([^"]+)"', line)
        if m2 and m2.group(2) == slug:
            return m2.group(1)
    return None


def main() -> int:
    if len(sys.argv) != 2:
        print("usage: classify_questions.py <topic-slug>", file=sys.stderr)
        return 1
    slug = sys.argv[1]
    hebrew = hebrew_topic_for_slug(slug)
    if hebrew is None:
        print(f"unknown topic slug: {slug}", file=sys.stderr)
        return 1
    with open(os.path.join(REPO_ROOT, "data", "questions.json"), encoding="utf-8") as f:
        bank = json.load(f)
    for cat in bank["categories"]:
        for topic in cat["topics"]:
            if f"{cat['id']}/{topic['id']}" != hebrew and topic["id"] != hebrew.split("/")[-1]:
                continue
            for q in topic["questions"]:
                print("=" * 60)
                print(f"q_id: {q['id']}")
                print(f"q: {q['question']}")
                opts = q.get("options", {})
                for k in ("א", "ב", "ג", "ד"):
                    if k in opts:
                        print(f"  {k}. {opts[k]}")
                print(f"correct: {q.get('correct_letter')}  ({q.get('correct_answer')})")
                print("skill_id: ")
    return 0


if __name__ == "__main__":
    sys.exit(main())
```

- [ ] **Step 2: Run it for the first topic as a sanity check**

Run: `PYTHONIOENCODING=utf-8 python tools/classify_questions.py decimal-fractions`
Expected: streams each decimal-fractions question with options and a blank `skill_id:` line. No crash.

- [ ] **Step 3: Commit**

```bash
git add tools/classify_questions.py
git commit -m "tools(lessons): one-shot helper to scaffold question→skill tagging"
```

---

### Task F2: Draft per-topic skill list — USER REVIEW GATE

This is research + a writing task, not code. Output is a markdown doc the user must approve before lesson authoring begins.

**Files:**
- Create: `docs/superpowers/specs/2026-05-18-lesson-skill-list.md`

- [ ] **Step 1: Enumerate skills for every topic**

For each topic with a teachable procedure, read the question bank (`data/questions.json` or the markdown sources under `data/db/`) and list the distinct skills that recur across questions. Write to `docs/superpowers/specs/2026-05-18-lesson-skill-list.md` as:

```markdown
# Lesson Skill List

## decimal-fractions
- `multiply-decimals` — כפל שברים עשרוניים
- `divide-decimals-by-decimals` — חילוק שבר עשרוני בשבר עשרוני
- `compare-decimals` — השוואת שברים עשרוניים
- `decimal-to-fraction` — המרת שבר עשרוני לשבר פשוט
- `long-division-with-decimals` — חילוק ארוך עם שברים עשרוניים

## simple-fractions
- ...

## percentages
- ...

(etc.)

## Logic topics (limited coverage)
- `sequences/find-pattern` — חיפוש דפוס בסדרה (single broad lesson)
- ...
```

Rules: every skill that any question hinges on must be on this list. Skill IDs are kebab-case English, deduplicated. Hebrew title is what will appear in the modal header.

- [ ] **Step 2: Commit**

```bash
git add docs/superpowers/specs/2026-05-18-lesson-skill-list.md
git commit -m "docs(lessons): draft per-topic skill list for user review"
```

- [ ] **Step 3: User review gate**

Surface to user: "Skill list drafted at `docs/superpowers/specs/2026-05-18-lesson-skill-list.md`. Please review — add/remove/rename skills — before I tag questions and author lessons." Block until approved. If changes requested, revise and re-commit.

---

## Phase G — Iterative content authoring (per topic)

After F2 is approved, work topic-by-topic. **Start with `decimal-fractions`** because it has the highest question density and exercises every shape (multiply, divide, long division, conversion). Once it works end-to-end with real content, proceed to the next topic.

The pattern for each topic is the same. Repeat per topic.

### Task G-template: Author one topic's lessons + tags

**Files (per topic, e.g. `decimal-fractions`):**
- Create: `data/lessons/<topic-slug>/<skill-slug>.md` (one per skill on the approved list)
- Modify: `data/question_skills.json` (add tags for all questions in this topic)

- [ ] **Step 1: Author each lesson markdown file**

For every skill in this topic on the approved list, create a file at `data/lessons/<topic-slug>/<skill-id>.md` with this exact structure:

```markdown
---
id: <skill-id>
title: <Hebrew title from skill list>
topic: <topic-slug>
---

## איך עושים זאת?
<numbered list, first-person plural ("נכפול"), 2-5 steps>

## דוגמה
<one fully worked example. Use $$display math$$ for the main equation, inline $...$ inside list items showing intermediate work.>

## לשים לב
<one short sentence about a common mistake.>
```

Copy register: warm and direct, first-person plural ("נכפול", "נספור"). Audience is 9-12 year olds. No emoji. Hebrew vocabulary must match the Israeli elementary-school curriculum — research the canonical terminology online (search e.g. "חילוק ארוך כיתה ה" or "כפל שברים עשרוניים הוראה" for source material). Verify Hebrew terms against the existing question explanations in the bank.

- [ ] **Step 2: Tag every question in this topic**

Run: `PYTHONIOENCODING=utf-8 python tools/classify_questions.py <topic-slug> > /tmp/topic.txt`

For each question, decide which skill on the approved list applies and add an entry to `data/question_skills.json`:

```json
{
  "01_ידע_מתמטי/שברים_עשרוניים/q_1": "multiply-decimals",
  "01_ידע_מתמטי/שברים_עשרוניים/q_2": "long-division-with-decimals",
  ...
}
```

If a question genuinely does not match any teachable skill (rare for math topics, common for logic puzzles), omit it. The explain button will hide itself.

- [ ] **Step 3: Build and verify**

Run: `npm run parse-lessons && npm run sync-data && npm test`
Expected: parser writes the new `lessons.json` cleanly, sync copies it, all tests pass. If parser fails on a lesson, fix that lesson before moving on.

- [ ] **Step 4: Smoke test in dev**

Run: `npm run dev`
- Open `/practice/<category>/<topic-slug>`.
- Confirm the `איך פותרים?` button now appears next to questions in this topic.
- Tap it. Modal opens. Verify Hebrew renders, math renders, close button works, ESC works, overlay click works.
- First-time pulse: in a fresh browser profile (or after wiping localStorage), confirm the pulse fires the first time the button is visible and the flag persists after refresh.

- [ ] **Step 5: USER REVIEW GATE (per topic)**

Surface to user: "Lessons + tags drafted for `<topic-slug>`: <N> lessons, <M> tagged questions. Please review the lesson copy in `data/lessons/<topic-slug>/` and spot-check 5 random tags in `data/question_skills.json`."

Block until approved. If revisions are requested, revise and re-run steps 3-5.

- [ ] **Step 6: Commit**

```bash
git add data/lessons/<topic-slug>/ data/question_skills.json data/lessons.json
git commit -m "content(lessons): add <N> lessons + <M> tags for <topic-slug>"
```

- [ ] **Step 7: Loop**

Repeat G-template for the next topic in this order (highest impact first):

1. `decimal-fractions`
2. `simple-fractions`
3. `percentages`
4. `multi-step` (uses skills from the three above; mostly tagged, only 1-2 new lessons for the "set up the equation" type)
5. `ratio`
6. `average`
7. `throughput`
8. `geometry` (rectangle/triangle area + perimeter; ~3 lessons)
9. `data-research` (~2 lessons: read-a-graph, count-with-condition)
10. `factoring` (~1-2 lessons)
11. `invented-operation` (~1 lesson: "apply the definition")
12. Logic topics with ≤2 lessons each: `sequences`, `truth-falsehood`, `motion`, `combinatorics`, `spatial-reasoning`

For each iteration, complete steps 1-6 of G-template before moving on. Do not batch.

---

## Phase H — Polish & ship verification

### Task H1: Reduced-motion verification

**Files:** none (manual verification)

- [ ] **Step 1: Verify reduced-motion**

In Chrome devtools, Rendering panel → "Emulate CSS media feature `prefers-reduced-motion`" → `reduce`. Reload the practice page with a tagged question.

Expected:
- The explain button does NOT pulse.
- Opening the modal fades in (no slide/scale).
- Closing fades out.
- Exam confirmation dialog fades, no Y-translate.

- [ ] **Step 2: Verify pulse hint persistence**

- Open Application → Local Storage in devtools.
- Find the `math-practice:v1` key, expand `users.<id>.progress.stats`.
- Before first practice visit with a tagged question: `lessonHintSeen` should be `false`.
- After first visit (button pulses): `lessonHintSeen` should flip to `true`.
- Refresh page: button no longer pulses.

---

### Task H2: Bundle-size check

**Files:** none

- [ ] **Step 1: Measure**

Run: `npm run build`
Note the `dist/assets/index-*.js` size reported by Vite.

- [ ] **Step 2: Verify**

Compare against the current bundle baseline (~633 KB un-gzipped, ~198 KB gzipped per CLAUDE.md). New runtime code is small (~100 lines across slice + renderer + 3 components). Lessons JSON is ~50 KB raw, ~10 KB gzipped, fetched separately so it doesn't bloat the initial bundle. Acceptable delta: +5 KB gzipped to the main bundle. If higher, investigate — likely a missing tree-shake.

---

### Task H3: Final commit + push

- [ ] **Step 1: Run the full suite once more**

Run: `npm test && npx tsc -b --noEmit && npm run build`
Expected: all green.

- [ ] **Step 2: Push**

Confirm with user before pushing. If approved:

```bash
git push origin main
```

Netlify rebuilds on push (no CI needed). Verify the live site by tapping a lesson on a deployed practice page.

---

## Open questions resolved during planning

- **No new runtime deps.** Custom `LessonContent` renderer keeps the bundle small.
- **Migration backfill mirrors the existing `dailyAnswered` pattern in `migrations.ts`** — no separate version bump needed.
- **Parser reads topic slugs from `src/data/types.ts` via regex.** Single source of truth maintained.
- **Slice has an extra `lessonsLoading: boolean` field** not listed in spec §6.1. Defensive guard against double-fetching; mirrors the existing `bankSlice.bankLoading` pattern.
- **Reduced-motion behavior verified manually (Phase H1) rather than unit-tested.** Spec §10 suggested unit-testing this; the existing codebase has no precedent for reduced-motion unit tests and the assertion would require fragile `matchMedia` mocking. Manual verification covers it.

## Phase summary

| Phase | What | TDD? | User gate? |
|---|---|---|---|
| A | Types + parser | Yes (Python unittest) | No |
| B | Sync + slice | Yes (Vitest) | No |
| C | Renderer + modal | Yes (Vitest) | No |
| D | Button + integration | Yes (Vitest) + smoke | No |
| E | Exam mode | Smoke | No |
| F | Skill enumeration | No | YES (skill list) |
| G | Content authoring (per topic, ~12 iterations) | Smoke + build | YES (per topic) |
| H | Polish + ship | Manual verify | YES (before push) |
