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
    raw = re.findall(r":\s*\"([a-z0-9\-/]+)\"", body)
    # Strip the leading category segment so frontmatter can use the bare slug
    # (e.g. "math-knowledge/decimal-fractions" → "decimal-fractions"). Bare
    # slugs are unique across categories in this project.
    return {s.split("/")[-1] for s in raw}


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
    if titles != REQUIRED_SECTIONS:
        raise ValueError(
            f"{path}: body must contain exactly these H2 sections in order: "
            f"{REQUIRED_SECTIONS}. Got: {titles}"
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
    if not os.path.exists(questions_path):
        fail("warning: data/questions.json not found — skipping q_id cross-check")
    elif os.path.exists(qs_path):
        try:
            with open(qs_path, encoding="utf-8") as f:
                mapping = json.load(f)
            valid_qids = collect_question_ids(questions_path)
        except (json.JSONDecodeError, KeyError, ValueError) as e:
            fail(f"error reading cross-check data: {e}")
            return 1
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
