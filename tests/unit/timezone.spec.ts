import { describe, expect, test } from "vitest";
import { clubYmdString, startOfClubDayUtc, isSameClubDay, formatClubDate } from "@/lib/timezone";

describe("timezone helpers", () => {
  test("club day boundary uses midnight Pacific", () => {
    const d1 = new Date("2025-12-15T07:59:59.000Z");
    const d2 = new Date("2025-12-15T08:00:00.000Z");
    expect(clubYmdString(d1)).toBe("2025-12-14");
    expect(clubYmdString(d2)).toBe("2025-12-15");
    expect(isSameClubDay(d1, d2)).toBe(false);
  });

  test("startOfClubDayUtc returns UTC instant for 00:00 PT on that club day", () => {
    const anyTimeThatDay = new Date("2025-12-15T15:00:00.000Z");
    const start = startOfClubDayUtc(anyTimeThatDay);
    expect(start.toISOString()).toBe("2025-12-15T08:00:00.000Z");
  });

  test("DST start day: midnight resolves correctly", () => {
    const anyTime = new Date("2025-03-09T20:00:00.000Z");
    const start = startOfClubDayUtc(anyTime);
    expect(start.toISOString()).toBe("2025-03-09T08:00:00.000Z");
  });

  test("DST end day: midnight resolves correctly", () => {
    const anyTime = new Date("2025-11-02T20:00:00.000Z");
    const start = startOfClubDayUtc(anyTime);
    expect(start.toISOString()).toBe("2025-11-02T07:00:00.000Z");
  });

  test("formatClubDate formats in Pacific time", () => {
    const d = new Date("2025-12-15T07:00:00.000Z");
    const s = formatClubDate(d, "en-US");
    expect(s).toContain("Dec");
    expect(s).toContain("14");
  });
});
