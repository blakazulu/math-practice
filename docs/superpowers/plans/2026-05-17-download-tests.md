# Download Tests Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Download Tests" feature that lets users download a printable PDF of any topic or sample exam from a modal opened via a new nav-bar button.

**Architecture:** Pre-generate 23 static PDFs (16 topics + 7 sample exams) at build time using Playwright (HTML → PDF). The SPA serves them from `/data/pdfs/<slug>.pdf` and presents them in a modal accessible from `HomePage` and `WelcomePage`. No backend, no on-demand generation, no extra SPA bundle weight.

**Tech Stack:** Node + Playwright for PDF generation. React + TypeScript + Framer Motion + Tailwind for the UI. KaTeX (already a dep) for math rendering. Vitest + Playwright for tests.

**Reference:** Design spec at `docs/superpowers/specs/2026-05-17-download-tests-design.md`.

**Key project facts you must respect:**
- Math in `questions.json` is delimited by `\(...\)`. Display blocks are detected by the presence of `\begin{` inside that delimiter (mirrors `src/lib/katex.tsx`).
- Hebrew RTL throughout. `<html dir="rtl">` is global.
- No emoji in any UI or PDF. SVG icons only (lucide-react).
- 16px minimum font size on screen (project rule). PDFs can use 11–12pt body type — that's a print context, not the SPA.
- Image inheritance: many `q_id`s can map to the same image file. `image_file: null` in `mapping.json` means no image — render only the question text.
- 3 questions flagged `visual-only` have empty/visual options; render letters only, no option text.

---

## File Structure

**New:**
- `src/data/pdfManifest.ts` — single source of truth listing the 23 downloads with their slugs, labels, categories, URLs, and question counts.
- `src/components/DownloadTestsButton.tsx` — icon button used in two places.
- `src/components/DownloadTestsModal.tsx` — modal that lists every download, grouped by category, with availability probe.
- `tools/pdf/generate_pdfs.mjs` — Node entry point that iterates the manifest and prints each PDF.
- `tools/pdf/render.mjs` — pure function: `(topic, mapping, options) => htmlString`. Unit-testable.
- `tools/pdf/print.css` — page rules, RTL, Heebo, KaTeX overrides for print.
- `tools/pdf/fonts/Heebo-*.ttf` — vendored Heebo (Regular, Bold, Black).
- `tools/pdf/katex.min.css` — vendored copy of KaTeX's stylesheet (from `node_modules/katex/dist/`).
- `tools/pdf/out/.gitkeep` — preserves the output directory.
- `tests/unit/pdfManifest.test.ts` — manifest cross-check against `questions.json` and `TOPIC_URL_SLUGS`.
- `tests/unit/pdfRender.test.ts` — tests for `tools/pdf/render.mjs`.
- `tests/component/DownloadTestsModal.test.tsx` — modal rendering + click + HEAD-probe behavior.
- `tests/e2e/download-tests.spec.ts` — smoke E2E.

**Modified:**
- `scripts/sync-data.mjs` — also copies `tools/pdf/out/*.pdf` → `public/data/pdfs/`.
- `package.json` — new `generate-pdfs` script; `build` chains it before `sync-data`.
- `.gitignore` — adds `tools/pdf/out/` (except `.gitkeep`) and `public/data/pdfs/`.
- `src/pages/HomePage.tsx` — adds `<DownloadTestsButton/>` + modal state in header.
- `src/pages/WelcomePage.tsx` — adds `<DownloadTestsButton/>` top-right.

**Notes on `out/.gitkeep`:** The `out/` directory is gitignored except for `.gitkeep` so the directory exists in fresh clones (avoids a "directory not found" on `npm run generate-pdfs`).

---

## Task 1: PDF Manifest Module

**Files:**
- Create: `src/data/pdfManifest.ts`
- Create: `tests/unit/pdfManifest.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/pdfManifest.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { PDF_MANIFEST } from "@/data/pdfManifest";
import { topicIdFromUrl } from "@/data/types";

// Vitest runs tests from the project root, so a relative path is portable
// regardless of CJS/ESM and avoids __dirname concerns.
const bank = JSON.parse(readFileSync("data/questions.json", "utf8"));

describe("pdfManifest", () => {
  it("has 23 entries (16 topics + 7 sample exams)", () => {
    expect(PDF_MANIFEST).toHaveLength(23);
  });

  it("every slug is ASCII-only (safe for download URLs)", () => {
    for (const entry of PDF_MANIFEST) {
      expect(entry.slug).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it("every slug round-trips to a real topic id via TOPIC_URL_SLUGS", () => {
    for (const entry of PDF_MANIFEST) {
      const [cat, ...rest] = entry.slug.split("-");
      // We split slug on the FIRST hyphen group (category prefix can be
      // "math-knowledge", "logic-reasoning", or "sample-exams").
      const knownCats = ["math-knowledge", "logic-reasoning", "sample-exams"];
      const matchedCat = knownCats.find((c) => entry.slug.startsWith(c + "-"));
      expect(matchedCat).toBeDefined();
      const topicSlug = entry.slug.slice((matchedCat as string).length + 1);
      const id = topicIdFromUrl(matchedCat as string, topicSlug);
      expect(id).not.toBeNull();
    }
  });

  it("entry.url matches /data/pdfs/<slug>.pdf", () => {
    for (const entry of PDF_MANIFEST) {
      expect(entry.url).toBe(`/data/pdfs/${entry.slug}.pdf`);
    }
  });

  it("every topic in questions.json has exactly one manifest entry", () => {
    const expected = new Set<string>();
    for (const cat of bank.categories) {
      for (const t of cat.topics) {
        const full = `${cat.id === "math-knowledge" ? "01_ידע_מתמטי" : cat.id === "logic-reasoning" ? "02_חשיבה_והגיון" : "03_מבחנים_לדוגמה"}/${t.id}`;
        expected.add(full);
      }
    }
    const got = new Set(
      PDF_MANIFEST.map((e) => {
        const knownCats = ["math-knowledge", "logic-reasoning", "sample-exams"];
        const matchedCat = knownCats.find((c) => e.slug.startsWith(c + "-")) as string;
        const topicSlug = e.slug.slice(matchedCat.length + 1);
        return topicIdFromUrl(matchedCat, topicSlug)!;
      }),
    );
    expect(got).toEqual(expected);
  });

  it("questionCount matches questions.json for every entry", () => {
    const counts: Record<string, number> = {};
    for (const cat of bank.categories) {
      for (const t of cat.topics) {
        const dir =
          cat.id === "math-knowledge"
            ? "01_ידע_מתמטי"
            : cat.id === "logic-reasoning"
              ? "02_חשיבה_והגיון"
              : "03_מבחנים_לדוגמה";
        counts[`${dir}/${t.id}`] = t.question_count;
      }
    }
    for (const e of PDF_MANIFEST) {
      const knownCats = ["math-knowledge", "logic-reasoning", "sample-exams"];
      const matchedCat = knownCats.find((c) => e.slug.startsWith(c + "-")) as string;
      const topicSlug = e.slug.slice(matchedCat.length + 1);
      const id = topicIdFromUrl(matchedCat, topicSlug)!;
      expect(e.questionCount).toBe(counts[id]);
    }
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/unit/pdfManifest.test.ts`
Expected: FAIL — `Cannot find module '@/data/pdfManifest'`.

