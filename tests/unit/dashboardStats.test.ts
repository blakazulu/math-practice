import { describe, it, expect } from "vitest";
import type {
  QuestionBank,
  UserState,
  ExamAttempt,
  QuestionProgress,
  TopicProgress,
} from "@/data/types";
import { EMPTY_STATS } from "@/data/types";
import {
  masteryByTopic,
  overallMasteryPct,
  firstTryAccuracyPct,
  dailyHistogram,
  examTimeSeries,
  examSlopes,
  weakestTopicWithAttempts,
} from "@/lib/dashboardStats";

function makeBank(): QuestionBank {
  return {
    version: 1,
    total_questions: 6,
    categories: [
      {
        id: "math-knowledge",
        name_he: "ידע מתמטי",
        topic_count: 2,
        question_count: 5,
        topics: [
          {
            id: "שברים_עשרוניים",
            name_he: "שברים עשרוניים",
            source_file: "x.md",
            question_count: 3,
            questions: [],
          },
          {
            id: "אחוזים",
            name_he: "אחוזים",
            source_file: "y.md",
            question_count: 2,
            questions: [],
          },
        ],
      },
      {
        id: "logic-reasoning",
        name_he: "חשיבה והגיון",
        topic_count: 1,
        question_count: 1,
        topics: [
          {
            id: "סדרות",
            name_he: "סדרות",
            source_file: "z.md",
            question_count: 1,
            questions: [],
          },
        ],
      },
    ],
  };
}

function makeUser(overrides: Partial<UserState["progress"]> = {}): UserState {
  return {
    id: "u",
    name: "Test",
    createdAt: 1,
    progress: {
      questions: {} as Record<string, QuestionProgress>,
      topics: {} as Record<string, TopicProgress>,
      exams: [] as ExamAttempt[],
      reviewQueue: [],
      stats: { ...EMPTY_STATS },
      ...overrides,
    },
  };
}

describe("masteryByTopic", () => {
  it("returns one row per topic across categories, sorted ascending by pct", () => {
    const bank = makeBank();
    const user = makeUser({
      topics: {
        "01_ידע_מתמטי/שברים_עשרוניים": { attempted: 3, mastered: 2, totalQuestions: 3 },
        "01_ידע_מתמטי/אחוזים": { attempted: 1, mastered: 0, totalQuestions: 2 },
        "02_חשיבה_והגיון/סדרות": { attempted: 1, mastered: 1, totalQuestions: 1 },
      },
    });
    const rows = masteryByTopic(user, bank);
    expect(rows).toHaveLength(3);
    expect(rows.map((r) => r.topicName)).toEqual(["אחוזים", "שברים עשרוניים", "סדרות"]);
    expect(rows[0].pct).toBe(0);
    expect(rows[1].pct).toBe(67);
    expect(rows[2].pct).toBe(100);
  });

  it("treats topics with no progress as 0%", () => {
    const bank = makeBank();
    const user = makeUser();
    const rows = masteryByTopic(user, bank);
    expect(rows).toHaveLength(3);
    expect(rows.every((r) => r.pct === 0)).toBe(true);
  });
});

describe("overallMasteryPct", () => {
  it("is mastered/total across the whole bank, rounded", () => {
    const bank = makeBank();
    const user = makeUser({
      topics: {
        "01_ידע_מתמטי/שברים_עשרוניים": { attempted: 3, mastered: 2, totalQuestions: 3 },
        "02_חשיבה_והגיון/סדרות": { attempted: 1, mastered: 1, totalQuestions: 1 },
      },
    });
    // 3 of 6 = 50
    expect(overallMasteryPct(user, bank)).toBe(50);
  });
});

describe("firstTryAccuracyPct", () => {
  it("returns null with no answers", () => {
    expect(firstTryAccuracyPct(makeUser())).toBeNull();
  });
  it("is stars / totalAnswered rounded", () => {
    const u = makeUser();
    u.progress.stats.totalAnswered = 10;
    u.progress.stats.starsEarned = 6;
    expect(firstTryAccuracyPct(u)).toBe(60);
  });
});

