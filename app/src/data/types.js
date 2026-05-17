// ============================================================
// Static question bank types
// ============================================================
// ============================================================
// Defaults & helpers
// ============================================================
export const EMPTY_STATS = {
    totalAnswered: 0,
    starsEarned: 0,
    currentStreakDays: 0,
    longestStreakDays: 0,
    lastActiveDate: "",
    todayCount: 0,
};
export function emptyProgress() {
    return {
        questions: {},
        topics: {},
        exams: [],
        stats: { ...EMPTY_STATS },
        reviewQueue: [],
    };
}
export function dirForCategoryId(categoryId) {
    switch (categoryId) {
        case "math-knowledge":
            return "01_ידע_מתמטי";
        case "logic-reasoning":
            return "02_חשיבה_והגיון";
        case "sample-exams":
            return "03_מבחנים_לדוגמה";
        default:
            return categoryId;
    }
}
export function topicIdFor(categoryId, topicSlug) {
    return `${dirForCategoryId(categoryId)}/${topicSlug}`;
}
