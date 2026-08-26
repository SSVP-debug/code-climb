// Content & Execution Architecture, Phase 3 — SECURITY: hidden testcases
// must never reach a client. This asserts the exact .select() exclusion
// strings used by every public Problem read, covering BOTH the current
// (hiddenTestcaseSet) and legacy (hiddentestcases, deliberately left
// physically in place post-migration for rollback safety — see
// scripts/migrateHiddenTestcaseSet.js) field names. If a future edit
// narrows either exclusion back down to just one field name, this test
// catches it immediately rather than relying on no test data happening to
// include the other field.
import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("../models/Problem.js", () => ({
  default: { find: vi.fn(), findOne: vi.fn() },
}));
vi.mock("../models/Submission.js", () => ({
  default: { aggregate: vi.fn() },
}));
vi.mock("../utils/cache.js", () => ({
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

describe("Security — hidden testcases excluded from every public Problem read", () => {
  beforeEach(() => vi.clearAllMocks());

  it("getProblems excludes both hiddentestcases (legacy) and hiddenTestcaseSet (current)", async () => {
    const selectSpy = vi.fn().mockReturnThis();
    Problem.find.mockReturnValueOnce({
      select: selectSpy,
      sort: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue([]),
    });

    await getProblems({ log: mockLog() }, mockRes());

    expect(selectSpy).toHaveBeenCalledWith(
      expect.stringContaining("-hiddentestcases")
    );
    expect(selectSpy).toHaveBeenCalledWith(
      expect.stringContaining("-hiddenTestcaseSet")
    );
  });

  it("getProblemBySlug excludes both hiddentestcases (legacy) and hiddenTestcaseSet (current)", async () => {
    const selectSpy = vi.fn().mockReturnThis();
    Problem.findOne.mockReturnValueOnce({
      select: selectSpy,
      lean: vi.fn().mockResolvedValue({ id: 1, slug: "two-sum", visibility: "public" }),
    });
    Problem.findOne.mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      sort: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue(null),
    });

    await getProblemBySlug({ params: { slug: "two-sum" }, query: {}, log: mockLog() }, mockRes());

    expect(selectSpy).toHaveBeenCalledWith(
      expect.stringContaining("-hiddentestcases")
    );
    expect(selectSpy).toHaveBeenCalledWith(
      expect.stringContaining("-hiddenTestcaseSet")
    );
  });

  it("a raw document that still physically has BOTH field names (un-migrated + somehow re-populated) never surfaces either in the JSON response", async () => {
    // Simulates the exact worst case this double-exclusion is meant to
    // prevent: .select() is mocked as a real MongoDB-style projection
    // here (not just recorded) so this test fails if the exclusion
    // string is ever wrong, not just if it's absent.
    const rawDoc = {
      id: 1,
      slug: "two-sum",
      visibility: "public",
      hiddentestcases: [{ input: {}, expectedOutput: "SECRET" }],
      hiddenTestcaseSet: { enabled: true, testcases: [{ input: {}, expectedOutput: "SECRET" }] },
    };

    function applyExclusionProjection(doc, selectString) {
      const excluded = selectString.split(/\s+/).filter(Boolean).map((f) => f.replace(/^-/, ""));
      const result = { ...doc };
      for (const field of excluded) delete result[field];
      return result;
    }

    let capturedSelect = null;
    Problem.findOne.mockReturnValueOnce({
      select: vi.fn((s) => {
        capturedSelect = s;
        return {
          lean: vi.fn().mockResolvedValue(applyExclusionProjection(rawDoc, s)),
        };
      }),
    });
    Problem.findOne.mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      sort: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue(null),
    });

    const res = mockRes();
    await getProblemBySlug({ params: { slug: "two-sum" }, query: {}, log: mockLog() }, res);

    const jsonCall = res.json.mock.calls.find((call) => call[0]?.problem);
    expect(jsonCall).toBeTruthy();
    expect(jsonCall[0].problem).not.toHaveProperty("hiddentestcases");
    expect(jsonCall[0].problem).not.toHaveProperty("hiddenTestcaseSet");
    expect(capturedSelect).toContain("-hiddentestcases");
    expect(capturedSelect).toContain("-hiddenTestcaseSet");
  });
});
