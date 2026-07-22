import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("../models/User.js", () => ({
  default: { aggregate: vi.fn() },
}));
vi.mock("../utils/cache.js", () => ({
  // Bypass real caching — just run the factory function, as if every call
  // were a cache MISS. This suite is about the aggregation pipeline and the
  // response mapping, not the caching layer (covered separately in cache.test.js).
  getOrSetCache: vi.fn(async (key, ttl, fetchFn) => ({ value: await fetchFn() })),
  invalidateCachePrefix: vi.fn().mockResolvedValue(undefined),
}));

import User from "../models/User.js";
import leaderboardRouter from "./leaderboard.js";

// leaderboard.js doesn't export its handlers individually — pull them off
// the real router's stack, the same way plans/01's auth-wiring tests do.
// This calls the actual handler code, not a re-implementation of it.
function getHandler(path) {
  const layer = leaderboardRouter.stack.find((l) => l.route && l.route.path === path);
  if (!layer) throw new Error(`No route registered for path ${path}`);
  return layer.route.stack[layer.route.stack.length - 1].handle;
}

function mockRes() {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

function mockLog() {
  return { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() };
}

// NOTE ON SCOPE: `User.aggregate` is mocked here, the same way every other
// model call is mocked elsewhere in this test suite — these tests do not
// execute against a real MongoDB, so they cannot independently verify that
// MongoDB's own `$size`/`$sort` operators behave the way this fix assumes.
// That behavior is documented, standard Mongo aggregation semantics, not
// something this codebase should need to re-verify. What these tests DO
// verify, and what would have caught the original bug:
//   1. the pipeline sent to `aggregate()` computes `solvedCount` via `$size`
//      and sorts by it, rather than sorting the raw `solvedSlugs` array; and
//   2. the route correctly maps whatever (already-sorted) results Mongo
//      returns into the response shape, preserving that order.
describe("leaderboard.js — global ranking", () => {
  let req, res;

  beforeEach(() => {
    vi.clearAllMocks();
    res = mockRes();
    req = { query: {}, log: mockLog() };
  });

  it("sends a pipeline that computes solvedCount via $size and sorts by it, not by the raw array", async () => {
    User.aggregate.mockResolvedValue([]);

    const handler = getHandler("/global");
    await handler(req, res);

    const pipeline = User.aggregate.mock.calls[0][0];
    const addFieldsStage = pipeline.find((stage) => stage.$addFields);
    const sortStage = pipeline.find((stage) => stage.$sort);

    expect(addFieldsStage.$addFields.solvedCount).toEqual({
      $size: { $ifNull: ["$solvedSlugs", []] },
    });
    expect(sortStage.$sort).toEqual({ totalXP: -1, solvedCount: -1 });
    // Guard against regressing back to the original bug specifically:
    expect(sortStage.$sort.solvedSlugs).toBeUndefined();
  });

  it(
    "ranks three users tied on totalXP in descending solvedCount order, reflecting " +
      "what a correct $sort on the computed field would return",
    async () => {
      // Simulates what MongoDB would hand back after applying the pipeline's
      // own $sort — i.e., this is the shape/order this fix is responsible
      // for producing correctly, given Mongo's sort already did its job.
      User.aggregate.mockResolvedValue([
        { username: "five-solves", totalXP: 100, solvedSlugs: Array(5).fill("x"), solvedCount: 5 },
        { username: "two-solves", totalXP: 100, solvedSlugs: Array(2).fill("x"), solvedCount: 2 },
        { username: "one-solve", totalXP: 100, solvedSlugs: Array(1).fill("x"), solvedCount: 1 },
      ]);

      const handler = getHandler("/global");
      await handler(req, res);

      const [payload] = res.json.mock.calls[0];
      expect(payload.users.map((u) => u.username)).toEqual([
        "five-solves",
        "two-solves",
        "one-solve",
      ]);
      expect(payload.users.map((u) => u.solvedCount)).toEqual([5, 2, 1]);
    }
  );

  it("does not throw when a user document has no solvedSlugs array at all", async () => {
    User.aggregate.mockResolvedValue([
      { username: "no-slugs", totalXP: 0, solvedCount: 0 },
    ]);

    const handler = getHandler("/global");
    await handler(req, res);

    expect(res.status).not.toHaveBeenCalledWith(500);
    const [payload] = res.json.mock.calls[0];
    expect(payload.users[0].solvedCount).toBe(0);
  });
});

describe("leaderboard.js — college ranking", () => {
  let req, res;

  beforeEach(() => {
    vi.clearAllMocks();
    res = mockRes();
    req = {
      query: {},
      log: mockLog(),
      userDoc: {
        education: { verified: true, collegeEmail: "student@example.edu" },
      },
    };
  });

  it("sends a pipeline that computes solvedCount via $size and sorts by it, keeping the existing domain $match", async () => {
    User.aggregate.mockResolvedValue([]);

    const handler = getHandler("/college");
    await handler(req, res);

    const pipeline = User.aggregate.mock.calls[0][0];
    const matchStage = pipeline.find((stage) => stage.$match);
    const sortStage = pipeline.find((stage) => stage.$sort);

    expect(matchStage.$match.email.$regex).toBe("@example\\.edu$");
    expect(sortStage.$sort).toEqual({ totalXP: -1, solvedCount: -1 });
  });

  it("ranks users tied on totalXP within one college domain by descending solvedCount", async () => {
    User.aggregate.mockResolvedValue([
      { username: "top", totalXP: 50, solvedCount: 3 },
      { username: "bottom", totalXP: 50, solvedCount: 1 },
    ]);

    const handler = getHandler("/college");
    await handler(req, res);

    const [payload] = res.json.mock.calls[0];
    expect(payload.users.map((u) => u.username)).toEqual(["top", "bottom"]);
  });
});