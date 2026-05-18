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

        # data/ first
        os.makedirs(os.path.join(self.tmp, "data"))
        with open(os.path.join(self.tmp, "data", "questions.json"), "w", encoding="utf-8") as f:
            json.dump(FAKE_QUESTIONS, f, ensure_ascii=False)

        # lesson dirs under data/lessons/
        os.makedirs(os.path.join(self.lessons_dir, "decimal-fractions"))

        # fake src/data/types.ts so the parser can read TOPIC_URL_SLUGS
        os.makedirs(os.path.join(self.tmp, "src", "data"))
        with open(os.path.join(self.tmp, "src", "data", "types.ts"), "w", encoding="utf-8") as f:
            f.write(FAKE_TYPES_TS)

        # empty question_skills.json (parser must accept absent mappings)
        with open(os.path.join(self.tmp, "data", "question_skills.json"), "w", encoding="utf-8") as f:
            json.dump({}, f)

    def tearDown(self):
        shutil.rmtree(self.tmp, ignore_errors=True)

    def write_lesson(self, slug, body, topic="decimal-fractions"):
        dir_path = os.path.join(self.lessons_dir, topic)
        os.makedirs(dir_path, exist_ok=True)
        with open(os.path.join(dir_path, slug + ".md"), "w", encoding="utf-8") as f:
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
        self.assertRegex(result.stderr.lower(), r"\bid\b")

    def test_missing_last_section_fails(self):
        bad = VALID_LESSON.replace("## לשים לב\nטעות נפוצה: לשכוח לספור את הספרות בשני המספרים.\n", "")
        self.write_lesson("x", bad)
        result = self.run_parser()
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("לשים לב", result.stderr)

    def test_sections_out_of_order_fails(self):
        bad = "\n".join([
            "---",
            "id: multiply-decimals",
            "title: כפל שברים עשרוניים",
            "topic: decimal-fractions",
            "---",
            "",
            "## דוגמה",          # deliberately first — out of order
            "x",
            "",
            "## איך עושים זאת?",  # deliberately second — out of order
            "x",
            "",
            "## לשים לב",
            "x",
            "",
        ])
        self.write_lesson("x", bad)
        result = self.run_parser()
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("order", result.stderr.lower())

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
