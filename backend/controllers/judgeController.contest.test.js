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
vi.mock("../services/contestProblemAccess.js", () => ({
  canAccessContestProblem: vi.fn(),
}));

import Problem from "../models/Problem.js";
import { callJudge0 } from "../controllers/compilerController.js";
import { recordVerifiedSubmission } from "../controllers/submissionController.js";
import { awardContestSolve } from "../services/contestScoring.js";
import { canAccessContestProblem } from "../services/contestProblemAccess.js";
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

const baseBody = {
  problemSlug: "two-sum",
  code: "def twoSum(a): return a",
  language: "python",
  functionName: "twoSum",
  visibletestcases: [{ input: { nums: [2, 7] }, expectedOutput: [0, 1] }],
};

const problemDoc = {
  slug: "two-sum",
  title: "Two Sum",
  visibility: "public",
  hiddenTestcaseSet: { enabled: true, testcases: [{ input: { nums: [3, 3] }, expectedOutput: [0, 1] }] },
};

describe("submitHandler — contest scoring (Fest Readiness Audit, P0-1)", () => {
  let res, userDoc;

  beforeEach(() => {
    vi.clearAllMocks();
    res = mockRes();
    userDoc = { _id: "user1" };
  });

  it("does NOT attempt contest scoring for an ordinary practice submission (no contestId)", async () => {
    Problem.findOne.mockResolvedValue(problemDoc);
    callJudge0.mockResolvedValue({ stdout: JSON.stringify([0, 1]), stderr: null, compile_output: null });
    const req = { body: baseBody, log: mockLog(), userDoc };

    await submitHandler(req, res);

    expect(awardContestSolve).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: "Accepted" }));
    const jsonArg = res.json.mock.calls[0][0];
    expect(jsonArg.contest).toBeUndefined();
  });

  it("attempts contest scoring only when the SERVER itself computed Accepted, and forwards contestId to recordVerifiedSubmission", async () => {
    Problem.findOne.mockResolvedValue(problemDoc);
    callJudge0.mockResolvedValue({ stdout: JSON.stringify([0, 1]), stderr: null, compile_output: null });
    awardContestSolve.mockResolvedValue({ ok: true, alreadySolved: false, score: 100 });
    // A realistic ObjectId-shaped string, not the file's usual "contest1"
    // placeholder — this specific test asserts what recordVerifiedSubmission
    // receives, and (integration-audit fix) that call now validates
    // contestId is a real ObjectId before persisting it, so a fake
    // non-ObjectId placeholder would be correctly nulled out here. The
    // scoring call (awardContestSolve) is unaffected either way — it
    // always receives the raw, unsanitized value.
    const contestId = "64a000000000000000000001";
    const req = { body: { ...baseBody, contestId }, log: mockLog(), userDoc };

    await submitHandler(req, res);

    expect(awardContestSolve).toHaveBeenCalledWith({
      contestId,
      userId: "user1",
      slug: "two-sum",
    });
    expect(recordVerifiedSubmission).toHaveBeenCalledWith(
      expect.objectContaining({ contestId, status: "Accepted" })
    );
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "Accepted",
        contest: { scored: true, alreadySolved: false, score: 100 },
      })
    );
  });

  it("does NOT attempt contest scoring for a Wrong Answer, even with a contestId present (an unsuccessful judge result is not a solve)", async () => {
    Problem.findOne.mockResolvedValue(problemDoc);
    callJudge0.mockResolvedValue({ stdout: JSON.stringify([9, 9]), stderr: null, compile_output: null });
    const req = { body: { ...baseBody, contestId: "contest1" }, log: mockLog(), userDoc };

    await submitHandler(req, res);

    expect(awardContestSolve).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: "Wrong Answer" }));
  });

  it("surfaces a non-scoring reason (e.g. contest ended mid-submission) without failing the grading response", async () => {
    Problem.findOne.mockResolvedValue(problemDoc);
    callJudge0.mockResolvedValue({ stdout: JSON.stringify([0, 1]), stderr: null, compile_output: null });
    awardContestSolve.mockResolvedValue({ ok: false, reason: "contest_not_active" });
    const req = { body: { ...baseBody, contestId: "contest1" }, log: mockLog(), userDoc };

    await submitHandler(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "Accepted",
        contest: { scored: false, reason: "contest_not_active" },
      })
    );
  });

  it("still returns the real Accepted verdict even if awardContestSolve itself throws", async () => {
    Problem.findOne.mockResolvedValue(problemDoc);
    callJudge0.mockResolvedValue({ stdout: JSON.stringify([0, 1]), stderr: null, compile_output: null });
    awardContestSolve.mockRejectedValue(new Error("Mongo write failed"));
    const req = { body: { ...baseBody, contestId: "contest1" }, log: mockLog(), userDoc };

    await submitHandler(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ status: "Accepted", contest: { scored: false, reason: "error" } })
    );
    expect(req.log.error).toHaveBeenCalled();
  });

  it("idempotent duplicate Accepted: second scoring attempt reports alreadySolved without a fresh error", async () => {
    Problem.findOne.mockResolvedValue(problemDoc);
    callJudge0.mockResolvedValue({ stdout: JSON.stringify([0, 1]), stderr: null, compile_output: null });
    awardContestSolve.mockResolvedValue({ ok: true, alreadySolved: true, score: 100 });
    const req = { body: { ...baseBody, contestId: "contest1" }, log: mockLog(), userDoc };

    await submitHandler(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ contest: { scored: true, alreadySolved: true, score: 100 } })
    );
  });
});

