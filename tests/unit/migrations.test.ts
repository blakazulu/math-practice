import { describe, it, expect } from "vitest";
import { migrate } from "@/store/migrations";

describe("migrations", () => {
  it("returns empty root when input is null", () => {
    const out = migrate(null);
    expect(out.version).toBe(1);
    expect(out.activeUserId).toBeNull();
    expect(out.users).toEqual({});
  });

  it("passes v1 data through unchanged", () => {
    const v1 = { version: 1, activeUserId: "noa", users: {} };
    expect(migrate(v1)).toEqual(v1);
  });

  it("throws on unknown future version", () => {
    expect(() => migrate({ version: 99 })).toThrow(/Unknown.*version/i);
  });

  it("rebuilds when payload is unrecognizable", () => {
    const out = migrate({ randomJunk: true });
    expect(out.version).toBe(1);
    expect(out.users).toEqual({});
  });

  it("backfills dailyAnswered={} when migrating legacy users without it", () => {
    const legacy = {
      version: 1,
      activeUserId: "u",
      users: {
        u: {
          id: "u",
          name: "L",
          createdAt: 1,
          progress: {
            questions: {},
            topics: {},
            exams: [],
            reviewQueue: [],
            stats: {
              totalAnswered: 0,
              starsEarned: 0,
              currentStreakDays: 0,
              longestStreakDays: 0,
              lastActiveDate: "",
              todayCount: 0,
              // dailyAnswered intentionally absent
            },
          },
        },
      },
    };
    const out = migrate(legacy);
    expect(out.users.u.progress.stats.dailyAnswered).toEqual({});
  });
});
