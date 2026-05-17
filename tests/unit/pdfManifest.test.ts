import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { PDF_MANIFEST } from "@/data/pdfManifest";
import { dirForCategoryId, topicIdFromUrl } from "@/data/types";

const bank = JSON.parse(readFileSync("data/questions.json", "utf8"));

function slugToParts(slug: string): { cat: string; topicSlug: string } {
  const knownCats = ["math-knowledge", "logic-reasoning", "sample-exams"];
  const cat = knownCats.find((c) => slug.startsWith(c + "-"));
  if (!cat) throw new Error(`slug missing known category prefix: ${slug}`);
  return { cat, topicSlug: slug.slice(cat.length + 1) };
}

describe("pdfManifest", () => {
  it("has 23 entries (16 topics + 7 sample exams)", () => {
    expect(PDF_MANIFEST).toHaveLength(23);
  });

  it("every slug is ASCII-only (safe for download URLs)", () => {
    for (const entry of PDF_MANIFEST) {
      expect(entry.slug).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it("every slug resolves to a known TopicId", () => {
    for (const entry of PDF_MANIFEST) {
      const { cat, topicSlug } = slugToParts(entry.slug);
      const id = topicIdFromUrl(cat, topicSlug);
      expect(id).not.toBeNull();
    }
  });

  it("entry.url matches /data/pdfs/<slug>.pdf", () => {
    for (const entry of PDF_MANIFEST) {
      expect(entry.url).toBe(`/data/pdfs/${entry.slug}.pdf`);
    }
  });

  it("every topic in questions.json has exactly one manifest entry", () => {
    const allTopics = bank.categories.flatMap((cat: { id: string; topics: { id: string }[] }) =>
      cat.topics.map((t) => `${dirForCategoryId(cat.id)}/${t.id}`),
    );
    expect(PDF_MANIFEST.length).toBe(allTopics.length);

    const expected = new Set<string>(allTopics);
    const got = new Set(
      PDF_MANIFEST.map((e) => {
        const { cat, topicSlug } = slugToParts(e.slug);
        return topicIdFromUrl(cat, topicSlug)!;
      }),
    );
    expect(got).toEqual(expected);
  });

  it("questionCount matches questions.json for every entry", () => {
    const counts: Record<string, number> = {};
    for (const cat of bank.categories) {
      for (const t of cat.topics) {
        counts[`${dirForCategoryId(cat.id)}/${t.id}`] = t.question_count;
      }
    }
    for (const e of PDF_MANIFEST) {
      const { cat, topicSlug } = slugToParts(e.slug);
      const id = topicIdFromUrl(cat, topicSlug)!;
      expect(e.questionCount).toBe(counts[id]);
    }
  });
});
