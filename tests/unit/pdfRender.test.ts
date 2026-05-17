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
      imagesBaseUrl: "file:///abs/docs/images",
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
      imagesBaseUrl: "file:///abs/docs/images",
    });
    expect(html).not.toContain("<img");
  });

  it("renders multiple <img>s when image_file is an array", () => {
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
            image_file: ["docs/images/a.png", "docs/images/b.png"],
            source_q_num: null,
            note: "",
          },
        ],
      },
      imagesBaseUrl: "file:///abs/docs/images",
    });
    expect(html).toContain('src="file:///abs/docs/images/a.png"');
    expect(html).toContain('src="file:///abs/docs/images/b.png"');
  });

  it("renders without images when mapping is omitted", () => {
    const html = renderTopicHtml({
      title: "T",
      questions: [baseQ],
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
