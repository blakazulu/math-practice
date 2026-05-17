"""Fix systematic mid-token `\\n\\n` splits in the source markdown.

The PDF/HTML extractor that produced these files inserted `\\n\\n` at roughly
every 1000 bytes, often slicing through the middle of Hebrew words, LaTeX
expressions, or numeric values. Every other `\\n\\n` in the files is a real
paragraph or section boundary that must be preserved.

Rule: replace `\\n\\n` with empty string ONLY when:
  - The character immediately before is a content character (Hebrew letter,
    Latin letter, digit, or LaTeX glyph).
  - The character immediately after is also a content character.
  - The line containing the split is NOT a section/header marker.

A "section marker" line is one that starts with `#`, `**`, `---`, or a
multiple-choice prefix (`א.`, `ב.`, `ג.`, `ד.`, plus `)` variants).

This preserves all intentional `\\n\\n` (between sections, before headers,
after explanations) and joins only the artifacts.
"""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DB = ROOT / "docs" / "db"

# A "content" character — an alphanumeric token that, when followed/preceded by
# `\n\n`, almost certainly indicates a mid-word/mid-token split from the
# extractor. We deliberately exclude punctuation (.,:;) and LaTeX delimiters
# from the rule because those are common at real sentence/paragraph boundaries.
CONTENT_CHAR = r"[א-תA-Za-z0-9]"

# Section marker prefix at line start.
SECTION_PREFIX = re.compile(r"^\s*(#|\*\*|---|א[\.\)]|ב[\.\)]|ג[\.\)]|ד[\.\)])")


def line_at(text: str, pos: int) -> str:
    """Return the line of `text` containing byte position `pos`."""
    line_start = text.rfind("\n", 0, pos) + 1
    line_end = text.find("\n", pos)
    if line_end == -1:
        line_end = len(text)
    return text[line_start:line_end]


def fix_file(path: Path) -> tuple[int, str]:
    """Returns (n_fixes, new_text)."""
    text = path.read_text(encoding="utf-8")
    out = []
    cursor = 0
    fixes = 0

    pattern = re.compile(rf"({CONTENT_CHAR})\n\n({CONTENT_CHAR})")

    while True:
        m = pattern.search(text, cursor)
        if not m:
            out.append(text[cursor:])
            break

        before_line = line_at(text, m.start(1))
        after_line = line_at(text, m.start(2))

        if SECTION_PREFIX.match(before_line) or SECTION_PREFIX.match(after_line):
            # Preserve as a section boundary.
            out.append(text[cursor:m.end()])
            cursor = m.end()
            continue

        # Mid-content split — join the two chars without whitespace.
        out.append(text[cursor:m.start()])
        out.append(m.group(1) + m.group(2))
        cursor = m.end()
        fixes += 1

    return fixes, "".join(out)


def main() -> int:
    total = 0
    for path in sorted(DB.rglob("*.md")):
        n, new_text = fix_file(path)
        if n > 0:
            path.write_text(new_text, encoding="utf-8")
            print(f"  fixed {n:3d} split(s) in {path.relative_to(ROOT)}")
            total += n
    print(f"\nTotal: {total} mid-token splits joined.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
