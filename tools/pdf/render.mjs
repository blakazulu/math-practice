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

function findImages(qId, mapping) {
  if (!mapping || !Array.isArray(mapping.mapping)) return [];
  const hit = mapping.mapping.find((m) => m.q_id === qId);
  if (!hit || !hit.image_file) return [];
  const raw = Array.isArray(hit.image_file) ? hit.image_file : [hit.image_file];
  return raw
    .map((p) => (typeof p === "string" ? p.split("/").pop() : null))
    .filter((s) => typeof s === "string" && s.length > 0);
}

function renderQuestion(q, mapping, imagesBaseUrl) {
  const letters = ["א", "ב", "ג", "ד"];
  const isVisualOnly = (q.flags || []).includes("visual-only");
  const imageBases = findImages(q.id, mapping);
  const imageHtml =
    imageBases.length > 0 && imagesBaseUrl
      ? `<div class="image">${imageBases.map((b) => `<img src="${imagesBaseUrl}/${esc(b)}" alt=""/>`).join("")}</div>`
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
  <div class="text">${renderInline(q.question)}</div>${imageHtml ? `\n  ${imageHtml}` : ""}
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
 * @param {object} [opts.mapping]          Parsed mapping.json contents.
 * @param {string} [opts.imagesBaseUrl]    Absolute URL base for docs/images/, e.g.
 *                                         `file:///D:/Code/My%20Stuff/math-practice/docs/images`
 *                                         (omit in unit tests or when no images are needed).
 * @param {string} [opts.cssHref="print.css"]
 * @param {string} [opts.katexHref="katex.min.css"]
 */
export function renderTopicHtml({
  title,
  questions,
  mapping,
  imagesBaseUrl,
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

  const qBlocks = questions.map((q) => renderQuestion(q, mapping, imagesBaseUrl)).join("");

  const answerKey = `
<section class="answer-key">
  <h2>מפתח תשובות</h2>
  ${questions.map((q) => renderAnswerEntry(q)).join("")}
</section>`;

  return `${head}${cover}${qBlocks}${answerKey}</body></html>`;
}
