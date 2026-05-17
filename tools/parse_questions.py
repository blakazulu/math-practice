"""Parse all 23 question markdown files into structured JSON.

The source markdown follows a consistent pattern:

    ## שאלה N {emoji}

    **שאלה:**
    {question text, possibly with inline LaTeX}

    **אפשרויות:**
    א. ...
    ב. ...
    ג. ...
    ד. ...

    **התשובה הנכונה: {answer text}**

    **הסבר:**
    {explanation}

    ---

The parser is tolerant of a small set of known content-level quirks (see
KNOWN_CONTENT_ISSUES below) and surfaces them via per-question `flags` rather
than failing.

Run modes:
  python tools/parse_questions.py             # parse + write JSON
  python tools/parse_questions.py --report    # parse + print issue report only
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import asdict, dataclass, field
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DB = ROOT / "docs" / "db"
OUT = ROOT / "data" / "questions.json"

CATEGORIES = [
    ("01_ידע_מתמטי", "ידע מתמטי", "math-knowledge"),
    ("02_חשיבה_והגיון", "חשיבה והגיון", "logic-reasoning"),
    ("03_מבחנים_לדוגמה", "מבחנים לדוגמה", "sample-exams"),
]

OPTION_LETTERS = ["א", "ב", "ג", "ד"]

# Content-level quirks already verified by hand. The parser surfaces these as
# flags on the question rather than as errors in the report.
#
# Each key is (relative_md_path, question_number); value is a list of flags.
KNOWN_CONTENT_ISSUES: dict[tuple[str, int], list[str]] = {
    ("docs/db/02_חשיבה_והגיון/01_פירוק_לגורמים.md", 3): ["three-option"],
    ("docs/db/02_חשיבה_והגיון/01_פירוק_לגורמים.md", 19): ["missing-explanation"],
    ("docs/db/03_מבחנים_לדוגמה/04_מבחן_לדוגמה_4.md", 20): ["visual-only"],
    ("docs/db/03_מבחנים_לדוגמה/05_מבחן_לדוגמה_5.md", 14): ["three-option"],
    ("docs/db/03_מבחנים_לדוגמה/05_מבחן_לדוגמה_5.md", 21): ["visual-only"],
    ("docs/db/03_מבחנים_לדוגמה/06_מבחן_לדוגמה_6.md", 24): ["visual-only"],
}

RE_QUESTION_HEAD = re.compile(r"^##\s+שאלה\s+(\d+)\b", re.MULTILINE)
RE_OPTION = re.compile(r"^\s*([אבגד])[\.\)]\s*(.+?)\s*$")


@dataclass
class Question:
    id: str
    number: int
    question: str
    options: dict[str, str] = field(default_factory=dict)
    correct_answer: str = ""
    correct_letter: str | None = None
    explanation: str = ""
    flags: list[str] = field(default_factory=list)


@dataclass
class Issue:
    file: str
    qid: int
    kind: str
    detail: str


def slugify_topic(filename: str) -> str:
    return re.sub(r"^\d+_", "", Path(filename).stem)


def split_blocks(text: str) -> list[tuple[int, str]]:
    matches = list(RE_QUESTION_HEAD.finditer(text))
    out: list[tuple[int, str]] = []
    for i, m in enumerate(matches):
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        out.append((int(m.group(1)), text[m.end():end]))
    return out


def normalize_text(s: str) -> str:
    """Collapse internal whitespace runs to single spaces, trim, strip stray `---`."""
    s = re.sub(r"^---+$", "", s, flags=re.MULTILINE)
    s = re.sub(r"\s+", " ", s).strip()
    return s


def parse_options(block: str) -> dict[str, str]:
    """Parse {א/ב/ג/ד: text} from an options block. Wrapped lines are joined into the prior option."""
    options: dict[str, str] = {}
    current: str | None = None
    buf: list[str] = []

    def flush():
        nonlocal buf, current
        if current is not None:
            options[current] = normalize_text(" ".join(buf))
        buf = []

    for line in block.splitlines():
        s = line.strip()
        if not s:
            continue
        m = RE_OPTION.match(s)
        if m:
            flush()
            current = m.group(1)
            buf = [m.group(2)]
        else:
            if current is not None:
                buf.append(s)
    flush()
    return options


def parse_block(body: str) -> tuple[Question, list[str]]:
    """Parse a question body. Returns (Question, list_of_raw_issue_codes)."""
    issues: list[str] = []

    # Extract correct answer (single-line marker, value can contain newlines).
    correct_answer = ""
    m_ans = re.search(
        r"\*\*\s*התשובה\s+הנכונה\s*:\s*(.*?)\s*\*\*",
        body,
        re.DOTALL,
    )
    if m_ans:
        raw = m_ans.group(1)
        # Drop any internal newlines without inserting spaces — the README has
        # cases like "8\n\n0 עמודים" that should become "80 עמודים".
        # We already fixed all known cases in source, but keep this defensive:
        # only collapse \n+ to "", everything else to single space.
        raw = re.sub(r"\n+", "", raw)
        correct_answer = re.sub(r"[ \t]+", " ", raw).strip()
        body_for_sections = body[:m_ans.start()] + "|||BREAK|||" + body[m_ans.end():]
    else:
        issues.append("missing-correct-answer")
        body_for_sections = body

    # Find section markers.
    markers = [
        ("question",    r"\*\*\s*שאלה\s*:\s*\*\*"),
        ("options",     r"\*\*\s*אפשרויות\s*:\s*\*\*"),
        ("explanation", r"\*\*\s*הסבר\s*:\s*\*\*"),
    ]
    boundaries: list[tuple[str, int, int]] = []
    for key, pat in markers:
        m = re.search(pat, body_for_sections)
        if m:
            boundaries.append((key, m.start(), m.end()))
        else:
            issues.append(f"missing-{key}-section")

    m_break = re.search(r"\|\|\|BREAK\|\|\|", body_for_sections)
    if m_break:
        boundaries.append(("__break__", m_break.start(), m_break.end()))
    boundaries.append(("__eof__", len(body_for_sections), len(body_for_sections)))
    boundaries.sort(key=lambda b: b[1])

    sections: dict[str, str] = {}
    for i, (key, _start, content_start) in enumerate(boundaries):
        if key in ("__eof__", "__break__"):
            continue
        next_start = boundaries[i + 1][1] if i + 1 < len(boundaries) else len(body_for_sections)
        sections[key] = body_for_sections[content_start:next_start].strip()

    question_text = normalize_text(sections.get("question", ""))
    explanation = normalize_text(sections.get("explanation", ""))
    options = parse_options(sections.get("options", ""))

    if not question_text:
        issues.append("empty-question")
    if not explanation:
        issues.append("empty-explanation")

    for letter in OPTION_LETTERS:
        if letter not in options:
            issues.append(f"missing-option-{letter}")

    q = Question(
        id="",
        number=0,
        question=question_text,
        options=options,
        correct_answer=correct_answer,
        explanation=explanation,
    )
    return q, issues


def find_correct_letter(correct: str, options: dict[str, str]) -> str | None:
    if not correct or not options:
        return None
    norm = normalize_text(correct)
    for letter, val in options.items():
        if normalize_text(val) == norm:
            return letter
    # Numeric match (strip units/symbols).
    n_correct = leading_number(norm)
    if n_correct is not None:
        for letter, val in options.items():
            if leading_number(normalize_text(val)) == n_correct:
                return letter
    for letter, val in options.items():
        n = normalize_text(val)
        if n and (norm in n or n in norm):
            return letter
    return None


def leading_number(s: str) -> float | None:
    m = re.match(r"^\s*(-?\d+(?:\.\d+)?)", s)
    if not m:
        return None
    try:
        return float(m.group(1))
    except ValueError:
        return None


def read_topic_title(path: Path) -> str:
    for line in path.read_text(encoding="utf-8").splitlines():
        s = line.strip()
        if s.startswith("# "):
            return s[2:].strip()
    return path.stem


def parse_topic_file(path: Path) -> tuple[list[Question], list[Issue]]:
    text = path.read_text(encoding="utf-8")
    rel = str(path.relative_to(ROOT)).replace("\\", "/")

    blocks = split_blocks(text)
    questions: list[Question] = []
    issues: list[Issue] = []
    seen: set[int] = set()

    for qid, body in blocks:
        q, raw_issues = parse_block(body)
        q.number = qid
        q.id = f"{path.parent.name}/{slugify_topic(path.name)}/{qid}"

        if qid in seen:
            issues.append(Issue(rel, qid, "duplicate-id", f"qid {qid} appears twice"))
        seen.add(qid)

        # Translate raw issues into either flags or reported issues.
        known = set(KNOWN_CONTENT_ISSUES.get((rel, qid), []))
        q.flags = sorted(known)

        for code in raw_issues:
            # Map structural codes to known content flags.
            if "three-option" in known and code in {"missing-option-ד"}:
                continue
            if "missing-explanation" in known and code in {
                "missing-explanation-section", "empty-explanation"
            }:
                continue
            if "visual-only" in known and code in {
                "missing-explanation-section", "empty-explanation",
                "missing-option-א", "missing-option-ב",
                "missing-option-ג", "missing-option-ד",
                "missing-options-section",
            }:
                continue
            issues.append(Issue(rel, qid, code, code))

        q.correct_letter = find_correct_letter(q.correct_answer, q.options)
        questions.append(q)

    # Sequence check (ignore for visual-only count etc — id sequence is
    # purely structural):
    expected = list(range(1, len(questions) + 1))
    actual = [q.number for q in questions]
    if actual != expected:
        issues.append(Issue(rel, 0, "id-sequence",
                            f"expected 1..{len(questions)}, got {actual}"))

    return questions, issues


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--report", action="store_true",
                    help="Print issue report only; don't write JSON.")
    args = ap.parse_args()

    all_issues: list[Issue] = []
    total = 0
    output: dict = {"version": 1, "categories": []}

    for cat_dir, cat_he, cat_slug in CATEGORIES:
        cat_path = DB / cat_dir
        topics: list[dict] = []
        for topic_file in sorted(cat_path.glob("*.md")):
            qs, issues = parse_topic_file(topic_file)
            all_issues.extend(issues)
            total += len(qs)
            topics.append({
                "id": slugify_topic(topic_file.name),
                "name_he": read_topic_title(topic_file),
                "source_file": str(topic_file.relative_to(ROOT)).replace("\\", "/"),
                "question_count": len(qs),
                "questions": [asdict(q) for q in qs],
            })
        output["categories"].append({
            "id": cat_slug,
            "name_he": cat_he,
            "topic_count": len(topics),
            "question_count": sum(t["question_count"] for t in topics),
            "topics": topics,
        })

    output["total_questions"] = total

    # Report
    if all_issues:
        print(f"!! {len(all_issues)} structural issue(s) remain:")
        for i in all_issues:
            qid = f"Q{i.qid}" if i.qid else "--"
            print(f"  [{i.kind}] {i.file} {qid} :: {i.detail}")
    else:
        print("OK: no structural issues.")

    # Summary of content flags
    flagged: list[tuple[str, str, str]] = []
    unmapped: list[tuple[str, int]] = []
    for cat in output["categories"]:
        for topic in cat["topics"]:
            for q in topic["questions"]:
                if q["flags"]:
                    flagged.append((topic["source_file"], q["number"], ",".join(q["flags"])))
                if not q["correct_letter"] and "visual-only" not in q["flags"]:
                    unmapped.append((topic["source_file"], q["number"]))

    if flagged:
        print(f"\n{len(flagged)} question(s) with content flags:")
        for f in flagged:
            print(f"  {f[0]}  Q{f[1]}  [{f[2]}]")

    if unmapped:
        print(f"\n{len(unmapped)} question(s) where correct_answer didn't cleanly map to an option letter (still parseable):")
        for u in unmapped[:25]:
            print(f"  {u[0]}  Q{u[1]}")
        if len(unmapped) > 25:
            print(f"  ... and {len(unmapped) - 25} more")

    print(f"\nTotal parsed: {total}")

    if not args.report:
        OUT.parent.mkdir(parents=True, exist_ok=True)
        OUT.write_text(json.dumps(output, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"Wrote {OUT}")

    return 0 if not all_issues else 1


if __name__ == "__main__":
    sys.exit(main())