- [ ] **Step 3: Create the manifest module**

Create `src/data/pdfManifest.ts`:

```ts
export type PdfCategory = "math-knowledge" | "logic-reasoning" | "sample-exams";

export interface PdfManifestEntry {
  slug: string;
  label_he: string;
  category: PdfCategory;
  url: string;
  questionCount: number;
}

function entry(
  slug: string,
  label_he: string,
  category: PdfCategory,
  questionCount: number,
): PdfManifestEntry {
  return { slug, label_he, category, url: `/data/pdfs/${slug}.pdf`, questionCount };
}

export const PDF_MANIFEST: PdfManifestEntry[] = [
  // math-knowledge (9)
  entry("math-knowledge-decimal-fractions", "שברים עשרוניים", "math-knowledge", 0),
  entry("math-knowledge-simple-fractions", "שברים פשוטים", "math-knowledge", 0),
  entry("math-knowledge-percentages", "אחוזים", "math-knowledge", 0),
  entry("math-knowledge-multi-step", "רב שלבי", "math-knowledge", 0),
  entry("math-knowledge-geometry", "גאומטריה", "math-knowledge", 0),
  entry("math-knowledge-data-research", "חקר נתונים", "math-knowledge", 0),
  entry("math-knowledge-ratio", "יחס", "math-knowledge", 0),
  entry("math-knowledge-throughput", "הספק", "math-knowledge", 0),
  entry("math-knowledge-average", "ממוצע", "math-knowledge", 0),

  // logic-reasoning (7)
  entry("logic-reasoning-factoring", "פירוק לגורמים", "logic-reasoning", 0),
  entry("logic-reasoning-invented-operation", "פעולה מומצאת", "logic-reasoning", 0),
  entry("logic-reasoning-truth-falsehood", "אמת ושקר", "logic-reasoning", 0),
  entry("logic-reasoning-sequences", "סדרות", "logic-reasoning", 0),
  entry("logic-reasoning-motion", "תנועה", "logic-reasoning", 0),
  entry("logic-reasoning-combinatorics", "קומבינטוריקה", "logic-reasoning", 0),
  entry("logic-reasoning-spatial-reasoning", "חשיבה מרחבית", "logic-reasoning", 0),

  // sample-exams (7)
  entry("sample-exams-exam-1", "מבחן לדוגמה 1", "sample-exams", 0),
  entry("sample-exams-exam-2", "מבחן לדוגמה 2", "sample-exams", 0),
  entry("sample-exams-exam-3", "מבחן לדוגמה 3", "sample-exams", 0),
  entry("sample-exams-exam-4", "מבחן לדוגמה 4", "sample-exams", 0),
  entry("sample-exams-exam-5", "מבחן לדוגמה 5", "sample-exams", 0),
  entry("sample-exams-exam-6", "מבחן לדוגמה 6", "sample-exams", 0),
  entry("sample-exams-exam-7", "מבחן לדוגמה 7", "sample-exams", 0),
];
```

- [ ] **Step 4: Run the test — it will still fail on questionCount**

Run: `npx vitest run tests/unit/pdfManifest.test.ts`
Expected: PASS for shape/slug tests, FAIL on `questionCount matches questions.json`.

- [ ] **Step 5: Read the real counts and update the manifest**

Run this one-off to print real counts:

```bash
node -e "const b=require('./data/questions.json');for(const c of b.categories){for(const t of c.topics){console.log(c.id,'/',t.id,'=',t.question_count);}}"
```

Edit `src/data/pdfManifest.ts` — replace each `0` in the `questionCount` argument with the printed value for that topic.

- [ ] **Step 6: Run the test to verify it passes**

Run: `npx vitest run tests/unit/pdfManifest.test.ts`
Expected: PASS, all 6 tests green.

- [ ] **Step 7: Commit**

```bash
git add src/data/pdfManifest.ts tests/unit/pdfManifest.test.ts
git commit -m "feat(download-tests): pdf manifest with manifest test"
```

---

## Task 2: Vendor Fonts & KaTeX CSS

**Files:**
- Create: `tools/pdf/fonts/Heebo-Regular.ttf`
- Create: `tools/pdf/fonts/Heebo-Bold.ttf`
- Create: `tools/pdf/fonts/Heebo-Black.ttf`
- Create: `tools/pdf/katex.min.css`
- Create: `tools/pdf/out/.gitkeep` (empty)

No tests — these are vendored assets.

- [ ] **Step 1: Create the directory structure**

```bash
mkdir -p tools/pdf/fonts tools/pdf/out
touch tools/pdf/out/.gitkeep
```

- [ ] **Step 2: Copy KaTeX CSS from node_modules**

```bash
cp node_modules/katex/dist/katex.min.css tools/pdf/katex.min.css
```

Then copy the KaTeX font files KaTeX's CSS references (the print engine needs them — referenced as relative URLs in the CSS):

```bash
mkdir -p tools/pdf/katex-fonts
cp node_modules/katex/dist/fonts/* tools/pdf/katex-fonts/
```

Edit `tools/pdf/katex.min.css` once: do a search/replace of `url(fonts/` → `url(katex-fonts/` (the KaTeX CSS references its font files as `fonts/<name>.woff2` etc; we renamed to avoid collision with Heebo).

Verify with: `grep "url(katex-fonts" tools/pdf/katex.min.css | head -3` — should show three or more matches.

- [ ] **Step 3: Download Heebo fonts**

Heebo is on Google Fonts. Download three weights (Regular 400, Bold 700, Black 900) from `https://fonts.google.com/specimen/Heebo`. Place the `.ttf` files in `tools/pdf/fonts/` with these exact names:
- `Heebo-Regular.ttf`
- `Heebo-Bold.ttf`
- `Heebo-Black.ttf`

(If you're running headless and can't use a browser, fetch from the Google Webfonts Helper API or directly from the open-source repo at `https://github.com/OdedEzer/heebo`. Confirm the files are valid TTFs with `file tools/pdf/fonts/Heebo-Regular.ttf` — should report `TrueType Font data`.)

- [ ] **Step 4: Sanity-check sizes**

```bash
ls -la tools/pdf/fonts/ tools/pdf/katex-fonts/ tools/pdf/katex.min.css
```

Expected: each Heebo TTF is 80–250 KB; `katex.min.css` is ~25 KB; `katex-fonts/` contains 20+ font files.

- [ ] **Step 5: Commit**

```bash
git add tools/pdf/fonts/ tools/pdf/katex-fonts/ tools/pdf/katex.min.css tools/pdf/out/.gitkeep
git commit -m "chore(download-tests): vendor Heebo fonts and KaTeX CSS for PDF rendering"
```

---

## Task 3: HTML Renderer (`tools/pdf/render.mjs`)

**Files:**
- Create: `tools/pdf/render.mjs`
- Create: `tools/pdf/print.css`
- Create: `tests/unit/pdfRender.test.ts`

This is the heart of the feature. The renderer is a pure function so we test it thoroughly.

- [ ] **Step 1: Create the print stylesheet**

Create `tools/pdf/print.css`:

