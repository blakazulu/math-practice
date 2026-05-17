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
      const inner = isVisualOnly || !txt ? "" : `<span>${renderInline(txt)}</span>`;
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
