export const createBankSlice = (set, get) => ({
    bank: null,
    imageIndex: null,
    bankLoading: false,
    bankError: null,
    loadBank: async () => {
        if (get().bank)
            return;
        set({ bankLoading: true, bankError: null });
        try {
            const [bankRes, imgRes] = await Promise.all([
                fetch(new URL("data/questions.json", document.baseURI)),
                fetch(new URL("data/image_dependent_questions.json", document.baseURI)),
            ]);
            if (!bankRes.ok)
                throw new Error(`bank fetch ${bankRes.status}`);
            const bank = (await bankRes.json());
            const imageIndex = imgRes.ok
                ? (await imgRes.json())
                : { total: 0, questions: [] };
            set({ bank, imageIndex, bankLoading: false });
        }
        catch (e) {
            set({ bankError: String(e), bankLoading: false });
        }
    },
    getQuestion: (id) => {
        const bank = get().bank;
        if (!bank)
            return undefined;
        for (const cat of bank.categories) {
            for (const topic of cat.topics) {
                for (const q of topic.questions) {
                    if (q.id === id)
                        return q;
                }
            }
        }
        return undefined;
    },
    needsImage: (id) => {
        const idx = get().imageIndex;
        if (!idx)
            return false;
        return idx.questions.some((e) => e.q_id === id);
    },
    isVisualOnly: (id) => {
        const q = get().getQuestion(id);
        return q ? q.flags.includes("visual-only") : false;
    },
    getImage: (id) => {
        const idx = get().imageIndex;
        if (!idx)
            return null;
        const entry = idx.questions.find((e) => e.q_id === id);
        if (!entry || !entry.image)
            return null;
        return { src: entry.image, alt: entry.image_alt ?? "" };
    },
});
