import { describe, it, expect } from "vitest";
import { formatLocalDate, addDays, diffInDays } from "@/lib/date";

describe("date helpers", () => {
  it("formatLocalDate returns YYYY-MM-DD in local time", () => {
    const d = new Date(2026, 4, 17, 14, 30);
    expect(formatLocalDate(d)).toBe("2026-05-17");
  });

  it("formatLocalDate pads month and day", () => {
    const d = new Date(2026, 0, 5, 0, 0);
    expect(formatLocalDate(d)).toBe("2026-01-05");
  });

  it("addDays adds N days", () => {
    const d = new Date(2026, 4, 17);
    const r = addDays(d, 3);
    expect(formatLocalDate(r)).toBe("2026-05-20");
  });

  it("diffInDays returns calendar-day difference", () => {
    expect(diffInDays("2026-05-17", "2026-05-17")).toBe(0);
    expect(diffInDays("2026-05-17", "2026-05-18")).toBe(1);
    expect(diffInDays("2026-05-17", "2026-05-20")).toBe(3);
    expect(diffInDays("2026-05-20", "2026-05-17")).toBe(-3);
  });
});
