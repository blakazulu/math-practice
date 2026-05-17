"""Emit a human-readable markdown report of image-dependent questions.

Reads data/image_dependent_questions.json (produced by find_image_questions.py)
and produces docs/image_dependent_questions.md with the full question text for
each candidate, grouped by category > topic.
"""
import json
from pathlib import Path
from collections import defaultdict

with open("data/image_dependent_questions.json", encoding="utf-8") as f:
    flagged = {q["q_id"]: q for q in json.load(f)["questions"]}

with open("data/questions.json", encoding="utf-8") as f:
    data = json.load(f)

# Group by category > topic, preserving order from questions.json
by_topic = defaultdict(list)
order: list = []
for cat in data["categories"]:
    for topic in cat["topics"]:
        for q in topic["questions"]:
            if q["id"] in flagged:
                key = (cat["name_he"], topic["name_he"], cat["id"], topic["id"])
                if key not in order:
                    order.append(key)
                by_topic[key].append(q)

lines: list[str] = []
lines.append("# שאלות תלויות תמונה — רשימה לבדיקה")
lines.append("")
lines.append(f"סה\"כ {sum(len(qs) for qs in by_topic.values())} שאלות.")
lines.append("")
lines.append("רשימה זו מציינת כל שאלה בה השאלה ו/או הסבר התשובה מפנים לתמונה, גרף, טבלה או שרטוט שאינו כלול בטקסט. **בדקי כל שאלה ידנית** — חלק מהאזכורים אינם דורשים תמונה (false positive).")
lines.append("")
lines.append("עבור כל שאלה: סטטוס \"visual-only\" אומר שלא רק התמונה חסרה, אלא גם האפשרויות ולפעמים גם התשובה הנכונה לא ניתנות לייצוג בטקסט (למשל סדרת צורות).")
lines.append("")

for (cat, topic, cat_id, topic_id) in order:
    qs = by_topic[(cat, topic, cat_id, topic_id)]
    lines.append(f"## {cat} / {topic}")
    lines.append("")
    lines.append(f"_({len(qs)} שאלות)_")
    lines.append("")
    for q in qs:
        info = flagged[q["id"]]
        flag = "🚫 visual-only — " if info["flagged_already"] else ""
        lines.append(f"### {flag}שאלה {q['number']}  — `{info['file']}`")
        lines.append("")
        lines.append(f"**שאלה:** {q['question']}")
        lines.append("")
        if q["options"]:
            lines.append("**אפשרויות:**")
            for letter in ["א", "ב", "ג", "ד"]:
                if letter in q["options"]:
                    lines.append(f"- {letter}. {q['options'][letter]}")
            lines.append("")
        if q["correct_answer"]:
            lines.append(f"**תשובה:** {q['correct_answer']}")
            lines.append("")
        if q["explanation"]:
            lines.append(f"<details><summary>הסבר</summary>\n\n{q['explanation']}\n\n</details>")
            lines.append("")
        lines.append(f"<sub>תגיות זיהוי: `{', '.join(info['matches']) if info['matches'] else '—'}`</sub>")
        lines.append("")
        lines.append("---")
        lines.append("")

out = Path("docs/image_dependent_questions.md")
out.write_text("\n".join(lines), encoding="utf-8")
print(f"Wrote {out} ({out.stat().st_size:,} bytes)")
