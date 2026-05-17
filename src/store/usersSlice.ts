import type { StateCreator } from "zustand";
import type {
  OptionLetter,
  PersistRoot,
  QuestionId,
  TopicId,
  UserId,
  UserState,
} from "@/data/types";
import { emptyProgress } from "@/data/types";
import { slugifyName, makeUniqueUserId } from "@/lib/slug";
import { applyStreak } from "@/lib/streak";
import { todayLocal } from "@/lib/date";
import { readPersist, writePersist } from "@/lib/storage";
import { migrate } from "./migrations";

export interface RecordAnswerInput {
  userId: UserId;
  questionId: QuestionId;
  topicId: TopicId;
  totalQuestionsInTopic: number;
  correct: boolean;
  attemptIndex: 0 | 1 | 2;
  pickedLetter: OptionLetter | null;
}

export interface UsersSlice {
  activeUserId: UserId | null;
  users: Record<UserId, UserState>;
  hydrated: boolean;
  hydrate: () => void;
  createUser: (name: string) => UserId;
  switchUser: (id: UserId) => void;
  deleteUser: (id: UserId) => void;
  resetUserProgress: (id: UserId) => void;
  recordAnswer: (input: RecordAnswerInput) => void;
  /**
   * Record an exam answer — increments totalAnswered and updates streak/today count, but does NOT
   * award stars or flip firstTryCorrect. Exam mode has no concept of "first try" since the kid
   * picks once.
   */
  recordExamAnswer: (input: {
    userId: UserId;
    questionId: QuestionId;
    examId: TopicId;
    correct: boolean;
  }) => void;
  appendExamAttempt: (
    userId: UserId,
    attempt: import("@/data/types").ExamAttempt,
  ) => void;
  enqueueReview: (userId: UserId, questionId: QuestionId) => void;
  dequeueReview: (userId: UserId, questionId: QuestionId) => void;
}

function persist(state: { activeUserId: UserId | null; users: Record<UserId, UserState> }): void {
  const root: PersistRoot = {
    version: 1,
    activeUserId: state.activeUserId,
    users: state.users,
  };
  writePersist(root);
}

