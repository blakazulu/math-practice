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
  loadBank: () => Promise<void>;
  getQuestion: (id: QuestionId) => RawQuestion | undefined;
  needsImage: (id: QuestionId) => boolean;
  isVisualOnly: (id: QuestionId) => boolean;
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

  loadBank: async () => {
    if (get().bank) return;
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
      set({ bank, imageIndex, imageMapping, bankLoading: false });
    } catch (e) {
      set({ bankError: String(e), bankLoading: false });
    }
  },

  getQuestion: (id) => {
    const bank = get().bank;
    if (!bank) return undefined;
    for (const cat of bank.categories) {
      for (const topic of cat.topics) {
        for (const q of topic.questions) {
          if (q.id === id) return q;
        }
      }
    }
    return undefined;
  },

  needsImage: (id) => {
    const idx = get().imageIndex;
    if (!idx) return false;
    return idx.questions.some((e) => e.q_id === id);
  },

  isVisualOnly: (id) => {
    const q = get().getQuestion(id);
    return q ? q.flags.includes("visual-only") : false;
  },

  getImage: (id) => {
    const mapping = get().imageMapping;
    if (!mapping) return null;
    const entry = mapping.mapping.find((m) => m.q_id === id);
    if (!entry || !entry.image_file) return null;
    // entry.image_file is e.g. "docs/images/<basename>.png" — strip to basename and serve from /data/images/
    const fileName = basename(entry.image_file);
    return {
      src: new URL(`data/images/${fileName}`, document.baseURI).toString(),
      alt: entry.question_excerpt ?? "",
    };
  },
});
