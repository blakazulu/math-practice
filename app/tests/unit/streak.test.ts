import { describe, it, expect } from "vitest";
import { applyStreak } from "@/lib/streak";
import { EMPTY_STATS } from "@/data/types";

describe("applyStreak", () => {
  it("first-ever answer initializes streak to 1, todayCount to 1", () => {
    const next = applyStreak({ ...EMPTY_STATS }, "2026-05-17");
    expect(next.currentStreakDays).toBe(1);
    expect(next.longestStreakDays).toBe(1);
    expect(next.todayCount).toBe(1);
    expect(next.lastActiveDate).toBe("2026-05-17");
  });

  it("same-day answer increments todayCount but not streak", () => {
    const stats = applyStreak({ ...EMPTY_STATS }, "2026-05-17");
    const next = applyStreak(stats, "2026-05-17");
    expect(next.currentStreakDays).toBe(1);
    expect(next.todayCount).toBe(2);
  });

  it("next-day answer increments streak", () => {
    let s = applyStreak({ ...EMPTY_STATS }, "2026-05-17");
    s = applyStreak(s, "2026-05-18");
    expect(s.currentStreakDays).toBe(2);
    expect(s.todayCount).toBe(1);
  });

  it("gap of 2+ days resets streak to 1", () => {
    let s = applyStreak({ ...EMPTY_STATS }, "2026-05-17");
    s = applyStreak(s, "2026-05-18");
    s = applyStreak(s, "2026-05-21");
    expect(s.currentStreakDays).toBe(1);
    expect(s.todayCount).toBe(1);
  });

  it("tracks longest streak across resets", () => {
    let s = { ...EMPTY_STATS };
    for (const day of ["2026-05-17", "2026-05-18", "2026-05-19"]) s = applyStreak(s, day);
    expect(s.longestStreakDays).toBe(3);
    s = applyStreak(s, "2026-05-25");
    expect(s.currentStreakDays).toBe(1);
    expect(s.longestStreakDays).toBe(3);
  });
});
