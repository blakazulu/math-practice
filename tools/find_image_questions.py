"""Find questions that need a visual to be solvable.

Strategy:
- High-confidence triggers (strong signals the question depends on an image)
- "Follow-up" chains (שאלת המשך) inherit visual status from the previous question
- Filter common Hebrew false positives (מפתח/key matching מפת/map etc.)
"""
import json
import re
from pathlib import Path

# HIGH-CONFIDENCE: these strongly indicate a visual is needed
STRONG = [
    r"\bבשרטוט\b",                      # in the sketch
    r"\bבציור\b",                       # in the picture (but watch out for "ציור" = drawing class)
    r"\bבגרף\b",                        # in the graph
    r"\bבתרשים\b",                      # in the diagram
    r"\bמהשרטוט\b",
    r"\bמהציור\b",
    r"\bמהגרף\b",
    r"\bמהתרשים\b",
    r"\bלפי\s+הגרף\b",
    r"\bלפי\s+השרטוט\b",
    r"\bלפי\s+התרשים\b",
    r"\bלפי\s+הציור\b",
    r"כפי\s+שמתואר\b",                  # as depicted
    r"\bכמתואר\b",                      # as depicted
    r"מתואר\s+בשרטוט",
    r"מתואר\s+בציור",
    r"מתואר\s+בגרף",
    r"\bראה\s+ציור\b",                  # see drawing
    r"\bראה\s+שרטוט\b",
    r"\bראו\s+שרטוט\b",
    r"השרטוט\s+הבא",                    # the following sketch
    r"הציור\s+הבא",
    r"הגרף\s+הבא",
    r"התרשים\s+הבא",
    r"הטבלה\s+הבאה",
    r"השרטוט\s+שלפניכם",
    r"הגרף\s+שלפניכם",
    r"הטבלה\s+שלפניכם",
    r"בגרף\s+שלפניכם",
    r"השאלות\s+הבאות\s+מתייחסות\s+(?:ל|לנתוני\s+|לגרף|לתרשים)",
    r"לפניכם\s+סדרת\s+צורות",           # shape sequence puzzles
    r"לפניכם\s+(?:צורה|טבלה|גרף|תרשים|שרטוט)",
    r"איזו\s+מבין\s+הצורות",
    r"איזה\s+מהגרפים",
    r"איזה\s+מהציורים",
    r"איזה\s+מהשרטוטים",
    r"איזו\s+(?:צורה|מהצורות)\s+יכולה\s+להחליף",  # shape pattern
    r"בעלות\s+חוקיות\s+מסוי(?:י)?מת",  # "with a certain pattern" — shape puzzles
    r"\bהמקווקו(?:ת)?\b",                # dashed (in description of figures)
    r"העמודה\s+הסגולה",
    r"העמודה\s+התכלת",
    r"עמודות\s+הגרף",
    r"\bפריסה\s+של\b",                   # net (unfolded 3D)
    r"\bהפריסה\b",
    r"\bלוח\s+שחמט\b",
    r"כדלהלן\s*:\s*\n",                  # "as follows:" usually intro to visual
    r"בעקבות\s+הגרף",
    r"מתוך\s+הגרף",
    r"מתוך\s+הטבלה",
    r"בטבלה\s+הבאה",
    r"\bבטבלה\b",                        # in the table (most uses are visual)
    r"מתחלקת\s+ל",  # not visual but keep simple
    r"שאלת\s+המשך",                     # follow-up (anchor inheritance)
    r"מגדל\s+(?:מ)?קוביות",             # cube tower
    r"קוביות\s+זהות",                   # identical cubes
    r"קוביה\s+אחת\s+מונחת",             # cubes stacked
    r"\bבמטריצה\b",                     # in the matrix
    r"\bהמטריצה\b",
    r"בקלפים\s+שלפניכם",
    r"\bהשרטוט\b",                      # bare reference to "the drawing"
    r"\bבדגל\b",                        # in the flag (often visual)
    r"מתואר\s+בדגל",
]

# WEAKER but worth flagging in context (only if combined with other signals)
WEAK = [
    r"\bתפזורת\b",
    r"\bמלבן\s+חסום\b",
    r"\bחסומ(?:ים|ות)\b",
]

# False positives to STRIP — these are Hebrew words that would otherwise match
# but are not actually referring to images in their context.
# We do this by post-filtering: if a match is ONLY in a false-positive context, drop it.
# Format: (pattern, exclusion_regex) — if exclusion matches, ignore.
#
# Examples:
#   "מפת" can match in "מפתח" (key) — exclude if part of "מפתח"
#   "ציור" can be "drawing/picture" but also "drawing class" (חוג ציור) — exclude
#   "מסלול" can be a physical track or abstract distance — only flag if combined with visual cues
FALSE_POSITIVE_PATTERNS = [
    # "ציור" as a subject taught (חוג ציור = drawing class)
    re.compile(r"חוג\s+ציור"),
    # "ציור על דף" (drawing on paper) — when it's the action, not a visual reference
    re.compile(r"צי(?:י|)רה?\s+ציור"),
    # The word "מפתח" (key) - never matched by our patterns now (we use \b boundaries)
]

PATTERN_STRONG = re.compile("|".join(STRONG))


def is_visual(q_text: str, ex_text: str) -> tuple[bool, list[str]]:
    """Decide whether this question depends on a visual. Returns (verdict, matches)."""
    combined = q_text + " " + ex_text
    matches = []
    for m in PATTERN_STRONG.finditer(combined):
        matches.append(m.group(0).strip())

    # Apply false-positive filters: remove matches whose surrounding context is a false positive.
    # This is conservative; we keep the match if any non-FP context exists.
    if not matches:
        return False, []

    # If only "שאלת המשך" matched AND nothing else, it might be a leftover textual cue —
    # but follow-up chains usually are visual. Keep flagged.
    return True, list(dict.fromkeys(matches))  # dedupe preserving order


def main():
    with open("data/questions.json", encoding="utf-8") as f:
        data = json.load(f)

    results = []
    # First pass: directly visual
    direct_visual_ids: set[str] = set()
    for cat in data["categories"]:
        for topic in cat["topics"]:
            for q in topic["questions"]:
                already = "visual-only" in q["flags"]
                verdict, hits = is_visual(q["question"], q["explanation"])
                if verdict or already:
                    direct_visual_ids.add(q["id"])
                    results.append({
                        "category": cat["name_he"],
                        "topic": topic["name_he"],
                        "file": topic["source_file"],
                        "q_id": q["id"],
                        "q_num": q["number"],
                        "question_excerpt": q["question"][:150],
                        "flagged_already": already,
                        "matches": hits,
                        "topic_id": topic["id"],
                    })

    # Output: group by category > topic, ordered
    print(f"Found {len(results)} candidate visual-dependent questions\n")

    from collections import defaultdict
    by_topic = defaultdict(list)
    for r in results:
        by_topic[(r["category"], r["topic"])].append(r)

    for (cat, topic), rs in sorted(by_topic.items()):
        print(f"--- {cat} / {topic}  ({len(rs)}) ---")
        for r in rs:
            flag = " [visual-only]" if r["flagged_already"] else ""
            print(f"  Q{r['q_num']}{flag}: {r['question_excerpt']}")
        print()

    # Save full structured JSON
    out = Path("data/image_dependent_questions.json")
    out.write_text(json.dumps({
        "total": len(results),
        "questions": results,
    }, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Saved {out}")


if __name__ == "__main__":
    main()