describe("submitHandler — contest problem access gate (Fest Readiness Audit, P0-2)", () => {
  let res, userDoc;

  beforeEach(() => {
    vi.clearAllMocks();
    res = mockRes();
    userDoc = { _id: "user1" };
  });

  it("rejects a direct Submit for a contest-only problem the caller isn't entitled to yet, with a generic 404", async () => {
    Problem.findOne.mockResolvedValue({ ...problemDoc, visibility: "contest" });
    canAccessContestProblem.mockResolvedValue(false);
    const req = { body: baseBody, log: mockLog(), userDoc };

    await submitHandler(req, res);

    expect(canAccessContestProblem).toHaveBeenCalledWith("two-sum", userDoc);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(callJudge0).not.toHaveBeenCalled();
    expect(recordVerifiedSubmission).not.toHaveBeenCalled();
  });

  it("allows Submit for a contest-only problem once the caller is entitled (active participant / organizer / contest ended)", async () => {
    Problem.findOne.mockResolvedValue({ ...problemDoc, visibility: "contest" });
    canAccessContestProblem.mockResolvedValue(true);
    callJudge0.mockResolvedValue({ stdout: JSON.stringify([0, 1]), stderr: null, compile_output: null });
    const req = { body: baseBody, log: mockLog(), userDoc };

    await submitHandler(req, res);

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: "Accepted" }));
  });

  it("never calls the contest-access check at all for an ordinary public problem (no regression / no extra Mongo round trip)", async () => {
    Problem.findOne.mockResolvedValue(problemDoc); // visibility: "public"
    callJudge0.mockResolvedValue({ stdout: JSON.stringify([0, 1]), stderr: null, compile_output: null });
    const req = { body: baseBody, log: mockLog(), userDoc };

    await submitHandler(req, res);

    expect(canAccessContestProblem).not.toHaveBeenCalled();
  });
});

describe("runHandler — contest problem access gate (Fest Readiness Audit, P0-2)", () => {
  let res, userDoc;

  const runBody = {
    problemSlug: "two-sum",
    code: "def twoSum(a): return a",
    language: "python",
    functionName: "twoSum",
    testcases: [{ input: { nums: [2, 7] }, expectedOutput: [0, 1] }],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    res = mockRes();
    userDoc = { _id: "user1" };
  });

  it("rejects a direct Run for a contest-only problem before the caller is entitled, with a generic 404", async () => {
    Problem.findOne.mockResolvedValue({ ...problemDoc, visibility: "contest" });
    canAccessContestProblem.mockResolvedValue(false);
    const req = { body: runBody, log: mockLog(), userDoc };

    await runHandler(req, res);

    expect(canAccessContestProblem).toHaveBeenCalledWith("two-sum", userDoc);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(callJudge0).not.toHaveBeenCalled();
  });

  it("allows Run for a contest-only problem once the caller is entitled", async () => {
    Problem.findOne.mockResolvedValue({ ...problemDoc, visibility: "contest" });
    canAccessContestProblem.mockResolvedValue(true);
    callJudge0.mockResolvedValue({ stdout: JSON.stringify([0, 1]), stderr: null, compile_output: null });
    const req = { body: runBody, log: mockLog(), userDoc };

    await runHandler(req, res);

    expect(res.status).not.toHaveBeenCalledWith(404);
  });

  it("skips the contest-access check entirely when no problemSlug is sent (scratch/no-problem Run)", async () => {
    const req = {
      body: {
        code: "def f(): pass",
        language: "python",
        functionName: "f",
        testcases: [{ input: {}, expectedOutput: null }],
      },
      log: mockLog(),
      userDoc,
    };
    callJudge0.mockResolvedValue({ stdout: "null", stderr: null, compile_output: null });

    await runHandler(req, res);

    expect(Problem.findOne).not.toHaveBeenCalled();
    expect(canAccessContestProblem).not.toHaveBeenCalled();
  });
});