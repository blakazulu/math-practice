# Lesson Skill List

Drafted: 2026-05-18. Awaits user review before lesson authoring begins (Phase G).

Methodology: every question in `math-knowledge` and `logic-reasoning` was scanned (text, options, correct answer). Within each topic, questions were grouped by the discrete *technique* a kid needs to learn in order to solve them. Sibling techniques are kept separate (e.g. add-fractions-same-denominator vs add-fractions-different-denominator) per the spec, even when one topic does not actually contain both — so the skill list reads as a coherent curriculum, not just a frequency table.

**Decisions applied (2026-05-18, defensive defaults):** Four clean merges have been applied to reduce the original 69 skills to 64 (see `## Notes`). Six previously-flagged classification edge cases have been resolved with defensive defaults; the user can override any of them by editing this file before lesson authoring begins.

## math-knowledge

### decimal-fractions
21 questions. Mix of pure arithmetic, place-value, ordering, word problems, and decimal/fraction conversion.

- `multiply-decimals` — כפל שברים עשרוניים
- `divide-decimals-by-decimals` — חילוק שבר עשרוני בשבר עשרוני
- `add-subtract-decimals` — חיבור וחיסור עשרוניים
- `decimal-place-value` — מיקום הספרה בשבר עשרוני
- `compare-and-order-decimals` — השוואת שברים עשרוניים
- `fraction-to-decimal` — המרת שבר פשוט לשבר עשרוני
- `decimal-order-of-operations` — סדר פעולות עם עשרוניים

### simple-fractions
33 questions. Heavy on "fraction of remainder" word problems, complex fractions, "marble exchange" reverse problems, and a few unsolvable-condition traps.

- `common-denominator-arithmetic` — חיבור וחיסור שברים עם מכנים שונים
- `multiply-fractions` — כפל שברים פשוטים
- `mixed-numbers-arithmetic` — חשבון עם מספרים מעורבים
- `fraction-of-amount` — חישוב חלק מכמות
- `fraction-of-remainder` — חלק מהשארית
- `reverse-fraction-word-problem` — חידת שבר במשחק חליפין
- `recognize-unsolvable-fraction-problem` — זיהוי בעיה שאי-אפשר לפתור

(Note: `reverse-fraction-word-problem` covers the recurring "X had a, Y had b, Y gave some to X and now X has p/q of Y" pattern — q_id 8, 17, 18, 19, 20, 28. Distinct from straight `fraction-of-amount` because the unknown is the transferred quantity.)

### percentages
19 questions. Standard percentage-of, reverse-percent, successive-percent-changes, area-impact-of-percent-change, plus a dilution problem.

- `percent-of-number` — חישוב אחוז ממספר
- `successive-percent-changes` — אחוזים בשני שלבים
- `find-original-from-percent` — מציאת מספר מקורי לפי אחוז
- `percent-increase-decrease` — הגדלה והקטנה באחוזים
- `percent-area-change` — שינוי שטח בעקבות שינוי באחוזים
- `compare-percent-vs-quantity` — אחוזים לעומת כמות מוחלטת
- `mixture-and-dilution-percent` — דילול וריכוז באחוזים

### multi-step
16 questions. Numerical word problems combining several operations: age problems, work-rate, "twice as many", "X% then Y more", and a few unsolvable-by-design.

- `age-problem-same-time-shift` — חידת גילים בעוד שנים
- `multi-step-fraction-distribution` — חלוקה רב-שלבית בשברים
- `combined-rate-word-problem` — בעיית קצב משולבת
- `multiplicative-chain` — שרשרת יחסי כפל
- `percent-and-amount-mix` — שילוב אחוזים וכמות
- `recognize-underdetermined-problem` — זיהוי בעיה חסרת נתונים

### geometry
32 questions. Square/rectangle perimeter+area in both directions, scaling, area-preserving transformations, circle area, cut-corner problems, and shape comparisons.

- `rectangle-family-perimeter-area` — היקף ושטח של ריבוע ומלבן
- `perimeter-from-area-or-vice-versa` — מעבר בין היקף לשטח
- `triangle-area` — שטח משולש
- `circle-area-with-pi` — שטח עיגול עם פאי
- `compound-and-cut-shape-area` — שטח של צורה מורכבת או חתוכה
- `area-perimeter-after-change` — השפעת שינוי על שטח והיקף
- `compare-polygon-areas` — השוואת שטחי מצולעים

### data-research
23 questions. Almost all are *follow-up* chains attached to a chart/table. Skills are about reading charts, comparing categories, computing averages from a chart, computing differences/extremes, and combining percent or ratio with chart data.

- `read-chart-or-table` — קריאת נתונים מתרשים או מטבלה
- `average-from-chart` — ממוצע מתוך תרשים
- `difference-from-chart` — הפרש בין ערכים בגרף
- `percent-on-chart-data` — אחוזים על נתוני גרף
- `combine-two-chart-conditions` — שילוב שני תנאים מהגרף

### ratio
15 questions. Almost all are "ratio a:b, total or difference given, find part" plus 3–4 "which totals are/are not divisible by (a+b)" problems.

- `apply-given-ratio` — חישוב לפי יחס נתון
- `ratio-from-difference` — יחס לפי הפרש בין הכמויות
- `ratio-divisibility-test` — האם הסכום מתחלק בסכום היחס
- `ratio-to-quantity` — מציאת כמות מתוך יחס וסך הכל

