import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("../controllers/compilerController.js", async (importOriginal) => {
  const actual = await importOriginal();

  return {
    ...actual,
    callJudge0: vi.fn(),
  };
});

vi.mock("../models/Problem.js", () => ({
  default: { findOne: vi.fn() },
}));

import { callJudge0 } from "./compilerController.js";
import Problem from "../models/Problem.js";
import { runHandler } from "./judgeController.js";

function mockRes() {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

function mockLog() {
  return { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() };
}

describe("runHandler", () => {
  let res;

  beforeEach(() => {
    vi.clearAllMocks();
    res = mockRes();
  });

  it("marks a testcase as passed when stdout matches expectedOutput exactly", async () => {
    callJudge0.mockResolvedValue({ stdout: JSON.stringify([0, 1]), stderr: null, compile_output: null });
    const req = {
      body: {
        code: "def twoSum(a): return [0,1]",
        language: "python",
        functionName: "twoSum",
        testcases: [{ input: { nums: [2, 7] }, expectedOutput: [0, 1] }],
      },
      log: mockLog(),
    };

    await runHandler(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        results: [expect.objectContaining({ passed: true })],
      })
    );
  });

  // ── comparisonMode: "unordered" — audit finding P0-3 ─────────────────────
  it("passes a differently-ordered array on Run when comparisonMode is unordered", async () => {
    callJudge0.mockResolvedValue({ stdout: JSON.stringify([2, 1]), stderr: null, compile_output: null });
    const req = {
      body: {
        code: "...",
        language: "python",
        functionName: "topKFrequent",
        testcases: [{ input: { nums: [1, 1, 2] }, expectedOutput: [1, 2] }],
        comparisonMode: "unordered",
      },
      log: mockLog(),
    };

    await runHandler(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        results: [expect.objectContaining({ passed: true })],
      })
    );
  });

  it("still fails a differently-ordered array on Run when comparisonMode is absent (exact, default)", async () => {
    callJudge0.mockResolvedValue({ stdout: JSON.stringify([1, 0]), stderr: null, compile_output: null });
    const req = {
      body: {
        code: "...",
        language: "python",
        functionName: "twoSum",
        testcases: [{ input: { nums: [2, 7] }, expectedOutput: [0, 1] }],
      },
      log: mockLog(),
    };

    await runHandler(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        results: [expect.objectContaining({ passed: false })],
      })
    );
  });

  // ── Server-side contract resolution via problemSlug — audit finding P1-1 ─
  describe("problemSlug resolves the execution contract server-side", () => {
    it("ignores a client-sent comparisonMode when problemSlug is provided, using the problem's own instead", async () => {
      Problem.findOne.mockResolvedValue({
        functionName: "topKFrequent",
        returnType: {},
        comparisonMode: "unordered", // the problem's REAL contract
        operationSequence: { enabled: false },
      });
      callJudge0.mockResolvedValue({ stdout: JSON.stringify([2, 1]), stderr: null, compile_output: null });

      const req = {
        body: {
          code: "...",
          language: "python",
          problemSlug: "top-k-frequent-elements",
          testcases: [{ input: { nums: [1, 1, 2] }, expectedOutput: [1, 2] }],
          // Client tries to send "exact" — must be ignored in favor of the
          // problem's real "unordered" contract, exactly like Submit
          // already never trusted the client for this.
          comparisonMode: "exact",
        },
        log: mockLog(),
      };

      await runHandler(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          results: [expect.objectContaining({ passed: true })],
        })
      );
    });

    it("returns 404 when problemSlug doesn't match any problem", async () => {
      Problem.findOne.mockResolvedValue(null);
      const req = {
        body: {
          code: "...",
          language: "python",
          problemSlug: "does-not-exist",
          testcases: [{ input: {}, expectedOutput: 1 }],
        },
        log: mockLog(),
      };

      await runHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("falls back to client-sent contract fields when problemSlug is omitted entirely (backward compatible)", async () => {
      callJudge0.mockResolvedValue({ stdout: JSON.stringify([2, 1]), stderr: null, compile_output: null });
      const req = {
        body: {
          code: "...",
          language: "python",
          functionName: "topKFrequent",
          comparisonMode: "unordered",
          testcases: [{ input: { nums: [1, 1, 2] }, expectedOutput: [1, 2] }],
        },
        log: mockLog(),
      };

      await runHandler(req, res);

      expect(Problem.findOne).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          results: [expect.objectContaining({ passed: true })],
        })
      );
    });
  });

  // ── Empty testcases guard — audit finding P2-2 ────────────────────────────
  it("returns an empty result set immediately for an empty testcases array, without calling Judge0 or looking up the problem", async () => {
    const req = {
      body: { code: "...", language: "python", problemSlug: "two-sum", testcases: [] },
      log: mockLog(),
    };

    await runHandler(req, res);

    expect(callJudge0).not.toHaveBeenCalled();
    expect(Problem.findOne).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ results: [], compileFailed: false });
  });
});
