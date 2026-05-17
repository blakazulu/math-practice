import type { UserStats } from "@/data/types";
import { diffInDays } from "./date";

export function applyStreak(prev: UserStats, today: string): UserStats {
  if (!prev.lastActiveDate) {
    return {
      ...prev,
      currentStreakDays: 1,
      longestStreakDays: Math.max(1, prev.longestStreakDays),
      lastActiveDate: today,
      todayCount: 1,
    };
  }
  const gap = diffInDays(prev.lastActiveDate, today);
  if (gap === 0) {
    return { ...prev, todayCount: prev.todayCount + 1 };
  }
  if (gap === 1) {
    const next = prev.currentStreakDays + 1;
    return {
      ...prev,
      currentStreakDays: next,
      longestStreakDays: Math.max(next, prev.longestStreakDays),
      lastActiveDate: today,
      todayCount: 1,
    };
  }
  return {
    ...prev,
    currentStreakDays: 1,
    lastActiveDate: today,
    todayCount: 1,
  };
}
