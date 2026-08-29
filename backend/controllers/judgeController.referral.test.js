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
vi.mock("../services/referralQualification.js", () => ({
  qualifyReferralIfFirstSolve: vi.fn(),
}));

import Problem from "../models/Problem.js";
import { callJudge0 } from "../controllers/compilerController.js";
import { recordVerifiedSubmission } from "../controllers/submissionController.js";
import { qualifyReferralIfFirstSolve } from "../services/referralQualification.js";
import { submitHandler } from "../controllers/judgeController.js";

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

describe("submitHandler — Referral Qualification hook (Plan 2)", () => {
  let res, userDoc;

  beforeEach(() => {
    vi.clearAllMocks();
    res = mockRes();
    userDoc = { _id: "user1" };
    recordVerifiedSubmission.mockResolvedValue({ _id: "sub1" });
  });

  it("checks referral qualification only when the SERVER itself computed Accepted — never for a Wrong Answer, even if a malicious client sent extra fields", async () => {
    Problem.findOne.mockResolvedValue(problemDoc);
    callJudge0.mockResolvedValue({ stdout: JSON.stringify([9, 9]), stderr: null, compile_output: null });
    const req = { body: { ...baseBody, qualified: true }, log: mockLog(), userDoc };

    await submitHandler(req, res);

    expect(qualifyReferralIfFirstSolve).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: "Wrong Answer" }));
  });

  it("calls qualifyReferralIfFirstSolve with the real persisted submission id, on a genuine Accepted verdict", async () => {
    Problem.findOne.mockResolvedValue(problemDoc);
    callJudge0.mockResolvedValue({ stdout: JSON.stringify([0, 1]), stderr: null, compile_output: null });
    recordVerifiedSubmission.mockResolvedValue({ _id: "realSubmissionId1" });
    qualifyReferralIfFirstSolve.mockResolvedValue({ qualified: true });
    const req = { body: baseBody, log: mockLog(), userDoc };

    await submitHandler(req, res);

    expect(qualifyReferralIfFirstSolve).toHaveBeenCalledWith({
      userId: "user1",
      submissionId: "realSubmissionId1",
    });
  });

  it("does NOT check referral qualification for an Accepted CONTEST submission (practice-only scope)", async () => {
    Problem.findOne.mockResolvedValue(problemDoc);
    callJudge0.mockResolvedValue({ stdout: JSON.stringify([0, 1]), stderr: null, compile_output: null });
    const req = {
      body: { ...baseBody, contestId: "507f1f77bcf86cd799439011" },
      log: mockLog(),
      userDoc,
    };

    await submitHandler(req, res);

    expect(qualifyReferralIfFirstSolve).not.toHaveBeenCalled();
  });

  it("does NOT check referral qualification for an Accepted Battle Room submission (practice-only scope)", async () => {
    Problem.findOne.mockResolvedValue(problemDoc);
    callJudge0.mockResolvedValue({ stdout: JSON.stringify([0, 1]), stderr: null, compile_output: null });
    const req = {
      body: { ...baseBody, battleRoomId: "507f1f77bcf86cd799439011" },
      log: mockLog(),
      userDoc,
    };

    await submitHandler(req, res);

    expect(qualifyReferralIfFirstSolve).not.toHaveBeenCalled();
  });

  it("DOES check referral qualification for a genuine practice Accepted submission (no contestId, no battleRoomId)", async () => {
    Problem.findOne.mockResolvedValue(problemDoc);
    callJudge0.mockResolvedValue({ stdout: JSON.stringify([0, 1]), stderr: null, compile_output: null });
    qualifyReferralIfFirstSolve.mockResolvedValue({ qualified: true });
    const req = { body: baseBody, log: mockLog(), userDoc };

    await submitHandler(req, res);

    expect(qualifyReferralIfFirstSolve).toHaveBeenCalledTimes(1);
  });

  it("does not attempt qualification if Submission persistence itself failed (no submissionId to correlate)", async () => {
    Problem.findOne.mockResolvedValue(problemDoc);
    callJudge0.mockResolvedValue({ stdout: JSON.stringify([0, 1]), stderr: null, compile_output: null });
    recordVerifiedSubmission.mockResolvedValue(null); // simulated persistence failure
    const req = { body: baseBody, log: mockLog(), userDoc };

    await submitHandler(req, res);

    expect(qualifyReferralIfFirstSolve).not.toHaveBeenCalled();
  });

  it("still returns the real Accepted verdict even if qualifyReferralIfFirstSolve itself throws — a qualification-check failure must not fail the submission", async () => {
    Problem.findOne.mockResolvedValue(problemDoc);
    callJudge0.mockResolvedValue({ stdout: JSON.stringify([0, 1]), stderr: null, compile_output: null });
    qualifyReferralIfFirstSolve.mockRejectedValue(new Error("Mongo write failed"));
    const req = { body: baseBody, log: mockLog(), userDoc };

    await submitHandler(req, res);

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: "Accepted" }));
    expect(req.log.error).toHaveBeenCalled();
  });

  it("does not include referral/reward information in the response payload — it's not the submitter's own reward status to see synchronously here", async () => {
    Problem.findOne.mockResolvedValue(problemDoc);
    callJudge0.mockResolvedValue({ stdout: JSON.stringify([0, 1]), stderr: null, compile_output: null });
    qualifyReferralIfFirstSolve.mockResolvedValue({ qualified: true });
    const req = { body: baseBody, log: mockLog(), userDoc };

    await submitHandler(req, res);

    const jsonArg = res.json.mock.calls[0][0];
    expect(jsonArg.referral).toBeUndefined();
    expect(jsonArg.qualified).toBeUndefined();
  });

  it("does NOT check referral qualification for a guest (no req.userDoc)", async () => {
    Problem.findOne.mockResolvedValue(problemDoc);
    callJudge0.mockResolvedValue({ stdout: JSON.stringify([0, 1]), stderr: null, compile_output: null });
    const req = { body: baseBody, log: mockLog(), userDoc: null };

    await submitHandler(req, res);

    expect(qualifyReferralIfFirstSolve).not.toHaveBeenCalled();
    expect(recordVerifiedSubmission).not.toHaveBeenCalled();
  });
});