describe("dailyHistogram", () => {
  it("returns one entry per day in window, zero-filled, ending at today", () => {
    const u = makeUser();
    u.progress.stats.dailyAnswered = {
      "2026-05-15": 3,
      "2026-05-17": 5,
    };
    const buckets = dailyHistogram(u, 7, "2026-05-17");
    expect(buckets).toHaveLength(7);
    expect(buckets.at(-1)).toEqual({ date: "2026-05-17", count: 5 });
    expect(buckets.find((b) => b.date === "2026-05-15")?.count).toBe(3);
    expect(buckets.find((b) => b.date === "2026-05-16")?.count).toBe(0);
  });
});

describe("examTimeSeries", () => {
  it("returns one point per attempt sorted by takenAt", () => {
    const u = makeUser({
      exams: [
        {
          examId: "03_מבחנים_לדוגמה/מבחן_לדוגמה_1",
          takenAt: 2000,
          durationSec: 100,
          timerEnabled: false,
          score: 18,
          total: 25,
          answers: {},
        },
        {
          examId: "03_מבחנים_לדוגמה/מבחן_לדוגמה_1",
          takenAt: 1000,
          durationSec: 100,
          timerEnabled: false,
          score: 15,
          total: 25,
          answers: {},
        },
      ],
    });
    const points = examTimeSeries(u);
    expect(points.map((p) => p.takenAt)).toEqual([1000, 2000]);
    expect(points[0].scorePct).toBe(60);
    expect(points[1].scorePct).toBe(72);
  });
});

describe("examSlopes", () => {
  it("returns one slope per exam taken at least twice, with examName from the bank", () => {
    const bank = makeBank();
    bank.categories.push({
      id: "sample-exams",
      name_he: "מבחנים לדוגמה",
      topic_count: 1,
      question_count: 25,
      topics: [
        {
          id: "מבחן_לדוגמה_1",
          name_he: "מבחן לדוגמה 1",
          source_file: "e.md",
          question_count: 25,
          questions: [],
        },
      ],
    });
    const u = makeUser({
      exams: [
        {
          examId: "03_מבחנים_לדוגמה/מבחן_לדוגמה_1",
          takenAt: 1000,
          durationSec: 100,
          timerEnabled: false,
          score: 15,
          total: 25,
          answers: {},
        },
        {
          examId: "03_מבחנים_לדוגמה/מבחן_לדוגמה_1",
          takenAt: 2000,
          durationSec: 100,
          timerEnabled: false,
          score: 22,
          total: 25,
          answers: {},
        },
      ],
    });
    const slopes = examSlopes(u, bank);
    expect(slopes).toHaveLength(1);
    expect(slopes[0].examName).toBe("מבחן לדוגמה 1");
    expect(slopes[0].first.scorePct).toBe(60);
    expect(slopes[0].latest.scorePct).toBe(88);
  });

  it("returns empty when no exam has been retaken", () => {
    const u = makeUser({
      exams: [
        {
          examId: "03_מבחנים_לדוגמה/מבחן_לדוגמה_1",
          takenAt: 1000,
          durationSec: 100,
          timerEnabled: false,
          score: 15,
          total: 25,
          answers: {},
        },
      ],
    });
    expect(examSlopes(u, makeBank())).toEqual([]);
  });
});

describe("weakestTopicWithAttempts", () => {
  it("returns the topic with the lowest mastery pct among topics with >= minAttempts", () => {
    const bank = makeBank();
    const u = makeUser({
      topics: {
        "01_ידע_מתמטי/שברים_עשרוניים": { attempted: 3, mastered: 2, totalQuestions: 3 }, // 67
        "01_ידע_מתמטי/אחוזים": { attempted: 1, mastered: 0, totalQuestions: 2 }, // 0 but <3 attempts
        "02_חשיבה_והגיון/סדרות": { attempted: 3, mastered: 1, totalQuestions: 1 }, // 100
      },
    });
    const w = weakestTopicWithAttempts(u, bank, 3);
    expect(w?.topicName).toBe("שברים עשרוניים");
  });

  it("returns null when no topic has enough attempts", () => {
    expect(weakestTopicWithAttempts(makeUser(), makeBank(), 3)).toBeNull();
  });
});
