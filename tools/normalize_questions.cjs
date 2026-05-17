#!/usr/bin/env node
// Normalize question text in data/questions.json:
//   When a math close (\)) is followed directly by a Hebrew imperative or
//   question word (only whitespace/ZWSP between), insert a paragraph break
//   so the UI renders the preamble and the directive on separate lines.
//
// Visual breathing room between math and surrounding text is handled at the
// CSS layer (.katex { padding-inline: 0.2em }) so we do NOT insert literal
// whitespace around \( \) — that would incorrectly separate Hebrew one-letter
// prepositional clitics (מ ב ל ה ו ש כ) from their referent.
//
// Run: node tools/normalize_questions.cjs        (writes)
//      node tools/normalize_questions.cjs --dry  (preview)

const fs = require("fs");
const path = require("path");

const FILE = path.join(__dirname, "..", "data", "questions.json");
const DRY = process.argv.includes("--dry");

const BS = "\\";
const CLOSE = BS + ")";

// Hebrew imperative / question openers. When one of these is the first word
// after a math \), it's a strong signal a new directive sentence is starting.
const IMPERATIVES = new Set([
  "סדרו",
  "חשבו",
  "חשב",
  "חשבי",
  "מצאו",
  "מצא",
  "פתרו",
  "פתור",
  "בחרו",
  "בחר",
  "רשמו",
  "כתבו",
  "ציינו",
  "השלימו",
  "סמנו",
  "סמן",
  "הקיפו",
  "הציבו",
  "חברו",
  "צרפו",
  "המירו",
  "הסבירו",
  "הוכיחו",
  "פשטו",
  "פשט",
  "צמצמו",
  "הביעו",
  "הציגו",
  "מה",
  "מהו",
  "מהי",
  // NOTE: "מהם"/"מהן" omitted on purpose — in this corpus they mean
  // "of them" (preposition מ + pronoun), not the interrogative "what are they".
  "כמה",
  "מי",
  "איזה",
  "איזו",
  "אילו",
  "היכן",
  "איפה",
  "באיזה",
  "באיזו",
  "כיצד",
  "איך",
  "האם",
]);

// Treat these as whitespace for adjacency checks — includes ZWSP/RLM/LRM/NBSP.
const WS_RE = /[\s ​‎‏ ]/;
const PUNCT_AFTER = /[.,!?;:)\]}]/;

function normalizeSegment(s) {
  if (typeof s !== "string" || s.length === 0) return s;
  let out = "";
  let i = 0;
  while (i < s.length) {
    if (s[i] === BS && s[i + 1] === ")") {
      out += CLOSE;
      i += 2;
      let j = i;
      while (j < s.length && WS_RE.test(s[j])) j++;
      if (j >= s.length) continue;
      if (s.slice(i, j).includes("\n\n")) continue; // already split
      let k = j;
      while (k < s.length && !WS_RE.test(s[k]) && !PUNCT_AFTER.test(s[k])) k++;
      const word = s.slice(j, k);
      if (IMPERATIVES.has(word)) {
        out += "\n\n";
        i = j;
      }
      continue;
    }
    out += s[i];
    i += 1;
  }
  return out.replace(/\n{3,}/g, "\n\n");
}

function main() {
  const raw = fs.readFileSync(FILE, "utf8");
  const data = JSON.parse(raw);

  let touchedQuestions = 0;
  const splitExamples = [];

  function visit(node) {
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }
    if (node && typeof node === "object") {
      if (typeof node.question === "string") {
        const before = node.question;
        const after = normalizeSegment(before);
        if (after !== before) {
          touchedQuestions++;
          splitExamples.push({ id: node.id, before, after });
          node.question = after;
        }
      }
      for (const k of Object.keys(node)) {
        if (k === "question") continue;
        visit(node[k]);
      }
    }
  }
  visit(data);

  console.log("normalize summary");
  console.log("  paragraph splits added:", touchedQuestions);
  for (const ex of splitExamples) {
    console.log("  -", ex.id);
    console.log("    BEFORE:", ex.before.slice(0, 200));
    console.log("    AFTER: ", ex.after.replace(/\n/g, "\\n").slice(0, 220));
  }

  if (DRY) {
    console.log("\n(dry run — no file written)");
    return;
  }
  const out = JSON.stringify(data, null, 2) + "\n";
  fs.writeFileSync(FILE, out, "utf8");
  console.log("\nwrote", FILE);
}

main();
