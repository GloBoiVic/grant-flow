import { describe, expect, it } from "vitest";

import { addUtcDays, formatUtcDate, toUtcDateOnly, utcToday } from "@/lib/dates/utc-dates";

describe("UTC date-only helpers", () => {
  it("converts wall-clock Date to UTC date-only midnight", () => {
    // Wall-clock afternoon should still map to same UTC calendar date
    const input = new Date("2026-09-04T15:30:45.123Z");
    expect(toUtcDateOnly(input)).toEqual(new Date("2026-09-04T00:00:00.000Z"));
    expect(formatUtcDate(toUtcDateOnly(input))).toBe("2026-09-04");
  });

  it("strips time component and keeps UTC calendar date", () => {
    const late = new Date("2026-09-04T23:59:59.999Z");
    const early = new Date("2026-09-04T00:00:00.000Z");
    expect(toUtcDateOnly(late).getTime()).toBe(early.getTime());
  });

  it("adds UTC calendar days correctly", () => {
    const base = new Date("2026-09-04T00:00:00.000Z");
    expect(addUtcDays(base, 0)).toEqual(new Date("2026-09-04T00:00:00.000Z"));
    expect(addUtcDays(base, 7)).toEqual(new Date("2026-09-11T00:00:00.000Z"));
    expect(addUtcDays(base, 30)).toEqual(new Date("2026-10-04T00:00:00.000Z"));
    expect(addUtcDays(base, 1)).toEqual(new Date("2026-09-05T00:00:00.000Z"));
    // Negative also works (for overdue boundary reasoning)
    expect(addUtcDays(base, -1)).toEqual(new Date("2026-09-03T00:00:00.000Z"));
  });

  it("addUtcDays respects month/year rollover via UTC", () => {
    // Jan 31 + 1 = Feb 1, Feb handling
    expect(addUtcDays(new Date("2026-01-31T00:00:00.000Z"), 1)).toEqual(new Date("2026-02-01T00:00:00.000Z"));
    expect(addUtcDays(new Date("2026-12-31T00:00:00.000Z"), 1)).toEqual(new Date("2027-01-01T00:00:00.000Z"));
  });

  it("serializes date-only Date as YYYY-MM-DD", () => {
    expect(formatUtcDate(new Date("2026-09-04T00:00:00.000Z"))).toBe("2026-09-04");
    expect(formatUtcDate(new Date("2026-10-05T00:00:00.000Z"))).toBe("2026-10-05");
  });

  it("utcToday returns UTC date-only midnight", () => {
    const today = utcToday();
    expect(today.toISOString()).toMatch(/T00:00:00\.000Z$/);
    // Should match today's UTC date string
    const nowUtcDateOnly = toUtcDateOnly(new Date());
    expect(today.getTime()).toBe(nowUtcDateOnly.getTime());
  });

  // Frozen boundary contract with injected today=2026-09-04
  describe("frozen deadline window boundaries (today=2026-09-04)", () => {
    const today = new Date("2026-09-04T00:00:00.000Z");
    const todayPlus7 = addUtcDays(today, 7); // 2026-09-11
    const todayPlus30 = addUtcDays(today, 30); // 2026-10-04

    function isOverdue(deadline: Date | null): boolean {
      if (deadline === null) return false;
      return deadline < today;
    }
    function isDueIn7(deadline: Date | null): boolean {
      if (deadline === null) return false;
      return deadline >= today && deadline <= todayPlus7;
    }
    function isUpcoming30(deadline: Date | null): boolean {
      if (deadline === null) return false;
      return deadline >= today && deadline <= todayPlus30;
    }

    it("2026-09-03 is overdue", () => {
      expect(isOverdue(new Date("2026-09-03T00:00:00.000Z"))).toBe(true);
      expect(isDueIn7(new Date("2026-09-03T00:00:00.000Z"))).toBe(false);
      expect(isUpcoming30(new Date("2026-09-03T00:00:00.000Z"))).toBe(false);
    });

    it("2026-09-04 is not overdue and is inside next7/next30", () => {
      const d = new Date("2026-09-04T00:00:00.000Z");
      expect(isOverdue(d)).toBe(false);
      expect(isDueIn7(d)).toBe(true);
      expect(isUpcoming30(d)).toBe(true);
    });

    it("2026-09-11 is inside next7", () => {
      expect(isDueIn7(new Date("2026-09-11T00:00:00.000Z"))).toBe(true);
      expect(isUpcoming30(new Date("2026-09-11T00:00:00.000Z"))).toBe(true);
    });

    it("2026-09-12 is outside next7 but inside next30", () => {
      const d = new Date("2026-09-12T00:00:00.000Z");
      expect(isDueIn7(d)).toBe(false);
      expect(isUpcoming30(d)).toBe(true);
      expect(isOverdue(d)).toBe(false);
    });

    it("2026-10-04 is inside next30", () => {
      expect(isUpcoming30(new Date("2026-10-04T00:00:00.000Z"))).toBe(true);
    });

    it("2026-10-05 is outside next30", () => {
      expect(isUpcoming30(new Date("2026-10-05T00:00:00.000Z"))).toBe(false);
      expect(isDueIn7(new Date("2026-10-05T00:00:00.000Z"))).toBe(false);
    });

    it("null is excluded from all windows", () => {
      expect(isOverdue(null)).toBe(false);
      expect(isDueIn7(null)).toBe(false);
      expect(isUpcoming30(null)).toBe(false);
    });

    it("overdue and next7 buckets are disjoint and inclusive upper boundaries", () => {
      // today is in next7, not overdue
      expect(isOverdue(today)).toBe(false);
      expect(isDueIn7(today)).toBe(true);
      // today+7 inclusive
      expect(isDueIn7(todayPlus7)).toBe(true);
      expect(isDueIn7(addUtcDays(todayPlus7, 1))).toBe(false);
      // overdue strictly < today
      expect(isOverdue(addUtcDays(today, -1))).toBe(true);
      expect(isOverdue(today)).toBe(false);
    });
  });
});
