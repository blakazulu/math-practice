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

function categoryOf(slug) {
  const cat = KNOWN_CATS.find((c) => slug.startsWith(c + "-"));
  if (!cat) throw new Error(`Slug missing known category prefix: ${slug}`);
  return cat;
}

// Mirrors TOPIC_URL_SLUGS in src/data/types.ts. Hand-maintained because importing
// TypeScript directly from a Node build script would require an extra compile step.
// Sync is guarded by the manifest tests (TS pdfManifest <-> tools/pdf/manifest.json),
// but adding a new topic still requires editing this map by hand.
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

const MANIFEST = loadJson(join(__dirname, "manifest.json"));

async function main() {
  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

  const bank = loadJson(join(REPO_ROOT, "data", "questions.json"));
  const mapping = loadJson(join(REPO_ROOT, "docs", "images", "mapping.json"));

  const topicIndex = new Map();
  for (const cat of bank.categories) {
    for (const t of cat.topics) {
      const dir = HEBREW_DIRS[cat.id];
      if (!dir) continue;
      topicIndex.set(`${dir}/${t.id}`, t);
    }
  }

  const imagesBaseUrl = pathToFileURL(IMAGES_DIR).href;
  const cssHref = pathToFileURL(join(__dirname, "print.css")).href;
  const katexHref = pathToFileURL(join(__dirname, "katex.min.css")).href;

  const browser = await chromium.launch();
  const ctx = await browser.newContext();
  let okCount = 0;

  try {
    for (const entry of MANIFEST) {
      const cat = categoryOf(entry.slug);
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
        imagesBaseUrl,
        cssHref,
        katexHref,
      });

      const htmlPath = join(OUT_DIR, `${entry.slug}.html`);
      const pdfPath = join(OUT_DIR, `${entry.slug}.pdf`);
      writeFileSync(htmlPath, html, "utf8");

      const page = await ctx.newPage();
      await page.goto(pathToFileURL(htmlPath).href, { waitUntil: "networkidle" });
      await page.evaluate(() => document.fonts.ready);
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
