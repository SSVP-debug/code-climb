import { describe, it, expect } from "vitest";
import { bucketByPeriod } from "./timeBuckets.js";

// Fixed "now" for every test below: 2026-08-08T12:00:00Z (a Saturday).
// Using a fixed instant, not `new Date()`, is the whole point here — see
// plan 007's test plan: assert specific counts land in specific buckets.
const NOW = new Date("2026-08-08T12:00:00.000Z");

describe("bucketByPeriod", () => {
  describe("daily", () => {
    it("builds exactly `periods` UTC-day buckets ending today, in ascending order", () => {
      const buckets = bucketByPeriod([], "daily", 3, NOW);
      expect(buckets.map((b) => b.label)).toEqual(["2026-08-06", "2026-08-07", "2026-08-08"]);
    });

    it("places a date at the start of a day boundary into that day, not the previous one", () => {
      const dates = [
        "2026-08-07T00:00:00.000Z", // exactly midnight — start of Aug 7
        "2026-08-07T23:59:59.999Z", // one ms before Aug 8 — still Aug 7
        "2026-08-08T00:00:00.000Z", // exactly midnight — start of Aug 8
      ];
      const buckets = bucketByPeriod(dates, "daily", 3, NOW);
      const byLabel = Object.fromEntries(buckets.map((b) => [b.label, b.count]));
      expect(byLabel).toEqual({ "2026-08-06": 0, "2026-08-07": 2, "2026-08-08": 1 });
    });

    it("excludes dates outside the window entirely (not folded into the edge bucket)", () => {
      const dates = ["2026-08-04T12:00:00.000Z"]; // 2 days before the 3-day window starts
      const buckets = bucketByPeriod(dates, "daily", 3, NOW);
      expect(buckets.reduce((sum, b) => sum + b.count, 0)).toBe(0);
    });

    it("defaults to a 30-day window when periods is omitted", () => {
      const buckets = bucketByPeriod([], "daily", undefined, NOW);
      expect(buckets).toHaveLength(30);
      expect(buckets[29].label).toBe("2026-08-08");
      expect(buckets[0].label).toBe("2026-07-10");
    });
  });

  describe("weekly", () => {
    it("builds rolling 7-day windows, most recent bucket ending at start of tomorrow", () => {
      const buckets = bucketByPeriod([], "weekly", 2, NOW);
      // Window 2 ends at 2026-08-09T00:00Z (start of tomorrow), so it spans
      // 2026-08-02T00:00Z .. 2026-08-09T00:00Z; window 1 is the 7 days before that.
      expect(buckets[1].label).toBe("Week of 2026-08-02");
      expect(buckets[0].label).toBe("Week of 2026-07-26");
    });

    it("assigns a date to the correct 7-day bucket", () => {
      const dates = [
        "2026-08-01T00:00:00.000Z", // last ms of the earlier bucket
        "2026-08-02T00:00:00.000Z", // first ms of the later bucket
      ];
      const buckets = bucketByPeriod(dates, "weekly", 2, NOW);
      expect(buckets[0].count).toBe(1); // "Week of 2026-07-26"
      expect(buckets[1].count).toBe(1); // "Week of 2026-08-02"
    });
  });

  describe("monthly", () => {
    it("builds UTC calendar-month buckets ending in the current month", () => {
      const buckets = bucketByPeriod([], "monthly", 3, NOW);
      expect(buckets.map((b) => b.label)).toEqual(["2026-06", "2026-07", "2026-08"]);
    });

    it("assigns a date to its calendar month regardless of day-of-month", () => {
      const dates = ["2026-07-01T00:00:00.000Z", "2026-07-31T23:59:59.999Z", "2026-08-01T00:00:00.000Z"];
      const buckets = bucketByPeriod(dates, "monthly", 3, NOW);
      const byLabel = Object.fromEntries(buckets.map((b) => [b.label, b.count]));
      expect(byLabel).toEqual({ "2026-06": 0, "2026-07": 2, "2026-08": 1 });
    });

    it("handles a leap-adjacent/short-month boundary correctly (Feb -> Mar)", () => {
      const now = new Date("2026-03-15T00:00:00.000Z");
      const dates = ["2026-02-28T23:59:59.999Z", "2026-03-01T00:00:00.000Z"];
      const buckets = bucketByPeriod(dates, "monthly", 2, now);
      const byLabel = Object.fromEntries(buckets.map((b) => [b.label, b.count]));
      expect(byLabel).toEqual({ "2026-02": 1, "2026-03": 1 });
    });
  });

  it("ignores unparseable dates rather than throwing", () => {
    const buckets = bucketByPeriod(["not-a-date", null, undefined], "daily", 3, NOW);
    expect(buckets.reduce((sum, b) => sum + b.count, 0)).toBe(0);
  });

  it("throws on an unknown unit", () => {
    expect(() => bucketByPeriod([], "yearly", 3, NOW)).toThrow(/unknown unit/);
  });
});