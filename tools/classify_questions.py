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
    """Find the Hebrew TopicId (e.g. '01_ידע_מתמטי/שברים_עשרוניים') for a given bare slug."""
    with open(os.path.join(REPO_ROOT, "src", "data", "types.ts"), encoding="utf-8") as f:
        text = f.read()
    m = re.search(
        r"TOPIC_URL_SLUGS\s*:\s*Record<string,\s*string>\s*=\s*\{([^}]+)\}",
        text,
        flags=re.DOTALL,
    )
    if not m:
        return None
    for line in m.group(1).splitlines():
        m2 = re.match(r'\s*"([^"]+)"\s*:\s*"([^"]+)"', line)
        if not m2:
            continue
        # The value is "<category>/<bare-slug>"; we match on the bare-slug suffix.
        if m2.group(2).split("/")[-1] == slug:
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
    # `hebrew` is like "01_ידע_מתמטי/שברים_עשרוניים"; the topic id portion is the last segment.
    topic_id = hebrew.split("/")[-1]

    with open(os.path.join(REPO_ROOT, "data", "questions.json"), encoding="utf-8") as f:
        bank = json.load(f)

    found = False
    for cat in bank["categories"]:
        for topic in cat["topics"]:
            if topic["id"] != topic_id:
                continue
            found = True
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
    if not found:
        print(f"topic_id {topic_id!r} not found in questions.json", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
