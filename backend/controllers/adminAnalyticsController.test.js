import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("../models/User.js", () => ({
  default: { find: vi.fn() },
}));
vi.mock("../models/Problem.js", () => ({
  default: { find: vi.fn(), countDocuments: vi.fn() },
}));
vi.mock("../models/Submission.js", () => ({
  default: { find: vi.fn(), aggregate: vi.fn(), distinct: vi.fn() },
}));
vi.mock("../config/logger.js", () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import User from "../models/User.js";
import Problem from "../models/Problem.js";
import Submission from "../models/Submission.js";
import {
  getRegistrationTrends,
  getSubmissionTrends,
  getActiveUserTrends,
  getRetentionMetric,
  getProblemPopularity,
  getLanguagePopularity,
} from "./adminAnalyticsController.js";

function mockRes() {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

// Same chainable-query stand-in as adminController.test.js — `.select()` is
// the one this file actually uses; the rest are included so any future
// query shape here doesn't need a second helper.
function chainableQuery(result) {
  const q = {
    sort: vi.fn(() => q),
    select: vi.fn(() => q),
    skip: vi.fn(() => q),
    limit: vi.fn(() => q),
    lean: vi.fn().mockResolvedValue(result),
  };
  return q;
}

describe("adminAnalyticsController", () => {
  let res;

  beforeEach(() => {
    vi.clearAllMocks();
    res = mockRes();
  });

  describe("getRegistrationTrends", () => {
    it("buckets User.createdAt values daily by default and reports which bucket was used", async () => {
      User.find.mockReturnValueOnce(
        chainableQuery([{ createdAt: new Date() }, { createdAt: new Date() }])
      );

      await getRegistrationTrends({ query: {} }, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ bucket: "daily", trend: expect.any(Array) })
      );
      const payload = res.json.mock.calls[0][0];
      const total = payload.trend.reduce((sum, b) => sum + b.count, 0);
      expect(total).toBe(2);
    });

    it("falls back to daily for an invalid ?bucket= value rather than erroring", async () => {
      User.find.mockReturnValueOnce(chainableQuery([]));

      await getRegistrationTrends({ query: { bucket: "yearly" } }, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ bucket: "daily" }));
    });

    it("honors a valid ?bucket=weekly", async () => {
      User.find.mockReturnValueOnce(chainableQuery([]));

      await getRegistrationTrends({ query: { bucket: "weekly" } }, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ bucket: "weekly" }));
    });
  });

  describe("getSubmissionTrends", () => {
    it("buckets Submission.createdAt values", async () => {
      Submission.find.mockReturnValueOnce(chainableQuery([{ createdAt: new Date() }]));

      await getSubmissionTrends({ query: { bucket: "monthly" } }, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ bucket: "monthly" }));
      const payload = res.json.mock.calls[0][0];
      expect(payload.trend.reduce((sum, b) => sum + b.count, 0)).toBe(1);
    });
  });

  describe("getActiveUserTrends", () => {
    it("returns distinct-submitter counts for the 7- and 30-day rolling windows", async () => {
      Submission.distinct
        .mockResolvedValueOnce(["u1", "u2"]) // last 7 days
        .mockResolvedValueOnce(["u1", "u2", "u3", "u4"]); // last 30 days

      await getActiveUserTrends({}, res);

      expect(res.json).toHaveBeenCalledWith({ last7Days: 2, last30Days: 4 });
    });
  });

  describe("getRetentionMetric", () => {
    it("computes week-over-week retention as the overlap between the two windows", async () => {
      Submission.distinct
        .mockResolvedValueOnce(["u1", "u2", "u3"]) // week N
        .mockResolvedValueOnce(["u1", "u2", "u4"]); // week N-1

      await getRetentionMetric({}, res);

      // 2 of the 3 week-N-1 users (u1, u2) are also active in week N.
      expect(res.json).toHaveBeenCalledWith({
        weekN1ActiveUsers: 3,
        weekNActiveUsers: 3,
        retainedUsers: 2,
        retentionPercent: 67,
      });
    });

    it("returns null (not 0) when week N-1 had no active users, to avoid a misleading 0%", async () => {
      Submission.distinct.mockResolvedValueOnce([]).mockResolvedValueOnce([]);

      await getRetentionMetric({}, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ retentionPercent: null, weekN1ActiveUsers: 0 })
      );
    });
  });

  describe("getProblemPopularity", () => {
    it("ranks by accepted-submission count and attaches problem titles", async () => {
      Submission.aggregate.mockResolvedValueOnce([
        { _id: "two-sum", acceptedCount: 50 },
        { _id: "reverse-string", acceptedCount: 5 },
      ]);
      Problem.countDocuments.mockResolvedValueOnce(10);
      Problem.find.mockReturnValueOnce(
        chainableQuery([
          { slug: "two-sum", title: "Two Sum", difficulty: "Easy" },
          { slug: "reverse-string", title: "Reverse String", difficulty: "Easy" },
        ])
      );

      await getProblemPopularity({ query: { limit: "10" } }, res);

      expect(res.json).toHaveBeenCalledWith({
        mostSolved: [
          { slug: "two-sum", title: "Two Sum", difficulty: "Easy", acceptedCount: 50 },
          { slug: "reverse-string", title: "Reverse String", difficulty: "Easy", acceptedCount: 5 },
        ],
        leastSolved: [
          { slug: "reverse-string", title: "Reverse String", difficulty: "Easy", acceptedCount: 5 },
          { slug: "two-sum", title: "Two Sum", difficulty: "Easy", acceptedCount: 50 },
        ],
        // 10 catalog problems total, 2 have any accepted submissions.
        neverSolvedCount: 8,
      });
    });

    it("matches getProblems' catalog visibility filter when counting the catalog total", async () => {
      Submission.aggregate.mockResolvedValueOnce([]);
      Problem.countDocuments.mockResolvedValueOnce(0);
      Problem.find.mockReturnValueOnce(chainableQuery([]));

      await getProblemPopularity({ query: {} }, res);

      expect(Problem.countDocuments).toHaveBeenCalledWith({ visibility: { $ne: "contest" } });
    });

    it("drops slugs that no longer resolve to a live Problem doc instead of erroring", async () => {
      Submission.aggregate.mockResolvedValueOnce([{ _id: "deleted-problem", acceptedCount: 3 }]);
      Problem.countDocuments.mockResolvedValueOnce(5);
      Problem.find.mockReturnValueOnce(chainableQuery([])); // no matching Problem doc

      await getProblemPopularity({ query: {} }, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ mostSolved: [], leastSolved: [] })
      );
    });
  });

  describe("getLanguagePopularity", () => {
    it("returns every language's total submission count, most-used first", async () => {
      Submission.aggregate.mockResolvedValueOnce([
        { _id: "python", count: 120 },
        { _id: "javascript", count: 80 },
      ]);

      await getLanguagePopularity({}, res);

      expect(res.json).toHaveBeenCalledWith({
        languages: [
          { language: "python", count: 120 },
          { language: "javascript", count: 80 },
        ],
      });
    });
  });
});