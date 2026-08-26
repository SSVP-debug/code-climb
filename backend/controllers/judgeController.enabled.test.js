// Content & Execution Architecture, Phase 1 — Problem.enabled must be a
// hard kill switch for Run and Submit, with the same generic "not found"
// shape already used by the contest-visibility gate (see
// judgeController.contest.test.js for that precedent). Mirrors that file's
// mocking conventions exactly.
import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("../models/Problem.js", () => ({
  default: { findOne: vi.fn() },
}));
vi.mock("../controllers/compilerController.js", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, callJudge0: vi.fn() };
});
vi.mock("../controllers/submissionController.js", () => ({
  recordVerifiedSubmission: vi.fn().mockResolvedValue({ _id: "sub1" }),
}));
vi.mock("../services/contestScoring.js", () => ({
  awardContestSolve: vi.fn(),
}));
vi.mock("../services/battleRoomScoring.js", () => ({
  awardBattleRoomSolve: vi.fn(),
}));
vi.mock("../services/contestProblemAccess.js", () => ({
  canAccessContestProblem: vi.fn(),
}));

import Problem from "../models/Problem.js";
import { callJudge0 } from "../controllers/compilerController.js";
import { submitHandler, runHandler } from "../controllers/judgeController.js";

function mockRes() {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

function mockLog() {
  return { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() };
}

const disabledProblem = {
  slug: "two-sum",
  title: "Two Sum",
  visibility: "public",
  enabled: false,
  hiddenTestcaseSet: { enabled: true, testcases: [{ input: { nums: [3, 3] }, expectedOutput: [0, 1] }] },
};

const enabledProblem = {
  slug: "two-sum",
  title: "Two Sum",
  visibility: "public",
  enabled: true,
  hiddenTestcaseSet: { enabled: true, testcases: [{ input: { nums: [3, 3] }, expectedOutput: [0, 1] }] },
};

describe("Problem.enabled — Run/Submit guard (Content & Execution Architecture, Phase 1)", () => {
  let res;

  beforeEach(() => {
    vi.clearAllMocks();
    res = mockRes();
  });

  describe("submitHandler", () => {
    const body = {
      problemSlug: "two-sum",
      code: "def twoSum(a): return a",
      language: "python",
      visibletestcases: [{ input: { nums: [2, 7] }, expectedOutput: [0, 1] }],
    };

    it("404s a disabled problem with the same generic shape as 'not found', before touching Judge0", async () => {
      Problem.findOne.mockResolvedValue(disabledProblem);

      await submitHandler({ body, log: mockLog(), userDoc: { _id: "u1" } }, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: `Problem "two-sum" not found.` });
      expect(callJudge0).not.toHaveBeenCalled();
    });

    it("still grades an enabled problem normally", async () => {
      Problem.findOne.mockResolvedValue(enabledProblem);
      callJudge0.mockResolvedValue({ stdout: JSON.stringify([0, 1]), stderr: null, compile_output: null });

      await submitHandler({ body, log: mockLog(), userDoc: { _id: "u1" } }, res);

      expect(res.status).not.toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: "Accepted" }));
    });
  });

  describe("runHandler", () => {
    const body = {
      problemSlug: "two-sum",
      code: "def twoSum(a): return a",
      language: "python",
      testcases: [{ input: { nums: [2, 7] }, expectedOutput: [0, 1] }],
    };

    it("404s a disabled problem with the same generic shape as 'not found', before touching Judge0", async () => {
      Problem.findOne.mockResolvedValue(disabledProblem);

      await runHandler({ body, log: mockLog(), userDoc: { _id: "u1" } }, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: `Problem "two-sum" not found.` })
      );
      expect(callJudge0).not.toHaveBeenCalled();
    });

    it("still runs an enabled problem normally", async () => {
      Problem.findOne.mockResolvedValue(enabledProblem);
      callJudge0.mockResolvedValue({ stdout: JSON.stringify([0, 1]), stderr: null, compile_output: null });

      await runHandler({ body, log: mockLog(), userDoc: { _id: "u1" } }, res);

      expect(res.status).not.toHaveBeenCalledWith(404);
    });
  });
});
