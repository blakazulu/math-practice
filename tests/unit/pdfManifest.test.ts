import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { PDF_MANIFEST } from "@/data/pdfManifest";
import { topicIdFromUrl } from "@/data/types";

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
        const dir = cat.id === "math-knowledge" ? "01_ידע_מתמטי" : cat.id === "logic-reasoning" ? "02_חשיבה_והגיון" : "03_מבחנים_לדוגמה";
        expected.add(`${dir}/${t.id}`);
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
        const dir = cat.id === "math-knowledge" ? "01_ידע_מתמטי" : cat.id === "logic-reasoning" ? "02_חשיבה_והגיון" : "03_מבחנים_לדוגמה";
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
