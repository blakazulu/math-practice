import type { StateCreator } from "zustand";
import type {
  ImageDependencyIndex,
  ImageMapping,
  QuestionBank,
  QuestionId,
  RawQuestion,
} from "@/data/types";

export interface BankSlice {
  bank: QuestionBank | null;
  imageIndex: ImageDependencyIndex | null;
  imageMapping: ImageMapping | null;
  bankLoading: boolean;
  bankError: string | null;
  /** O(1) lookup map built once after loadBank finishes. */
  _questionMap: Map<QuestionId, RawQuestion> | null;
  /** Set of question ids that genuinely need an image (mapping says image_file != null). */
  _imageExpected: Set<QuestionId> | null;
  /** Set of question ids whose image file is sourced and ready to render. */
  _imageReady: Set<QuestionId> | null;
  loadBank: () => Promise<void>;
  getQuestion: (id: QuestionId) => RawQuestion | undefined;
  /** True only when the question needs an image AND that image hasn't been wired into mapping.json yet. */
  needsImage: (id: QuestionId) => boolean;
  /** True when the question can't be answered at all without a visual (no text options). */
  isVisualOnly: (id: QuestionId) => boolean;
  /** True when the question simply can't be queued — no text options OR a `correct_letter` of null. */
  isUnanswerable: (id: QuestionId) => boolean;
  getImage: (id: QuestionId) => { src: string; alt: string } | null;
}

function basename(p: string): string {
  const idx = Math.max(p.lastIndexOf("/"), p.lastIndexOf("\\"));
  return idx >= 0 ? p.slice(idx + 1) : p;
}

export const createBankSlice: StateCreator<BankSlice, [], [], BankSlice> = (set, get) => ({
  bank: null,
  imageIndex: null,
  imageMapping: null,
  bankLoading: false,
  bankError: null,
  _questionMap: null,
  _imageExpected: null,
  _imageReady: null,

  loadBank: async () => {
    if (get().bank || get().bankLoading) return;
    set({ bankLoading: true, bankError: null });
    try {
      const [bankRes, imgRes, mapRes] = await Promise.all([
        fetch(new URL("data/questions.json", document.baseURI)),
        fetch(new URL("data/image_dependent_questions.json", document.baseURI)),
        fetch(new URL("data/image_mapping.json", document.baseURI)),
      ]);
      if (!bankRes.ok) throw new Error(`bank fetch ${bankRes.status}`);
      const bank = (await bankRes.json()) as QuestionBank;
      const imageIndex = imgRes.ok
        ? ((await imgRes.json()) as ImageDependencyIndex)
        : { total: 0, questions: [] };
      const imageMapping = mapRes.ok ? ((await mapRes.json()) as ImageMapping) : null;

      // Build O(1) lookup structures once.
      const questionMap = new Map<QuestionId, RawQuestion>();
      for (const cat of bank.categories) {
        for (const topic of cat.topics) {
          for (const q of topic.questions) {
            questionMap.set(q.id, q);
          }
        }
      }
      const imageExpected = new Set<QuestionId>();
      const imageReady = new Set<QuestionId>();
      if (imageMapping) {
        for (const m of imageMapping.mapping) {
          if (m.image_file) {
            imageReady.add(m.q_id);
          } else {
            // Mapping entry exists but image_file is null — confirmed false positive.
            // Do NOT add to imageExpected — we don't want to show a placeholder.
          }
        }
        // imageExpected = mapping entries that have a non-null image_file but the file isn't on disk.
        // Since the mapping is the source of truth for which questions actually need visuals,
        // imageExpected stays effectively empty unless image_file points somewhere unfetched.
        // We treat any image_file entry as ready, since sync-data copied the file.
      } else {
        // No mapping.json — fall back to the broader image_dependent_questions.json,
        // which means every flagged question shows the placeholder.
        for (const e of imageIndex.questions) imageExpected.add(e.q_id);
      }

      set({
        bank,
        imageIndex,
        imageMapping,
        bankLoading: false,
        _questionMap: questionMap,
        _imageExpected: imageExpected,
        _imageReady: imageReady,
      });
    } catch (e) {
      set({ bankError: String(e), bankLoading: false });
    }
  },

  getQuestion: (id) => get()._questionMap?.get(id),

  needsImage: (id) => {
    // "Needs but missing" — only true when an image is expected but not yet sourced.
    const ready = get()._imageReady;
    const expected = get()._imageExpected;
    if (ready?.has(id)) return false;
    return expected?.has(id) ?? false;
  },

  isVisualOnly: (id) => {
    const q = get().getQuestion(id);
    return q ? q.flags.includes("visual-only") : false;
  },

  isUnanswerable: (id) => {
    const q = get().getQuestion(id);
    if (!q) return true;
    if (q.flags.includes("visual-only")) return true;
    if (q.correct_letter === null) return true;
    return false;
  },

  getImage: (id) => {
    const mapping = get().imageMapping;
    if (!mapping) return null;
    const entry = mapping.mapping.find((m) => m.q_id === id);
    if (!entry || !entry.image_file) return null;
    const fileName = basename(entry.image_file);
    return {
      src: new URL(`data/images/${fileName}`, document.baseURI).toString(),
      alt: entry.question_excerpt ?? "",
    };
  },
});
