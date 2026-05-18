import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { create } from "zustand";
import { createLessonsSlice, type LessonsSlice } from "@/store/lessonsSlice";
import type { LessonBank, QuestionSkillMap, RawLesson } from "@/data/types";

const SAMPLE_LESSON: RawLesson = {
  id: "multiply-decimals",
  title: "כפל שברים עשרוניים",
  topic: "decimal-fractions",
  body: "## איך עושים זאת?\n1. ...\n\n## דוגמה\n...\n\n## לשים לב\n...\n",
};

const BANK: LessonBank = {
  version: 1,
  total_lessons: 1,
  lessons: [SAMPLE_LESSON],
};

const SKILLS: QuestionSkillMap = {
  "01_ידע_מתמטי/שברים_עשרוניים/q_1": "multiply-decimals",
};

function makeStore() {
  return create<LessonsSlice>()((...a) => createLessonsSlice(...a));
}

function mockFetchWith(banks: { lessons?: unknown; skills?: unknown; lessonsOk?: boolean; skillsOk?: boolean }) {
  vi.stubGlobal(
    "fetch",
    vi.fn((input: RequestInfo | URL) => {
      const url = input.toString();
      if (url.includes("lessons.json")) {
        return Promise.resolve({
          ok: banks.lessonsOk ?? true,
          json: () => Promise.resolve(banks.lessons),
        } as Response);
      }
      if (url.includes("question_skills.json")) {
        return Promise.resolve({
          ok: banks.skillsOk ?? true,
          json: () => Promise.resolve(banks.skills),
        } as Response);
      }
      return Promise.reject(new Error("unexpected fetch: " + url));
    }),
  );
}

describe("lessonsSlice", () => {
  beforeEach(() => {
    vi.stubGlobal("document", { baseURI: "http://localhost/" });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("loadLessons populates both maps", async () => {
    mockFetchWith({ lessons: BANK, skills: SKILLS });
    const store = makeStore();
    await store.getState().loadLessons();
    expect(store.getState().lessons).toEqual({ "multiply-decimals": SAMPLE_LESSON });
    expect(store.getState().questionSkills).toEqual(SKILLS);
  });

  it("lessonForQuestion returns the right lesson for a mapped q_id", async () => {
    mockFetchWith({ lessons: BANK, skills: SKILLS });
    const store = makeStore();
    await store.getState().loadLessons();
    expect(store.getState().lessonForQuestion("01_ידע_מתמטי/שברים_עשרוניים/q_1")).toEqual(
      SAMPLE_LESSON,
    );
  });

  it("lessonForQuestion returns null for an unmapped q_id", async () => {
    mockFetchWith({ lessons: BANK, skills: SKILLS });
    const store = makeStore();
    await store.getState().loadLessons();
    expect(store.getState().lessonForQuestion("ghost")).toBeNull();
  });

  it("lessonForQuestion returns null when skill has no matching lesson (defensive)", async () => {
    mockFetchWith({
      lessons: { version: 1, total_lessons: 0, lessons: [] },
      skills: SKILLS,
    });
    const store = makeStore();
    await store.getState().loadLessons();
    expect(store.getState().lessonForQuestion("01_ידע_מתמטי/שברים_עשרוניים/q_1")).toBeNull();
  });

  it("loadLessons failure leaves both maps as null without throwing", async () => {
    mockFetchWith({ lessonsOk: false, skillsOk: false, lessons: null, skills: null });
    const store = makeStore();
    await expect(store.getState().loadLessons()).resolves.toBeUndefined();
    expect(store.getState().lessons).toBeNull();
    expect(store.getState().questionSkills).toBeNull();
  });

  it("loadLessons is idempotent (second call is a no-op)", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(BANK),
    } as Response);
    vi.stubGlobal("fetch", fetchSpy);
    const store = makeStore();
    await store.getState().loadLessons();
    const callsAfterFirst = fetchSpy.mock.calls.length;
    await store.getState().loadLessons();
    expect(fetchSpy.mock.calls.length).toBe(callsAfterFirst);
  });
});
