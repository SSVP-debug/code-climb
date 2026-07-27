import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("../controllers/compilerController.js", async (importOriginal) => {
  const actual = await importOriginal();

  return {
    ...actual,
    callJudge0: vi.fn(),
  };
});

import { callJudge0 } from "./compilerController.js";
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
});
