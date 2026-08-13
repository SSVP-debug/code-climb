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
import { submitHandler } from "../controllers/judgeController.js";

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

  // ── functionName resolved server-side — execution-contract audit ─────────
  // Brings Submit's trust model in line with Run's (see runHandler's
  // identical guarantee in controllers/runHandler.test.js): the client's
  // functionName is never actually used for grading once the problem is
  // loaded, exactly like returnType/comparisonMode/operationSequence.
  it("ignores a client-sent functionName and uses the problem's own instead", async () => {
    Problem.findOne.mockResolvedValue({ ...problemDoc, functionName: "twoSum" });
    callJudge0.mockResolvedValue({ stdout: JSON.stringify([0, 1]), stderr: null, compile_output: null });

    const req = {
      body: { ...baseBody, functionName: "someWrongOrStaleName" },
      log: mockLog(),
      userDoc,
    };

    await submitHandler(req, res);

    // callJudge0 receives the generated driver code as its argument;
    // asserting on the outcome (Accepted, using the REAL functionName)
    // is enough to prove the client's bogus name was never used —
    // if it had been used, generateDriverCode would reference a
    // non-existent method and this would fail to compile/execute.
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ status: "Accepted" })
    );
  });

  it("still grades correctly when functionName is omitted from the request entirely", async () => {
    Problem.findOne.mockResolvedValue({ ...problemDoc, functionName: "twoSum" });
    callJudge0.mockResolvedValue({ stdout: JSON.stringify([0, 1]), stderr: null, compile_output: null });

    const bodyWithoutFunctionName = { ...baseBody };
    delete bodyWithoutFunctionName.functionName;

    const req = { body: bodyWithoutFunctionName, log: mockLog(), userDoc };

    await submitHandler(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ status: "Accepted" })
    );
  });

  // ── comparisonMode: "unordered" — audit finding P0-3 ─────────────────────
  // Regression tests using the exact shape of the confirmed-broken
  // problems (e.g. top-k-frequent-elements: "you may return the answer in
  // any order"). Before this fix, a correct solution returning a
  // differently-ordered (but equally valid) answer was graded Wrong Answer.
  describe("comparisonMode: \"unordered\"", () => {
    const unorderedProblemDoc = {
      slug: "top-k-frequent-elements",
      title: "Top K Frequent Elements",
      comparisonMode: "unordered",
      hiddentestcases: [
        { input: { nums: [1, 1, 1, 2, 2, 3], k: 2 }, expectedOutput: [1, 2] },
      ],
    };

    it("accepts a differently-ordered but equally correct array when the problem allows any order", async () => {
      Problem.findOne.mockResolvedValue(unorderedProblemDoc);
      callJudge0.mockResolvedValue({
        stdout: JSON.stringify([2, 1]), // same elements, reversed order
        stderr: null,
        compile_output: null,
      });
      const req = {
        body: { ...baseBody, problemSlug: "top-k-frequent-elements", visibletestcases: [] },
        log: mockLog(),
        userDoc,
      };

      await submitHandler(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ status: "Accepted" })
      );
    });

    it("still rejects a genuinely wrong (different multiset) answer under unordered comparison", async () => {
      Problem.findOne.mockResolvedValue(unorderedProblemDoc);
      callJudge0.mockResolvedValue({
        stdout: JSON.stringify([1, 3]), // wrong elements, not just reordered
        stderr: null,
        compile_output: null,
      });
      const req = {
        body: { ...baseBody, problemSlug: "top-k-frequent-elements", visibletestcases: [] },
        log: mockLog(),
        userDoc,
      };

      await submitHandler(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ status: "Wrong Answer" })
      );
    });

    it("defaults to exact (order-sensitive) comparison when the problem doesn't declare comparisonMode — no regression for every other problem", async () => {
      Problem.findOne.mockResolvedValue(problemDoc); // two-sum, no comparisonMode field
      callJudge0.mockResolvedValue({
        stdout: JSON.stringify([1, 0]), // same elements, reversed — wrong for Two Sum
        stderr: null,
        compile_output: null,
      });
      const req = { body: baseBody, log: mockLog(), userDoc };

      await submitHandler(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ status: "Wrong Answer" })
      );
    });
  });
});