```css
@font-face {
  font-family: "Heebo";
  src: url("fonts/Heebo-Regular.ttf") format("truetype");
  font-weight: 400;
  font-style: normal;
}
@font-face {
  font-family: "Heebo";
  src: url("fonts/Heebo-Bold.ttf") format("truetype");
  font-weight: 700;
  font-style: normal;
}
@font-face {
  font-family: "Heebo";
  src: url("fonts/Heebo-Black.ttf") format("truetype");
  font-weight: 900;
  font-style: normal;
}

@page {
  size: A4;
  margin: 18mm;
}

html {
  direction: rtl;
}

body {
  font-family: "Heebo", "Arial Hebrew", sans-serif;
  font-size: 11pt;
  line-height: 1.55;
  color: #0F172A;
  margin: 0;
}

.cover {
  page-break-after: always;
  min-height: calc(100vh - 36mm);
  display: flex;
  flex-direction: column;
  justify-content: center;
  text-align: center;
  position: relative;
}
.cover h1 {
  font-size: 36pt;
  font-weight: 900;
  margin: 0 0 8mm;
  color: #0F172A;
}
.cover .meta {
  font-size: 14pt;
  color: #6B7280;
  margin-bottom: 4mm;
}
.cover .accent {
  width: 32mm;
  height: 1.6mm;
  background: #22C55E;
  margin: 0 auto;
  border-radius: 1mm;
}
.cover .footer {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  font-size: 9pt;
  color: #9CA3AF;
}

.question {
  page-break-inside: avoid;
  margin: 0 0 8mm;
  padding: 4mm 5mm;
  border: 0.4mm solid #E5E7EB;
  border-radius: 2mm;
}
.question .num {
  display: inline-block;
  font-size: 10pt;
  font-weight: 700;
  color: #22C55E;
  margin-bottom: 2mm;
}
.question .text {
  font-size: 12pt;
  margin: 0 0 3mm;
  white-space: pre-wrap;
  word-break: break-word;
}
.question .image {
  margin: 3mm 0;
  text-align: center;
}
.question .image img {
  max-width: 80%;
  max-height: 70mm;
}
.options {
  list-style: none;
  padding: 0;
  margin: 0;
}
.options li {
  margin: 1.5mm 0;
  padding-right: 6mm;
  text-indent: -6mm;
}
.options .letter {
  display: inline-block;
  width: 5mm;
  font-weight: 700;
  color: #6B7280;
}

.answer-key {
  page-break-before: always;
}
.answer-key h2 {
  font-size: 22pt;
  font-weight: 900;
  margin: 0 0 6mm;
  color: #0F172A;
  border-bottom: 0.6mm solid #22C55E;
  padding-bottom: 2mm;
}
.answer-key .entry {
  page-break-inside: avoid;
  margin: 0 0 4mm;
}
.answer-key .entry .num {
  font-weight: 700;
  color: #22C55E;
}
.answer-key .entry .correct {
  font-weight: 700;
}
.answer-key .entry .explanation {
  margin-top: 1mm;
  color: #374151;
  white-space: pre-wrap;
}

/* KaTeX should render LTR even inside RTL body */
.katex,
.katex-display {
  direction: ltr;
}
```

- [ ] **Step 2: Write the failing tests for the renderer**

Create `tests/unit/pdfRender.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { renderTopicHtml, splitOnMath } from "../../tools/pdf/render.mjs";

const baseQ = {
  id: "x/1",
  number: 1,
  question: "מה תוצאת 2+2?",
  options: { א: "1", ב: "2", ג: "3", ד: "4" },
  correct_answer: "4",
  correct_letter: "ד",
  explanation: "2+2=4.",
  flags: [],
};

const mapping = { mapping: [] };

describe("splitOnMath", () => {
  it("returns one text part when there is no math", () => {
    expect(splitOnMath("hello world")).toEqual([{ kind: "text", value: "hello world" }]);
  });

  it("splits on \\( ... \\) inline math", () => {
    const out = splitOnMath("before \\(x+1\\) after");
    expect(out).toEqual([
      { kind: "text", value: "before " },
      { kind: "math", value: "x+1" },
      { kind: "text", value: " after" },
    ]);
  });

  it("returns empty array when input is empty", () => {
    expect(splitOnMath("")).toEqual([]);
  });
});

describe("renderTopicHtml", () => {
  it("emits a complete HTML document with RTL and KaTeX CSS link", () => {
    const html = renderTopicHtml({
      title: "שברים עשרוניים",
      questions: [baseQ],
      mapping,
    });
    expect(html).toContain("<!doctype html>");
    expect(html).toContain('dir="rtl"');
    expect(html).toContain("katex.min.css");
    expect(html).toContain("print.css");
  });

  it("renders the cover with title and question count", () => {
    const html = renderTopicHtml({
      title: "שברים עשרוניים",
      questions: [baseQ, baseQ],
      mapping,
    });
    expect(html).toContain('class="cover"');
    expect(html).toContain("שברים עשרוניים");
    expect(html).toContain("2 שאלות");
  });

  it("renders one question block per question with all four options", () => {
    const html = renderTopicHtml({
      title: "T",
      questions: [baseQ],
      mapping,
    });
    expect(html).toMatch(/class="question"/);
    for (const letter of ["א", "ב", "ג", "ד"]) {
      expect(html).toContain(`>${letter}<`);
    }
    expect(html).toContain("מה תוצאת 2+2?");
    expect(html).toContain(">1<");
    expect(html).toContain(">2<");
    expect(html).toContain(">3<");
    expect(html).toContain(">4<");
  });

  it("does NOT include the answer or explanation in the question section", () => {
    const html = renderTopicHtml({
      title: "T",
      questions: [baseQ],
      mapping,
    });
    const beforeAnswerKey = html.split("answer-key")[0];
    expect(beforeAnswerKey).not.toContain("2+2=4.");
  });

  it("renders an answer key section with correct letter and explanation", () => {
    const html = renderTopicHtml({
      title: "T",
      questions: [baseQ],
      mapping,
    });
    expect(html).toContain("מפתח תשובות");
    expect(html).toContain("answer-key");
    const afterAnswerKey = html.split("answer-key")[1];
    expect(afterAnswerKey).toContain("ד"); // correct letter
    expect(afterAnswerKey).toContain("2+2=4.");
  });

  it("renders math via KaTeX (output contains katex span)", () => {
    const q = { ...baseQ, question: "פתרי: \\(x + 1 = 2\\)" };
    const html = renderTopicHtml({ title: "T", questions: [q], mapping });
    expect(html).toContain('class="katex');
  });

  it("falls back to raw text when KaTeX cannot parse", () => {
    const q = { ...baseQ, question: "\\(\\zzzz\\)" };
    expect(() =>
      renderTopicHtml({ title: "T", questions: [q], mapping }),
    ).not.toThrow();
  });

  it("includes an image when mapping resolves one", () => {
    const html = renderTopicHtml({
      title: "T",
      questions: [baseQ],
      mapping: {
        mapping: [
          {
            q_id: "x/1",
            q_num: 1,
            topic: "x",
            file: "x.md",
            question_excerpt: "",
            image_file: "docs/images/example.png",
            source_q_num: null,
            note: "",
          },
        ],
      },
      imagesDir: "/abs/docs/images",
    });
    expect(html).toContain('<img src="file:///abs/docs/images/example.png"');
  });

  it("omits the image when image_file is null", () => {
    const html = renderTopicHtml({
      title: "T",
      questions: [baseQ],
      mapping: {
        mapping: [
          {
            q_id: "x/1",
            q_num: 1,
            topic: "x",
            file: "x.md",
            question_excerpt: "",
            image_file: null,
            source_q_num: null,
            note: "",
          },
        ],
      },
      imagesDir: "/abs/docs/images",
    });
    expect(html).not.toContain("<img");
  });

  it("for visual-only questions, renders only letter labels (no option text)", () => {
    const vq = {
      ...baseQ,
      flags: ["visual-only"],
      options: { א: "", ב: "", ג: "", ד: "" },
    };
    const html = renderTopicHtml({ title: "T", questions: [vq], mapping });
    // letters present in the options block; no option text after them
    expect(html).toMatch(/class="letter">א<\/span>\s*<\/li>/);
  });

  it("escapes HTML special characters in question text", () => {
    const q = { ...baseQ, question: "<script>alert(1)</script>" };
    const html = renderTopicHtml({ title: "T", questions: [q], mapping });
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;");
  });
});
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `npx vitest run tests/unit/pdfRender.test.ts`
Expected: FAIL — `Cannot find module '../../tools/pdf/render.mjs'`.

- [ ] **Step 4: Implement the renderer**

Create `tools/pdf/render.mjs`:

```js
import katex from "katex";

