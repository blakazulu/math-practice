import type { StateCreator } from "zustand";
import type {
  ExamSession,
  OptionLetter,
  PracticeSession,
  QuestionId,
  Session,
  TopicId,
} from "@/data/types";

export type AttemptOutcome =
  | "first-correct"
  | "next-correct"
  | "wrong-keep-trying"
  | "wrong-out-of-tries";

export interface SessionSlice {
  session: Session;
  startPracticeSession: (input: {
    topicId: TopicId;
    queue: QuestionId[];
    mode: "practice" | "review";
  }) => void;
  startExamSession: (input: {
    examId: TopicId;
    queue: QuestionId[];
    timerEnabled: boolean;
    durationSec: number;
  }) => void;
  endSession: () => void;
  attemptAnswer: (correct: boolean) => AttemptOutcome;
  advanceHint: () => void;
  reveal: () => void;
  next: () => void;
  examPick: (questionId: QuestionId, letter: OptionLetter | null) => void;
  examFlag: (questionId: QuestionId, flagged: boolean) => void;
  examJumpTo: (index: number) => void;
  examTick: () => void;
  examFinish: () => void;
}

export const createSessionSlice: StateCreator<SessionSlice, [], [], SessionSlice> = (set, get) => ({
  session: null,

  startPracticeSession: ({ topicId, queue, mode }) => {
    const fresh: PracticeSession = {
      mode,
      topicId: mode === "review" ? null : topicId,
      queue,
      index: 0,
      currentAttempts: 0,
      revealed: false,
      hintLevel: 0,
      results: {
        answered: 0,
        firstTryCorrect: 0,
        secondTryCorrect: 0,
        thirdTryCorrect: 0,
        failed: 0,
      },
    };
    set({ session: fresh });
  },

  startExamSession: ({ examId, queue, timerEnabled, durationSec }) => {
    const fresh: ExamSession = {
      mode: "exam",
      examId,
      queue,
      index: 0,
      picks: Object.fromEntries(queue.map((q) => [q, null])),
      flagged: Object.fromEntries(queue.map((q) => [q, false])),
      timerEnabled,
      startedAt: Date.now(),
      durationSec,
      remainingSec: durationSec,
      ended: false,
    };
    set({ session: fresh });
  },

  endSession: () => set({ session: null }),

  attemptAnswer: (correct) => {
    const s = get().session;
    if (!s || s.mode === "exam")
      throw new Error("attemptAnswer requires a practice/review session");
    const tries = s.currentAttempts;
    if (correct) {
      const which =
        tries === 0
          ? "firstTryCorrect"
          : tries === 1
            ? "secondTryCorrect"
            : "thirdTryCorrect";
      set({
        session: {
          ...s,
          revealed: true,
          currentAttempts: Math.min(3, tries + 1) as 0 | 1 | 2 | 3,
          results: {
            ...s.results,
            answered: s.results.answered + 1,
            [which]: s.results[which] + 1,
          },
        },
      });
      return tries === 0 ? "first-correct" : "next-correct";
    }
    const nextAttempts = Math.min(3, tries + 1) as 0 | 1 | 2 | 3;
    if (nextAttempts >= 3) {
      set({
        session: {
          ...s,
          currentAttempts: 3,
          revealed: true,
          hintLevel: 3,
          results: {
            ...s.results,
            answered: s.results.answered + 1,
            failed: s.results.failed + 1,
          },
        },
      });
      return "wrong-out-of-tries";
    }
    set({
      session: {
        ...s,
        currentAttempts: nextAttempts,
        hintLevel: Math.max(s.hintLevel, nextAttempts) as 0 | 1 | 2 | 3,
      },
    });
    return "wrong-keep-trying";
  },

  advanceHint: () => {
    const s = get().session;
    if (!s || s.mode === "exam") return;
    set({ session: { ...s, hintLevel: Math.min(3, s.hintLevel + 1) as 0 | 1 | 2 | 3 } });
  },

  reveal: () => {
    const s = get().session;
    if (!s || s.mode === "exam") return;
    set({ session: { ...s, revealed: true, hintLevel: 3 } });
  },

  next: () => {
    const s = get().session;
    if (!s || s.mode === "exam") return;
    set({
      session: {
        ...s,
        index: s.index + 1,
        currentAttempts: 0,
        revealed: false,
        hintLevel: 0,
      },
    });
  },

  examPick: (questionId, letter) => {
    const s = get().session;
    if (!s || s.mode !== "exam") return;
    set({ session: { ...s, picks: { ...s.picks, [questionId]: letter } } });
  },

  examFlag: (questionId, flagged) => {
    const s = get().session;
    if (!s || s.mode !== "exam") return;
    set({ session: { ...s, flagged: { ...s.flagged, [questionId]: flagged } } });
  },

  examJumpTo: (index) => {
    const s = get().session;
    if (!s || s.mode !== "exam") return;
    if (index < 0 || index >= s.queue.length) return;
    set({ session: { ...s, index } });
  },

  examTick: () => {
    const s = get().session;
    if (!s || s.mode !== "exam" || !s.timerEnabled || s.ended) return;
    const remaining = Math.max(0, s.remainingSec - 1);
    set({
      session: { ...s, remainingSec: remaining, ended: remaining === 0 ? true : s.ended },
    });
  },

  examFinish: () => {
    const s = get().session;
    if (!s || s.mode !== "exam") return;
    set({ session: { ...s, ended: true } });
  },
});