### throughput
15 questions. Rate ("X per Y") problems, two-worker combined rate, leaking-tank net-rate, unit conversions.

- `unit-rate-and-proportion` — חישוב לפי קצב יחידה
- `two-workers-combined-rate` — שני עובדים יחד
- `net-rate-fill-and-leak` — קצב נטו עם דליפה
- `convert-rate-units` — המרת יחידות בקצב
- `rate-with-different-units` — שילוב קצבים שונים בבעיה אחת

### average
15 questions. Classic "find missing item from average", "swap one member, what is new average", weighted average of two groups, and a couple of edge cases (range constraints, removing average-value item).

- `use-sum-not-average` — לחשוב במונחי הסכום במקום הממוצע
- `weighted-average-two-groups` — ממוצע משוקלל של שתי קבוצות
- `target-score-for-new-average` — איזה ציון נדרש לשינוי הממוצע
- `average-edge-cases` — מקרי קצה בממוצע

## logic-reasoning

### factoring
24 questions. Two flavors: number-property reasoning (parity, divisibility, "X mod Y", LCM for bell-ringing) and factor-search ("product is 90, three integers"). Per the spec, logic topics get at most 1–2 broad skills.

- `divisibility-and-parity-reasoning` — חוקי התחלקות וזוגיות
- `find-numbers-from-product-clues` — מציאת מספרים לפי מכפלה ורמזים

### invented-operation
23 questions. Two clean clusters: "operation defined by formula, plug in values" and "operation defined by examples, deduce the rule".

- `evaluate-defined-operation` — חישוב פעולה מומצאת לפי הגדרה
- `deduce-operation-from-examples` — גילוי הכלל לפי דוגמאות

### truth-falsehood
16 questions. Knight/knave style: "only N speak truth, who did X?" plus a few "how many liars are possible". One broad skill is enough — strategy varies per puzzle.

- `solve-truth-teller-puzzle` — חידות אמת ושקר

### sequences
17 questions. Mix of arithmetic, geometric, alternating two interleaved sequences, second-difference, and a few code-pattern puzzles.

- `find-next-in-arithmetic-or-geometric` — איבר הבא בסדרה חשבונית או הנדסית
- `find-next-in-interleaved-or-pattern-sequence` — סדרה משולבת או בעלת תבנית מיוחדת

### motion
15 questions. Speed-distance-time word problems: same-direction chase, head-on meeting, average speed (harmonic), upstream/downstream, escalator combined motion, unit conversion. Many distinct patterns — give two skills.

- `speed-distance-time-basics` — חישוב מהירות, מרחק, זמן
- `relative-motion-meet-or-chase` — מפגש או מרדף בין שני גופים

### combinatorics
27 questions. Two clusters: counting (product rule, permutations of digits, round-robin tournaments, "guaranteed pick from drawer") and probability comparisons (which event is more likely, dice sums, drawing from boxes).

- `counting-with-product-rule` — ספירת אפשרויות עם כלל הכפל
- `probability-and-likelihood-comparison` — סיכויים והשוואת הסתברויות

### spatial-reasoning
18 questions. All are constraint-satisfaction puzzles: who lives on which floor, who sits where, what is the secret number given digit clues, ordering by clues. One broad skill is right per spec.

- `solve-positional-constraint-puzzle` — חידות סידור ומיקום לפי רמזים

## Notes

**Skill totals:**

- math-knowledge: 7 + 7 + 7 + 6 + 7 + 5 + 4 + 5 + 4 = 52 skills across 9 topics.
- logic-reasoning: 2 + 2 + 1 + 2 + 2 + 2 + 1 = 12 skills across 7 topics.
- **Grand total: 64 skills.**

Four merges from the original draft have been applied (see git history for the prior shape). Total is 64; further pruning is up to the user.

**Skills not derivable from the bank but worth teaching anyway:** none. The bank is broad enough that every skill listed above has at least three exercising questions, and there is no missing-foundational-skill gap that the kid would hit before any of these.

**Classification decisions (defensive defaults applied; user can override):**

- `01_ידע_מתמטי/שברים_פשוטים/27`, `/30`, `/31` — "can't be determined" word problems. Tagged as `recognize-unsolvable-fraction-problem` (which already exists in simple-fractions). This is the natural home for "אי אפשר לדעת" answers in fraction topics.
- `01_ידע_מתמטי/ממוצע/13` — divisibility-flavored problem in the average topic. Tagged as `average-edge-cases`. Cross-topic tagging would be more accurate but less useful for the kid.
- `01_ידע_מתמטי/הספק/15` — unit-conversion problem with no real rate character. Tagged as `convert-rate-units`. Acceptable since the technique (unit math) is what the lesson teaches.
- `02_חשיבה_והגיון/חשיבה_מרחבית/2`, `/3`, `/4` — digit-clue puzzles. Tagged as `solve-positional-constraint-puzzle`. Strategy is shared with seating puzzles.
- `02_חשיבה_והגיון/קומבינטוריקה/9`, `/15`, `/20` — pigeonhole-style "guaranteed worst case". Rolled into `counting-with-product-rule`. Per the spec, logic topics get at most 1-2 broad skills; this preserves the limit.
