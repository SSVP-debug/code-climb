// Content & Execution Architecture, Phase 1 — a disabled problem must
// disappear from normal discovery (GET /api/problems) and 404 the same
// way a nonexistent slug does (GET /api/problems/:slug).
import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("../models/Problem.js", () => ({
  default: { find: vi.fn(), findOne: vi.fn() },
}));
vi.mock("../models/Submission.js", () => ({
  default: { aggregate: vi.fn() },
}));
vi.mock("../utils/cache.js", () => ({
  // Pass the fetchFn straight through — these tests care about the query
  // built, not about caching behavior itself (already covered elsewhere).
  getOrSetCache: vi.fn(async (key, ttl, fetchFn) => ({
    value: await fetchFn(),
    cacheStatus: "MISS",
  })),
  invalidateCache: vi.fn(),
}));
vi.mock("../utils/recommendNextProblem.js", () => ({
  getNextBestProblem: vi.fn().mockResolvedValue(null),
}));
vi.mock("../services/contestProblemAccess.js", () => ({
  canAccessContestProblem: vi.fn(),
}));

import Problem from "../models/Problem.js";
import { getProblems, getProblemBySlug } from "./problemController.js";

function mockRes() {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  res.set = vi.fn().mockReturnValue(res);
  return res;
}

function mockLog() {
  return { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() };
}

function chainableFind(result) {
  return {
    select: vi.fn().mockReturnThis(),
    sort: vi.fn().mockReturnThis(),
    lean: vi.fn().mockResolvedValue(result),
  };
}

describe("getProblems — Problem.enabled filtering", () => {
  beforeEach(() => vi.clearAllMocks());

  it("filters out disabled problems, but treats missing `enabled` as enabled (no backfill required)", async () => {
    Problem.find.mockReturnValueOnce(chainableFind([]));
    const res = mockRes();

    await getProblems({ log: mockLog() }, res);

    expect(Problem.find).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: { $ne: false } })
    );
  });
});

describe("getProblemBySlug — Problem.enabled gate", () => {
  beforeEach(() => vi.clearAllMocks());

  it("404s a disabled problem with the same shape as 'not found'", async () => {
    Problem.findOne.mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue({ slug: "two-sum", enabled: false, visibility: "public" }),
    });
    const res = mockRes();

    await getProblemBySlug({ params: { slug: "two-sum" }, query: {}, log: mockLog() }, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "Problem not found" });
  });

  it("serves an enabled problem normally", async () => {
    Problem.findOne.mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue({
        id: 1,
        slug: "two-sum",
        enabled: true,
        visibility: "public",
        difficulty: "Easy",
      }),
    });
    Problem.findOne.mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      sort: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue(null),
    });
    const res = mockRes();

    await getProblemBySlug({ params: { slug: "two-sum" }, query: {}, log: mockLog() }, res);

    expect(res.status).not.toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ problem: expect.objectContaining({ slug: "two-sum" }) })
    );
  });

  it("treats a problem with no `enabled` field at all as enabled (pre-Phase-1 documents)", async () => {
    Problem.findOne.mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue({ id: 1, slug: "two-sum", visibility: "public", difficulty: "Easy" }),
    });
    Problem.findOne.mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      sort: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue(null),
    });
    const res = mockRes();

    await getProblemBySlug({ params: { slug: "two-sum" }, query: {}, log: mockLog() }, res);

    expect(res.status).not.toHaveBeenCalledWith(404);
  });
});
