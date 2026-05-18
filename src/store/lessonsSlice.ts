import type { StateCreator } from "zustand";
import type { LessonBank, QuestionId, QuestionSkillMap, RawLesson } from "@/data/types";

export interface LessonsSlice {
  lessons: Record<string, RawLesson> | null;
  questionSkills: QuestionSkillMap | null;
  lessonsLoading: boolean;
  loadLessons: () => Promise<void>;
  lessonForQuestion: (qId: QuestionId) => RawLesson | null;
}

export const createLessonsSlice: StateCreator<LessonsSlice, [], [], LessonsSlice> = (
  set,
  get,
) => ({
  lessons: null,
  questionSkills: null,
  lessonsLoading: false,

  // Failures are silent by design (spec §9) — no error field, no toast.
  // The "איך פותרים?" button hides itself when the maps stay null.
  loadLessons: async () => {
    if (get().lessons !== null || get().lessonsLoading) return;
    set({ lessonsLoading: true });
    try {
      const [lessonsRes, skillsRes] = await Promise.all([
        fetch(new URL("data/lessons.json", document.baseURI)),
        fetch(new URL("data/question_skills.json", document.baseURI)),
      ]);
      if (!lessonsRes.ok || !skillsRes.ok) {
        set({ lessonsLoading: false });
        return;
      }
      const bank = (await lessonsRes.json()) as LessonBank;
      const skills = (await skillsRes.json()) as QuestionSkillMap;
      const lessonMap: Record<string, RawLesson> = {};
      for (const l of bank.lessons) lessonMap[l.id] = l;
      set({ lessons: lessonMap, questionSkills: skills, lessonsLoading: false });
    } catch {
      set({ lessonsLoading: false });
    }
  },

  lessonForQuestion: (qId) => {
    const lessons = get().lessons;
    const skills = get().questionSkills;
    if (!lessons || !skills) return null;
    const skillId = skills[qId];
    if (!skillId) return null;
    return lessons[skillId] ?? null;
  },
});