const RTL_HTML_OPEN = '<!doctype html><html lang="he" dir="rtl"><head><meta charset="utf-8">';

/** Pure-text → escaped HTML, preserving newlines via white-space CSS. */
function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Split a string on \( ... \) math delimiters.
 * Matches the SPA's src/lib/katex.tsx behaviour.
 */
export function splitOnMath(text) {
  if (!text) return [];
  const out = [];
  const re = /\\\(([\s\S]*?)\\\)/g;
  let last = 0;
  let m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push({ kind: "text", value: text.slice(last, m.index) });
    out.push({ kind: "math", value: m[1] });
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push({ kind: "text", value: text.slice(last) });
  return out;
}

function renderInline(text) {
  return splitOnMath(text)
    .map((p) => {
      if (p.kind === "text") return esc(p.value);
      const display = /\\begin\{/.test(p.value);
      try {
        return katex.renderToString(p.value, { throwOnError: false, displayMode: display });
      } catch {
        return esc(p.value);
      }
    })
    .join("");
}

function findImage(qId, mapping) {
  if (!mapping || !Array.isArray(mapping.mapping)) return null;
  const hit = mapping.mapping.find((m) => m.q_id === qId);
  if (!hit || !hit.image_file) return null;
  // mapping uses "docs/images/<name>.<ext>" — keep just the basename
  const basename = hit.image_file.split("/").pop();
  return basename || null;
}

function renderQuestion(q, mapping, imagesDir) {
  const letters = ["א", "ב", "ג", "ד"];
  const isVisualOnly = (q.flags || []).includes("visual-only");
  const imageBase = findImage(q.id, mapping);
  const imageHtml =
    imageBase && imagesDir
      ? `<div class="image"><img src="file://${imagesDir}/${esc(imageBase)}" alt=""/></div>`
      : "";
  const optionsHtml = letters
    .map((L) => {
      const txt = q.options?.[L];
      const inner = isVisualOnly || !txt ? "" : renderInline(txt);
      return `<li><span class="letter">${L}</span> ${inner}</li>`;
    })
    .join("");
  return `
<section class="question">
  <span class="num">שאלה ${q.number}</span>
  <div class="text">${renderInline(q.question)}</div>
  ${imageHtml}
  <ul class="options">${optionsHtml}</ul>
</section>`;
}

function renderAnswerEntry(q) {
  const letter = q.correct_letter ?? "—";
  const correctText = q.correct_answer ? ` · ${esc(q.correct_answer)}` : "";
  return `
<div class="entry">
  <div><span class="num">שאלה ${q.number}</span> · <span class="correct">${esc(letter)}</span>${correctText}</div>
  ${q.explanation ? `<div class="explanation">${renderInline(q.explanation)}</div>` : ""}
</div>`;
}

/**
 * Render a full HTML document for one topic / sample exam.
 *
 * @param {object} opts
 * @param {string} opts.title              Title shown on the cover.
 * @param {Array}  opts.questions          Raw question objects (RawQuestion shape).
 * @param {object} opts.mapping            Parsed mapping.json contents.
 * @param {string} [opts.imagesDir]        Absolute filesystem path to docs/images/
 *                                         (omit in unit tests).
 * @param {string} [opts.cssHref="print.css"]
 * @param {string} [opts.katexHref="katex.min.css"]
 */
export function renderTopicHtml({
  title,
  questions,
  mapping,
  imagesDir,
  cssHref = "print.css",
  katexHref = "katex.min.css",
}) {
  const head = `${RTL_HTML_OPEN}
  <title>${esc(title)}</title>
  <link rel="stylesheet" href="${esc(katexHref)}">
  <link rel="stylesheet" href="${esc(cssHref)}">
</head><body>`;

  const cover = `
<section class="cover">
  <h1>${esc(title)}</h1>
  <div class="meta">${questions.length} שאלות</div>
  <div class="accent"></div>
  <div class="footer">Math Practice · הורדת תרגול</div>
</section>`;

  const qBlocks = questions.map((q) => renderQuestion(q, mapping, imagesDir)).join("");

  const answerKey = `
<section class="answer-key">
  <h2>מפתח תשובות</h2>
  ${questions.map((q) => renderAnswerEntry(q)).join("")}
</section>`;

  return `${head}${cover}${qBlocks}${answerKey}</body></html>`;
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx vitest run tests/unit/pdfRender.test.ts`
Expected: PASS, all tests green.

- [ ] **Step 6: Commit**

```bash
git add tools/pdf/render.mjs tools/pdf/print.css tests/unit/pdfRender.test.ts
git commit -m "feat(download-tests): HTML renderer for PDF generation"
```

---

## Task 4: PDF Generator Script (`tools/pdf/generate_pdfs.mjs`)

**Files:**
- Create: `tools/pdf/generate_pdfs.mjs`

This script ties the manifest, the renderer, and Playwright together. It's an integration script — we exercise it with a real run rather than unit-testing it.

- [ ] **Step 1: Write the generator script**

Create `tools/pdf/generate_pdfs.mjs`:

```js
#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright";
import { renderTopicHtml } from "./render.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..", "..");
const OUT_DIR = join(__dirname, "out");
const IMAGES_DIR = join(REPO_ROOT, "docs", "images");

const HEBREW_DIRS = {
  "math-knowledge": "01_ידע_מתמטי",
  "logic-reasoning": "02_חשיבה_והגיון",
  "sample-exams": "03_מבחנים_לדוגמה",
};

const KNOWN_CATS = Object.keys(HEBREW_DIRS);

function loadJson(p) {
  return JSON.parse(readFileSync(p, "utf8"));
}

function topicIdFromSlug(slug) {
  const cat = KNOWN_CATS.find((c) => slug.startsWith(c + "-"));
  if (!cat) throw new Error(`Slug missing known category prefix: ${slug}`);
  const topicSlug = slug.slice(cat.length + 1);
  return { cat, topicSlug, hebrewDir: HEBREW_DIRS[cat] };
}

// We need the TS manifest's data at build time. Hand-mirror the same list here.
// A test in tests/unit/pdfManifest.test.ts keeps the TS module honest;
// a test in this task (Step 3) keeps THIS list honest against the TS module.
const MANIFEST = loadJson(join(REPO_ROOT, "tools", "pdf", "manifest.json"));

async function main() {
  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

  const bank = loadJson(join(REPO_ROOT, "data", "questions.json"));
  const mapping = loadJson(join(REPO_ROOT, "docs", "images", "mapping.json"));

  // Index topics by composite id "<hebrewDir>/<topicSlugHebrew>"
  const topicIndex = new Map();
  for (const cat of bank.categories) {
    for (const t of cat.topics) {
      const dir = HEBREW_DIRS[cat.id];
      if (!dir) continue;
      topicIndex.set(`${dir}/${t.id}`, t);
    }
  }

  // Reverse map: URL topicSlug → Hebrew topic id (mirrors TOPIC_URL_SLUGS).
  // Hand-coded to avoid importing TS at build time.
  const SLUG_TO_HEBREW_TOPIC = {
    "math-knowledge/decimal-fractions": "שברים_עשרוניים",
    "math-knowledge/simple-fractions": "שברים_פשוטים",
    "math-knowledge/percentages": "אחוזים",
    "math-knowledge/multi-step": "רב_שלבי",
    "math-knowledge/geometry": "גאומטריה",
    "math-knowledge/data-research": "חקר_נתונים",
    "math-knowledge/ratio": "יחס",
    "math-knowledge/throughput": "הספק",
    "math-knowledge/average": "ממוצע",
    "logic-reasoning/factoring": "פירוק_לגורמים",
    "logic-reasoning/invented-operation": "פעולה_מומצאת",
    "logic-reasoning/truth-falsehood": "אמת_ושקר",
    "logic-reasoning/sequences": "סדרות",
    "logic-reasoning/motion": "תנועה",
    "logic-reasoning/combinatorics": "קומבינטוריקה",
    "logic-reasoning/spatial-reasoning": "חשיבה_מרחבית",
    "sample-exams/exam-1": "מבחן_לדוגמה_1",
    "sample-exams/exam-2": "מבחן_לדוגמה_2",
    "sample-exams/exam-3": "מבחן_לדוגמה_3",
    "sample-exams/exam-4": "מבחן_לדוגמה_4",
    "sample-exams/exam-5": "מבחן_לדוגמה_5",
    "sample-exams/exam-6": "מבחן_לדוגמה_6",
    "sample-exams/exam-7": "מבחן_לדוגמה_7",
  };

  const browser = await chromium.launch();
  const ctx = await browser.newContext();
  let okCount = 0;

  try {
    for (const entry of MANIFEST) {
      const { cat } = topicIdFromSlug(entry.slug);
      const urlForm = entry.slug.replace(cat + "-", cat + "/");
      const hebrewTopic = SLUG_TO_HEBREW_TOPIC[urlForm];
      if (!hebrewTopic) throw new Error(`No Hebrew topic mapping for ${urlForm}`);
      const topicId = `${HEBREW_DIRS[cat]}/${hebrewTopic}`;
      const topic = topicIndex.get(topicId);
      if (!topic) throw new Error(`Topic not found in questions.json: ${topicId}`);

      const html = renderTopicHtml({
        title: entry.label_he,
        questions: topic.questions,
        mapping,
        imagesDir: IMAGES_DIR,
      });

      const htmlPath = join(OUT_DIR, `${entry.slug}.html`);
      const pdfPath = join(OUT_DIR, `${entry.slug}.pdf`);
      writeFileSync(htmlPath, html, "utf8");

      const page = await ctx.newPage();
      // Use file:// URL so relative refs to fonts/, katex.min.css, katex-fonts/ resolve.
      await page.goto(pathToFileURL(htmlPath).href, { waitUntil: "networkidle" });
      await page.pdf({
        path: pdfPath,
        format: "A4",
        printBackground: true,
        displayHeaderFooter: false,
        margin: { top: "18mm", right: "18mm", bottom: "18mm", left: "18mm" },
      });
      await page.close();

      okCount++;
      console.log(`  ${entry.slug}.pdf (${topic.questions.length} questions)`);
    }
  } finally {
    await ctx.close();
    await browser.close();
  }

  console.log(`generated ${okCount} / ${MANIFEST.length} PDFs -> ${OUT_DIR}`);
  if (okCount !== MANIFEST.length) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 2: Create the JSON mirror manifest the script reads**

Create `tools/pdf/manifest.json`:

```json
[
  { "slug": "math-knowledge-decimal-fractions", "label_he": "שברים עשרוניים" },
  { "slug": "math-knowledge-simple-fractions", "label_he": "שברים פשוטים" },
  { "slug": "math-knowledge-percentages", "label_he": "אחוזים" },
  { "slug": "math-knowledge-multi-step", "label_he": "רב שלבי" },
  { "slug": "math-knowledge-geometry", "label_he": "גאומטריה" },
  { "slug": "math-knowledge-data-research", "label_he": "חקר נתונים" },
  { "slug": "math-knowledge-ratio", "label_he": "יחס" },
  { "slug": "math-knowledge-throughput", "label_he": "הספק" },
  { "slug": "math-knowledge-average", "label_he": "ממוצע" },
  { "slug": "logic-reasoning-factoring", "label_he": "פירוק לגורמים" },
  { "slug": "logic-reasoning-invented-operation", "label_he": "פעולה מומצאת" },
  { "slug": "logic-reasoning-truth-falsehood", "label_he": "אמת ושקר" },
  { "slug": "logic-reasoning-sequences", "label_he": "סדרות" },
  { "slug": "logic-reasoning-motion", "label_he": "תנועה" },
  { "slug": "logic-reasoning-combinatorics", "label_he": "קומבינטוריקה" },
  { "slug": "logic-reasoning-spatial-reasoning", "label_he": "חשיבה מרחבית" },
  { "slug": "sample-exams-exam-1", "label_he": "מבחן לדוגמה 1" },
  { "slug": "sample-exams-exam-2", "label_he": "מבחן לדוגמה 2" },
  { "slug": "sample-exams-exam-3", "label_he": "מבחן לדוגמה 3" },
  { "slug": "sample-exams-exam-4", "label_he": "מבחן לדוגמה 4" },
  { "slug": "sample-exams-exam-5", "label_he": "מבחן לדוגמה 5" },
  { "slug": "sample-exams-exam-6", "label_he": "מבחן לדוגמה 6" },
  { "slug": "sample-exams-exam-7", "label_he": "מבחן לדוגמה 7" }
]
```

- [ ] **Step 3: Add a unit test that the JSON manifest matches the TS one**

Add to `tests/unit/pdfManifest.test.ts` (append a new test, reusing the imports already at the top of the file):

```ts
const jsonManifest: { slug: string; label_he: string }[] = JSON.parse(
  readFileSync("tools/pdf/manifest.json", "utf8"),
);

describe("pdfManifest TS / JSON sync", () => {
  it("tools/pdf/manifest.json has the same slugs+labels as src/data/pdfManifest.ts", () => {
    expect(jsonManifest).toHaveLength(PDF_MANIFEST.length);
    for (let i = 0; i < PDF_MANIFEST.length; i++) {
      expect(jsonManifest[i].slug).toBe(PDF_MANIFEST[i].slug);
      expect(jsonManifest[i].label_he).toBe(PDF_MANIFEST[i].label_he);
    }
  });
});
```

- [ ] **Step 4: Add Playwright as an explicit dep if not already runtime-available**

Run: `npm ls playwright 2>&1 | head -3`

If it's missing (we only have `@playwright/test`), install the underlying library:

```bash
npm install --save-dev playwright
```

Then ensure Chromium is installed locally:

```bash
npx playwright install chromium
```

- [ ] **Step 5: Run the script for the first time**

```bash
npm run sync-data        # ensures docs/images/mapping.json etc. are fresh in public/
node tools/pdf/generate_pdfs.mjs
```

Expected: console prints 23 lines, each like `math-knowledge-decimal-fractions.pdf (NN questions)`, then a summary line. Exit code 0. `ls tools/pdf/out/*.pdf | wc -l` should equal 23.

- [ ] **Step 6: Open one PDF and eyeball it**

Open `tools/pdf/out/math-knowledge-decimal-fractions.pdf` in your viewer.

Verify:
- Cover page has the topic title in Hebrew and a question count.
- Questions render with all four options labeled א/ב/ג/ד.
- Hebrew text is right-aligned; math expressions (if the topic has any) render as crisp typeset formulas.
- Inline images appear for image-dependent questions.
- Last pages contain "מפתח תשובות" with correct letter + explanation per question.

Also open `tools/pdf/out/math-knowledge-geometry.pdf` (this topic has the most images) and check that images load — Chromium-via-`file://` is finicky if paths are wrong.

If anything looks broken: tweak `tools/pdf/render.mjs` or `tools/pdf/print.css`, re-run `node tools/pdf/generate_pdfs.mjs`, repeat. Keep changes small.

- [ ] **Step 7: Run the manifest test to confirm sync**

Run: `npx vitest run tests/unit/pdfManifest.test.ts`
Expected: PASS including the new "TS / JSON sync" test.

- [ ] **Step 8: Commit**

```bash
git add tools/pdf/generate_pdfs.mjs tools/pdf/manifest.json tests/unit/pdfManifest.test.ts package.json package-lock.json
git commit -m "feat(download-tests): playwright-based PDF generator script"
```

---

## Task 5: Wire Up Build Pipeline

**Files:**
- Modify: `scripts/sync-data.mjs`
- Modify: `package.json`
- Modify: `.gitignore`

- [ ] **Step 1: Extend `scripts/sync-data.mjs` to copy generated PDFs**

Edit `scripts/sync-data.mjs`. Right before the final `console.log(...)` line (currently line 49), insert this block:

```js
// Copy any pre-generated PDFs from tools/pdf/out/ into public/data/pdfs/
const PDF_SRC = join(REPO_ROOT, "tools", "pdf", "out");
const PUBLIC_PDFS = join(PUBLIC_DATA, "pdfs");
let pdfCount = 0;
if (existsSync(PDF_SRC)) {
  mkdirSync(PUBLIC_PDFS, { recursive: true });
  for (const entry of readdirSync(PDF_SRC)) {
    const full = join(PDF_SRC, entry);
    if (!statSync(full).isFile()) continue;
    if (!entry.endsWith(".pdf")) continue;
    copyFileSync(full, join(PUBLIC_PDFS, entry));
    pdfCount++;
  }
}
if (pdfCount > 0) console.log(`  ${pdfCount} pdfs -> public/data/pdfs/`);
```

And update the final summary line to include the new count:

```js
console.log(`synced ${copied} data file(s) + ${imgCount} images + ${pdfCount} pdfs -> public/data/`);
```

- [ ] **Step 2: Add `generate-pdfs` and rewire `build` in `package.json`**

Edit `package.json` `"scripts"` section. Replace the current `build` line:

```jsonc
"build": "npm run sync-data && tsc -b && vite build",
```

with:

```jsonc
"build": "npm run generate-pdfs && npm run sync-data && tsc -b && vite build",
"generate-pdfs": "node tools/pdf/generate_pdfs.mjs",
```

Leave `dev` as-is — dev intentionally skips PDF generation.

- [ ] **Step 3: Update `.gitignore`**

Edit `.gitignore`. Add these lines anywhere appropriate (e.g. after `dist/`):

```
# Generated PDFs (rebuilt on every `npm run build`)
tools/pdf/out/*.pdf
tools/pdf/out/*.html
public/data/pdfs/
```

Keep `tools/pdf/out/.gitkeep` tracked (gitignore patterns above explicitly target `.pdf` and `.html`, not the `.gitkeep`).

- [ ] **Step 4: Run a full sync and confirm files land in public/data/pdfs/**

```bash
node tools/pdf/generate_pdfs.mjs    # only needed if you haven't run it yet this session
npm run sync-data
ls public/data/pdfs/*.pdf | wc -l
```

Expected: `23`.

- [ ] **Step 5: Smoke-test the dev server**

```bash
npm run dev &
sleep 4
curl -sI http://localhost:5173/data/pdfs/math-knowledge-decimal-fractions.pdf | head -1
kill %1 2>/dev/null || true
```

Expected: `HTTP/1.1 200 OK`.

- [ ] **Step 6: Commit**

```bash
git add scripts/sync-data.mjs package.json .gitignore
git commit -m "build(download-tests): wire generate-pdfs into sync-data and build"
```

---

## Task 6: `DownloadTestsButton` Component

**Files:**
- Create: `src/components/DownloadTestsButton.tsx`

This is a small icon-button component that follows the existing nav-icon pattern from `HomePage.tsx`. Trivial enough that we test it indirectly through the modal test in Task 8.

- [ ] **Step 1: Create the button**

Create `src/components/DownloadTestsButton.tsx`:

```tsx
import { FileDown } from "lucide-react";

interface Props {
  onClick: () => void;
  /** Optional className to position the button differently per page. */
  className?: string;
}

export function DownloadTestsButton({ onClick, className }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="הורדת מבחנים"
      className={
        className ??
        "p-3 rounded-full hover:bg-hair focus-visible:ring-2 focus-visible:ring-brand-500"
      }
    >
      <FileDown size={20} />
    </button>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/DownloadTestsButton.tsx
git commit -m "feat(download-tests): DownloadTestsButton icon component"
```

---

## Task 7: `DownloadTestsModal` Component

**Files:**
- Create: `src/components/DownloadTestsModal.tsx`
- Create: `tests/component/DownloadTestsModal.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `tests/component/DownloadTestsModal.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { DownloadTestsModal } from "@/components/DownloadTestsModal";
import { PDF_MANIFEST } from "@/data/pdfManifest";

function setFetchOk() {
  globalThis.fetch = vi.fn(async () => new Response(null, { status: 200 })) as any;
}

function setFetchAllMissing() {
  globalThis.fetch = vi.fn(async () => new Response(null, { status: 404 })) as any;
}

describe("DownloadTestsModal", () => {
  beforeEach(() => {
    setFetchOk();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders nothing when closed", () => {
    const { container } = render(<DownloadTestsModal open={false} onClose={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders three category sections when open", () => {
    render(<DownloadTestsModal open onClose={() => {}} />);
    expect(screen.getByText("ידע מתמטי")).toBeInTheDocument();
    expect(screen.getByText("חשיבה והגיון")).toBeInTheDocument();
    expect(screen.getByText("מבחנים לדוגמה")).toBeInTheDocument();
  });

  it("renders one row per manifest entry", () => {
    render(<DownloadTestsModal open onClose={() => {}} />);
    for (const e of PDF_MANIFEST) {
      expect(screen.getByText(e.label_he)).toBeInTheDocument();
    }
  });

  it("each row has an anchor with the correct href + download attribute when available", async () => {
    render(<DownloadTestsModal open onClose={() => {}} />);
    await waitFor(() => {
      const first = PDF_MANIFEST[0];
      const anchor = screen.getByRole("link", { name: new RegExp(first.label_he) });
      expect(anchor).toHaveAttribute("href", first.url);
      expect(anchor).toHaveAttribute("download");
    });
  });

  it("shows 'לא זמין כרגע' for rows whose HEAD probe returns 404", async () => {
    setFetchAllMissing();
    render(<DownloadTestsModal open onClose={() => {}} />);
    await waitFor(() => {
      expect(screen.getAllByText("לא זמין כרגע").length).toBeGreaterThan(0);
    });
  });

  it("calls onClose when the close button is clicked", () => {
    const onClose = vi.fn();
    render(<DownloadTestsModal open onClose={onClose} />);
    fireEvent.click(screen.getByLabelText("סגירה"));
    expect(onClose).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/component/DownloadTestsModal.test.tsx`
Expected: FAIL — `Cannot find module '@/components/DownloadTestsModal'`.

- [ ] **Step 3: Implement the modal**

Create `src/components/DownloadTestsModal.tsx`:

```tsx
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Download, X, FileDown } from "lucide-react";
import { PDF_MANIFEST, type PdfCategory, type PdfManifestEntry } from "@/data/pdfManifest";

interface Props {
  open: boolean;
  onClose: () => void;
}

const CATEGORY_ORDER: PdfCategory[] = ["math-knowledge", "logic-reasoning", "sample-exams"];
const CATEGORY_LABEL: Record<PdfCategory, string> = {
  "math-knowledge": "ידע מתמטי",
  "logic-reasoning": "חשיבה והגיון",
  "sample-exams": "מבחנים לדוגמה",
};

// Module-level cache so reopening the modal doesn't re-probe.
const probeCache: Record<string, boolean> = {};

export function DownloadTestsModal({ open, onClose }: Props) {
  const grouped = useMemo(() => {
    const out: Record<PdfCategory, PdfManifestEntry[]> = {
      "math-knowledge": [],
      "logic-reasoning": [],
      "sample-exams": [],
    };
    for (const e of PDF_MANIFEST) out[e.category].push(e);
    return out;
  }, []);

  const [availability, setAvailability] = useState<Record<string, boolean>>(probeCache);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const toProbe = PDF_MANIFEST.filter((e) => probeCache[e.url] === undefined);
    if (toProbe.length === 0) return;
    Promise.all(
      toProbe.map(async (e) => {
        try {
          const res = await fetch(e.url, { method: "HEAD" });
          probeCache[e.url] = res.ok;
        } catch {
          probeCache[e.url] = false;
        }
      }),
    ).then(() => {
      if (!cancelled) setAvailability({ ...probeCache });
    });
    return () => {
      cancelled = true;
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="הורדת מבחנים"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 bg-ink/40 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 32, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 24, opacity: 0, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 340, damping: 28 }}
            className="card w-full max-w-2xl max-h-[88vh] sm:max-h-[80vh] rounded-t-3xl sm:rounded-3xl shadow-xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="flex items-start justify-between gap-3 p-5 sm:p-6 border-b border-hair">
              <div className="flex items-start gap-3 min-w-0">
                <span className="w-11 h-11 rounded-xl grid place-items-center bg-brand-100 text-brand-600 shrink-0">
                  <FileDown size={22} />
                </span>
                <div className="min-w-0">
                  <h2 className="text-xl font-bold text-ink">הורדת מבחנים</h2>
                  <p className="text-muted text-base">
                    בחרו נושא או מבחן לדוגמה להורדה כקובץ PDF.
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                aria-label="סגירה"
                className="shrink-0 rounded-full p-2 hover:bg-hair focus-visible:ring-2 focus-visible:ring-brand-500"
              >
                <X size={20} />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-5">
              {CATEGORY_ORDER.map((cat) => (
                <section key={cat}>
                  <div className="section-label mb-2">{CATEGORY_LABEL[cat]}</div>
                  <ul className="space-y-2">
                    {grouped[cat].map((entry) => {
                      const available = availability[entry.url] ?? true;
                      return (
                        <li key={entry.slug}>
                          {available ? (
                            <a
                              href={entry.url}
                              download
                              aria-label={`הורדת ${entry.label_he}`}
                              className="card flex items-center gap-3 p-4 hover:border-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500"
                            >
                              <span className="flex-1 min-w-0">
                                <span className="block font-bold text-lg text-ink leading-snug">
                                  {entry.label_he}
                                </span>
                                <span className="block text-base text-muted mt-0.5 tabular-nums">
                                  {entry.questionCount} שאלות
                                </span>
                              </span>
                              <span className="shrink-0 inline-flex items-center gap-1.5 text-brand-700 font-semibold">
                                <Download size={18} />
                                הורדה
                              </span>
                            </a>
                          ) : (
                            <div
                              className="card flex items-center gap-3 p-4 opacity-60"
                              aria-disabled="true"
                            >
                              <span className="flex-1 min-w-0">
                                <span className="block font-bold text-lg text-ink leading-snug">
                                  {entry.label_he}
                                </span>
                                <span className="block text-base text-muted mt-0.5">
                                  לא זמין כרגע
                                </span>
                              </span>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/component/DownloadTestsModal.test.tsx`
Expected: PASS, all six tests green.

- [ ] **Step 5: Commit**

```bash
git add src/components/DownloadTestsModal.tsx tests/component/DownloadTestsModal.test.tsx
git commit -m "feat(download-tests): DownloadTestsModal component"
```

---

## Task 8: Wire `DownloadTestsButton` into `HomePage`

**Files:**
- Modify: `src/pages/HomePage.tsx`

- [ ] **Step 1: Import the new components**

Edit `src/pages/HomePage.tsx`. Find the existing imports block (around lines 1–13) and add:

```ts
import { DownloadTestsButton } from "@/components/DownloadTestsButton";
import { DownloadTestsModal } from "@/components/DownloadTestsModal";
```

- [ ] **Step 2: Add modal-open state**

Find the line `const [openCategoryId, setOpenCategoryId] = useState<string | null>(null);` (around line 113) and add right below:

```ts
const [downloadsOpen, setDownloadsOpen] = useState(false);
```

- [ ] **Step 3: Add the button to the header nav cluster**

In the header (around line 152, the `<div>` containing `StatPill`s and the `Dashboard` link), insert the new button right before the existing `<Link to="/dashboard" ...>`:

```tsx
<DownloadTestsButton onClick={() => setDownloadsOpen(true)} />
```

- [ ] **Step 4: Render the modal at the end of `<main>`**

Right after the existing `<Confetti trigger={confettiTrigger} />` line (around line 220), and right before the closing `</main>`, add:

```tsx
<DownloadTestsModal open={downloadsOpen} onClose={() => setDownloadsOpen(false)} />
```

- [ ] **Step 5: Smoke test in the browser**

```bash
npm run dev
```

Open `http://localhost:5173/home` (sign in if needed). Click the new download icon in the top-right cluster. Confirm:
- Modal opens with three category sections.
- Each row is clickable and triggers a download.
- Esc and clicking the backdrop close the modal.

Stop the dev server (Ctrl+C).

- [ ] **Step 6: Commit**

```bash
git add src/pages/HomePage.tsx
git commit -m "feat(download-tests): wire downloads button into HomePage header"
```

---

## Task 9: Wire `DownloadTestsButton` into `WelcomePage`

**Files:**
- Modify: `src/pages/WelcomePage.tsx`

- [ ] **Step 1: Import the new components**

Edit `src/pages/WelcomePage.tsx`. Add to the imports:

```ts
import { useState } from "react";    // already imported, but ensure it's there
import { DownloadTestsButton } from "@/components/DownloadTestsButton";
import { DownloadTestsModal } from "@/components/DownloadTestsModal";
```

- [ ] **Step 2: Add modal-open state**

Right after `const [confirmDelete, setConfirmDelete] = useState<string | null>(null);` (around line 19), add:

```ts
const [downloadsOpen, setDownloadsOpen] = useState(false);
```

- [ ] **Step 3: Add a top-right anchored button**

WelcomePage doesn't have a header row. We anchor the button to the outer `<main>` corner so it's visible regardless of scroll. Find the outer `<main className="min-h-screen bg-white">` and immediately inside it, before the existing `<div>`, add:

```tsx
<div className="absolute top-3 right-3 sm:top-5 sm:right-5 z-10">
  <DownloadTestsButton onClick={() => setDownloadsOpen(true)} />
</div>
```

Then change the `<main>` element to be positioned: replace `<main className="min-h-screen bg-white">` with `<main className="relative min-h-screen bg-white">`.

(Tailwind's `right-3` is physical right, which is the visual right edge regardless of `dir="rtl"`. That's what we want — the button anchored to the right edge of the screen.)

- [ ] **Step 4: Render the modal**

Right before the existing `<Confirm ... />` element (around line 113), add:

```tsx
<DownloadTestsModal open={downloadsOpen} onClose={() => setDownloadsOpen(false)} />
```

- [ ] **Step 5: Smoke test in the browser**

```bash
npm run dev
```

Open `http://localhost:5173/welcome` (clear local storage first if you have a user). Verify:
- A download icon button is visible in the top-right corner.
- Clicking opens the modal.
- The modal works the same as on HomePage.

Stop the dev server.

- [ ] **Step 6: Commit**

```bash
git add src/pages/WelcomePage.tsx
git commit -m "feat(download-tests): wire downloads button into WelcomePage"
```

---

## Task 10: E2E Smoke Test

**Files:**
- Create: `tests/e2e/download-tests.spec.ts`

- [ ] **Step 1: Write the test**

Create `tests/e2e/download-tests.spec.ts`:

```ts
import { test, expect } from "@playwright/test";

test("download modal lists 23 PDFs and downloads one", async ({ page, context }) => {
  await context.addInitScript(() => window.localStorage.clear());
  await page.goto("/welcome");

  // Sign in to land on HomePage
  await page.getByPlaceholder("לדוגמה: נועה").fill("בודק");
  await page.getByRole("button", { name: /התחל/ }).click();

  // Open the download modal from the HomePage header
  await page.getByRole("button", { name: "הורדת מבחנים" }).click();

  // Three category sections appear
  await expect(page.getByRole("dialog", { name: "הורדת מבחנים" })).toBeVisible();
  await expect(page.getByText("ידע מתמטי")).toBeVisible();
  await expect(page.getByText("חשיבה והגיון")).toBeVisible();
  await expect(page.getByText("מבחנים לדוגמה")).toBeVisible();

  // 23 download links inside the modal
  const links = page.getByRole("dialog").getByRole("link");
  await expect(links).toHaveCount(23);

  // Click the first link and assert a download begins
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    links.first().click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/\.pdf$/);
});
```

- [ ] **Step 2: Make sure PDFs are present in the dev server's public dir**

```bash
node tools/pdf/generate_pdfs.mjs
npm run sync-data
ls public/data/pdfs/*.pdf | wc -l
```

Expected: `23`.

- [ ] **Step 3: Run the E2E test**

```bash
npm run test:e2e -- tests/e2e/download-tests.spec.ts
```

Expected: PASS. (`npm run test:e2e` boots the dev server via the `webServer` config — no manual server start needed.)

- [ ] **Step 4: Commit**

```bash
git add tests/e2e/download-tests.spec.ts
git commit -m "test(download-tests): e2e smoke test for download modal"
```

---

## Task 11: Final Verification

**Files:** none modified.

- [ ] **Step 1: Run the full test suite**

```bash
npm test
```

Expected: all unit + component tests pass, including new `pdfManifest.test.ts`, `pdfRender.test.ts`, and `DownloadTestsModal.test.tsx`.

- [ ] **Step 2: Run a full build to confirm the new pipeline works end-to-end**

```bash
npm run build
```

Expected:
- `generate-pdfs` step prints 23 lines, one per PDF.
- `sync-data` step prints `23 pdfs -> public/data/pdfs/`.
- TypeScript and Vite build succeed.
- `dist/data/pdfs/` exists and contains 23 PDFs:

```bash
ls dist/data/pdfs/*.pdf | wc -l
```

Expected: `23`.

- [ ] **Step 3: Spot-check the built output**

Open `dist/data/pdfs/sample-exams-exam-1.pdf` (a sample exam has the broadest mix of question types and likely some images). Verify cover, question section, image rendering, and answer key all look right.

- [ ] **Step 4: Verify nothing leaked into git**

```bash
git status
```

Expected: working tree clean. If `public/data/pdfs/` or `tools/pdf/out/*.pdf` show as new, `.gitignore` is missing entries — fix and commit.

---

## Open Risks Carried Forward From Spec

- **Netlify Chromium availability.** First deploy is the test. If the build fails because Chromium isn't available on Netlify's image, add a `postinstall` script to `package.json`: `"postinstall": "playwright install chromium"`. Don't add it speculatively — only if the build actually fails.
- **PDF determinism.** Chromium embeds a creation timestamp in the PDF. Generated PDFs will not be byte-identical across runs even with the same inputs. Acceptable — we don't diff binaries, and Netlify cache invalidation is based on the URL not the bytes.
- **`visual-only` answer key readability.** Three questions only. The answer key entry shows letter + explanation but cannot reproduce the visual options. If this turns into a user complaint, the future fix is to render small thumbnails of each option image in the answer key for those three questions.