export const createUsersSlice: StateCreator<UsersSlice, [], [], UsersSlice> = (set, get) => ({
  activeUserId: null,
  users: {},
  hydrated: false,

  hydrate: () => {
    if (get().hydrated) return;
    const root = migrate(readPersist());
    set({ activeUserId: root.activeUserId, users: root.users, hydrated: true });
  },

  createUser: (rawName) => {
    const display = rawName.trim() || "שחקן";
    const base = slugifyName(display);
    const taken = new Set(Object.keys(get().users));
    const id = makeUniqueUserId(base, taken);
    const next: UserState = {
      id,
      name: display,
      createdAt: Date.now(),
      progress: emptyProgress(),
    };
    set((s) => {
      const users = { ...s.users, [id]: next };
      persist({ activeUserId: id, users });
      return { users, activeUserId: id };
    });
    return id;
  },

  switchUser: (id) => {
    if (!get().users[id]) return;
    set((s) => {
      persist({ activeUserId: id, users: s.users });
      return { activeUserId: id };
    });
  },

  deleteUser: (id) => {
    set((s) => {
      const { [id]: _removed, ...rest } = s.users;
      const activeUserId = s.activeUserId === id ? null : s.activeUserId;
      persist({ activeUserId, users: rest });
      return { users: rest, activeUserId };
    });
  },

  resetUserProgress: (id) => {
    set((s) => {
      const user = s.users[id];
      if (!user) return s;
      const fresh: UserState = { ...user, progress: emptyProgress() };
      const users = { ...s.users, [id]: fresh };
      persist({ activeUserId: s.activeUserId, users });
      return { users };
    });
  },

  recordAnswer: ({
    userId,
    questionId,
    topicId,
    totalQuestionsInTopic,
    correct,
    attemptIndex,
  }) => {
    set((s) => {
      const user = s.users[userId];
      if (!user) return s;
      const today = todayLocal();
      const prev = user.progress.questions[questionId];
      const attempts = Math.min(3, (prev?.attempts ?? 0) + 1) as 0 | 1 | 2 | 3;
      const firstTryCorrect = correct && attemptIndex === 0;
      const becameMastered = correct;
      const updatedQ = {
        attempts,
        firstTryCorrect: prev?.firstTryCorrect || firstTryCorrect,
        mastered: prev?.mastered || becameMastered,
        lastSeen: Date.now(),
        inReviewQueue:
          !becameMastered && attempts === 3 ? true : (prev?.inReviewQueue ?? false),
      };
      const wasAttempted = !!prev;
      const wasMastered = prev?.mastered ?? false;
      const topicPrev = user.progress.topics[topicId];
      const attempted = (topicPrev?.attempted ?? 0) + (wasAttempted ? 0 : 1);
      const mastered =
        (topicPrev?.mastered ?? 0) + (!wasMastered && updatedQ.mastered ? 1 : 0);
      const updatedT = {
        attempted,
        mastered,
        totalQuestions: totalQuestionsInTopic,
      };
      let stats = applyStreak(user.progress.stats, today);
      stats = {
        ...stats,
        totalAnswered: user.progress.stats.totalAnswered + 1,
        starsEarned: user.progress.stats.starsEarned + (firstTryCorrect ? 1 : 0),
      };
      let reviewQueue = user.progress.reviewQueue;
      if (updatedQ.inReviewQueue && !reviewQueue.includes(questionId)) {
        reviewQueue = [...reviewQueue, questionId];
      }
      if (correct && firstTryCorrect && reviewQueue.includes(questionId)) {
        reviewQueue = reviewQueue.filter((q) => q !== questionId);
      }
      const updatedUser: UserState = {
        ...user,
        progress: {
          ...user.progress,
          questions: { ...user.progress.questions, [questionId]: updatedQ },
          topics: { ...user.progress.topics, [topicId]: updatedT },
          stats,
          reviewQueue,
        },
      };
      const users = { ...s.users, [userId]: updatedUser };
      persist({ activeUserId: s.activeUserId, users });
      return { users };
    });
  },

  enqueueReview: (userId, questionId) => {
    set((s) => {
      const user = s.users[userId];
      if (!user || user.progress.reviewQueue.includes(questionId)) return s;
      const updatedUser: UserState = {
        ...user,
        progress: {
          ...user.progress,
          reviewQueue: [...user.progress.reviewQueue, questionId],
        },
      };
      const users = { ...s.users, [userId]: updatedUser };
      persist({ activeUserId: s.activeUserId, users });
      return { users };
    });
  },

  recordExamAnswer: ({ userId, questionId, examId, correct }) => {
    set((s) => {
      const user = s.users[userId];
      if (!user) return s;
      const today = todayLocal();
      const stats = {
        ...applyStreak(user.progress.stats, today),
        totalAnswered: user.progress.stats.totalAnswered + 1,
      };
      // Touch lastSeen for visibility but DON'T set firstTryCorrect or mastered from exam.
      const prev = user.progress.questions[questionId];
      const updatedQ = {
        attempts: prev?.attempts ?? 0,
        firstTryCorrect: prev?.firstTryCorrect ?? false,
        mastered: prev?.mastered ?? false,
        lastSeen: Date.now(),
        inReviewQueue: prev?.inReviewQueue ?? false,
      };
      void examId; // exam-mode progress is tracked via ExamAttempt, not topic aggregates
      const updatedUser: UserState = {
        ...user,
        progress: {
          ...user.progress,
          questions: { ...user.progress.questions, [questionId]: updatedQ },
          stats,
        },
      };
      void correct; // correct is captured in the ExamAttempt
      const users = { ...s.users, [userId]: updatedUser };
      persist({ activeUserId: s.activeUserId, users });
      return { users };
    });
  },

  appendExamAttempt: (userId, attempt) => {
    set((s) => {
      const user = s.users[userId];
      if (!user) return s;
      const updatedUser: UserState = {
        ...user,
        progress: {
          ...user.progress,
          exams: [...user.progress.exams, attempt],
        },
      };
      const users = { ...s.users, [userId]: updatedUser };
      persist({ activeUserId: s.activeUserId, users });
      return { users };
    });
  },

  dequeueReview: (userId, questionId) => {
    set((s) => {
      const user = s.users[userId];
      if (!user) return s;
      const updatedUser: UserState = {
        ...user,
        progress: {
          ...user.progress,
          reviewQueue: user.progress.reviewQueue.filter((q) => q !== questionId),
        },
      };
      const users = { ...s.users, [userId]: updatedUser };
      persist({ activeUserId: s.activeUserId, users });
      return { users };
    });
  },
});
