import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("../models/Problem.js", () => ({
  default: { findOne: vi.fn() },
}));
vi.mock("../controllers/compilerController.js", async (importOriginal) => {
  const actual = await importOriginal();

  return {
    ...actual,
    callJudge0: vi.fn(),
  };
});
vi.mock("../controllers/submissionController.js", () => ({
  recordVerifiedSubmission: vi.fn().mockResolvedValue({ _id: "sub1" }),
}));

import Problem from "../models/Problem.js";
import { callJudge0 } from "../controllers/compilerController.js";
import { recordVerifiedSubmission } from "../controllers/submissionController.js";
import { submitHandler } from "./judge.js";

function mockRes() {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

function mockLog() {
  return {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  };
}

const baseBody = {
  problemSlug: "two-sum",
  code: "def twoSum(a): return a",
  language: "python",
  functionName: "twoSum",
  visibletestcases: [
    { input: { nums: [2, 7] }, expectedOutput: [0, 1] },
  ],
};

const problemDoc = {
  slug: "two-sum",
  title: "Two Sum",
  hiddentestcases: [
    { input: { nums: [3, 3] }, expectedOutput: [0, 1] },
  ],
};

describe("submitHandler", () => {
  let res;
  let userDoc;

  beforeEach(() => {
    vi.clearAllMocks();
    res = mockRes();
    userDoc = { _id: "user1" };
  });

  it("returns 404 when the problem doesn't exist", async () => {
    Problem.findOne.mockResolvedValue(null);
    const req = { body: baseBody, log: mockLog(), userDoc };

    await submitHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(recordVerifiedSubmission).not.toHaveBeenCalled();
  });

  it("returns 404 (not a silent Accepted) when no hidden testcases are configured", async () => {
    // This is the scenario the inline "CRITICAL GUARD" comment in
    // judge.js exists to prevent: a problem with zero gradeable
    // testcases must never be reachable as an "Accepted" verdict.
    Problem.findOne.mockResolvedValue({ ...problemDoc, hiddentestcases: [] });
    const req = { body: baseBody, log: mockLog(), userDoc };

    await submitHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.stringMatching(/hidden testcases/i) })
    );
    expect(recordVerifiedSubmission).not.toHaveBeenCalled();
    expect(callJudge0).not.toHaveBeenCalled();
  });

  it("returns Accepted and persists a Submission with status Accepted when every testcase passes", async () => {
    Problem.findOne.mockResolvedValue(problemDoc);
    callJudge0.mockResolvedValue({
      stdout: JSON.stringify([0, 1]),
      stderr: null,
      compile_output: null,
    });
    const req = { body: baseBody, log: mockLog(), userDoc };

    await submitHandler(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ status: "Accepted", passed: 2, total: 2 })
    );
    expect(recordVerifiedSubmission).toHaveBeenCalledOnce();
    expect(recordVerifiedSubmission).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user1",
        problemSlug: "two-sum",
        problemTitle: "Two Sum",
        status: "Accepted",
        passed: 2,
        total: 2,
      })
    );
  });

  it("awaits persistence before responding (ordering guarantee for the progress-verification race)", async () => {
    Problem.findOne.mockResolvedValue(problemDoc);
    callJudge0.mockResolvedValue({ stdout: JSON.stringify([0, 1]), stderr: null, compile_output: null });

    const order = [];
    recordVerifiedSubmission.mockImplementation(async () => {
      order.push("persisted");
    });
    res.json.mockImplementation((body) => {
      order.push("responded");
      return res;
    });

    const req = { body: baseBody, log: mockLog(), userDoc };
    await submitHandler(req, res);

    expect(order).toEqual(["persisted", "responded"]);
  });

  it("returns Wrong Answer with expected/actual output for a failing VISIBLE testcase, and persists it", async () => {
    Problem.findOne.mockResolvedValue(problemDoc);
    callJudge0.mockResolvedValue({
      stdout: JSON.stringify([9, 9]), // wrong
      stderr: null,
      compile_output: null,
    });
    const req = { body: baseBody, log: mockLog(), userDoc };

    await submitHandler(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "Wrong Answer",
        expectedOutput: [0, 1],
      })
    );
    expect(recordVerifiedSubmission).toHaveBeenCalledWith(
      expect.objectContaining({ status: "Wrong Answer" })
    );
  });

  it("does not attempt to persist when req.userDoc is absent (e.g. Mongo unavailable)", async () => {
    Problem.findOne.mockResolvedValue(problemDoc);
    callJudge0.mockResolvedValue({ stdout: JSON.stringify([0, 1]), stderr: null, compile_output: null });
    const req = { body: baseBody, log: mockLog(), userDoc: undefined };

    await submitHandler(req, res);

    expect(recordVerifiedSubmission).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: "Accepted" }));
  });

  it("still returns a response (Judge Error, not a crash) when recordVerifiedSubmission itself throws", async () => {
    Problem.findOne.mockResolvedValue(problemDoc);
    callJudge0.mockResolvedValue({ stdout: JSON.stringify([0, 1]), stderr: null, compile_output: null });
    recordVerifiedSubmission.mockRejectedValue(new Error("Mongo write failed"));
    const req = { body: baseBody, log: mockLog(), userDoc };

    await submitHandler(req, res);

    // A persistence failure must not be surfaced as a fake grading
    // failure to the user — the grading result itself was real and
    // already computed; only the (best-effort) history write failed.
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ status: "Accepted" })
    );
    expect(req.log.error).toHaveBeenCalled();
  });
});
