// Content & Execution Architecture, Phase 3 — Problem.hiddenTestcaseSet
// must be a real enable/disable switch: disabling it must fail Submit
// CLOSED (never grade only visible tests, never return Accepted), and
// distinctly from the pre-existing "no hidden testcases configured" 404.
// Run must be entirely unaffected either way. Mirrors
// judgeController.enabled.test.js's mocking conventions exactly.
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

const baseBody = {
  problemSlug: "two-sum",
  code: "def twoSum(a): return a",
  language: "python",
  visibletestcases: [{ input: { nums: [2, 7] }, expectedOutput: [0, 1] }],
};

const runBody = {
  problemSlug: "two-sum",
  code: "def twoSum(a): return a",
  language: "python",
  testcases: [{ input: { nums: [2, 7] }, expectedOutput: [0, 1] }],
};

function makeProblem(hiddenTestcaseSetOverrides = {}) {
  return {
    slug: "two-sum",
    title: "Two Sum",
    visibility: "public",
    enabled: true,
    hiddenTestcaseSet: {
      enabled: true,
      testcases: [{ input: { nums: [3, 3] }, expectedOutput: [0, 1] }],
      ...hiddenTestcaseSetOverrides,
    },
  };
}

describe("hiddenTestcaseSet — fail-closed Submit gate (Content & Execution Architecture, Phase 3)", () => {
  let res;

  beforeEach(() => {
    vi.clearAllMocks();
    res = mockRes();
  });

  it("fails CLOSED with a distinct 503 when the set is disabled — never grades, never touches Judge0", async () => {
    Problem.findOne.mockResolvedValue(makeProblem({ enabled: false }));

    await submitHandler({ body: baseBody, log: mockLog(), userDoc: { _id: "u1" } }, res);

    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith({
      error: `Grading is temporarily unavailable for "two-sum".`,
      code: "HIDDEN_TESTCASES_DISABLED",
    });
    expect(callJudge0).not.toHaveBeenCalled();
  });

  it("does NOT fall back to grading only the visible testcases when disabled", async () => {
    // If this regressed to a "grade visible only" fallback, callJudge0
    // would be invoked with the single visible testcase and return some
    // verdict — asserting zero calls catches that regression directly,
    // not just the response shape.
    Problem.findOne.mockResolvedValue(makeProblem({ enabled: false }));
    callJudge0.mockResolvedValue({ stdout: JSON.stringify([0, 1]), stderr: null, compile_output: null });

    await submitHandler({ body: baseBody, log: mockLog(), userDoc: { _id: "u1" } }, res);

    expect(callJudge0).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalledWith(expect.objectContaining({ status: "Accepted" }));
  });

  it("logs the disabled condition so operators can discover grading has been turned off", async () => {
    Problem.findOne.mockResolvedValue(makeProblem({ enabled: false }));
    const log = mockLog();

    await submitHandler({ body: baseBody, log, userDoc: { _id: "u1" } }, res);

    expect(log.error).toHaveBeenCalledWith(
      { problemSlug: "two-sum" },
      expect.stringMatching(/hiddenTestcaseSet is disabled/i)
    );
  });

  it("stays distinct from the pre-existing 'no hidden testcases configured' 404 (an enabled set with zero testcases)", async () => {
    Problem.findOne.mockResolvedValue(makeProblem({ enabled: true, testcases: [] }));

    await submitHandler({ body: baseBody, log: mockLog(), userDoc: { _id: "u1" } }, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: `No hidden testcases configured for "two-sum".`,
    });
  });

  it("treats a pre-Phase-3 document with no hiddenTestcaseSet at all as enabled (no forced migration timing)", async () => {
    Problem.findOne.mockResolvedValue({
      slug: "two-sum",
      title: "Two Sum",
      visibility: "public",
      enabled: true,
      hiddentestcases: [{ input: { nums: [3, 3] }, expectedOutput: [0, 1] }], // legacy shape, un-migrated
    });
    callJudge0.mockResolvedValue({ stdout: JSON.stringify([0, 1]), stderr: null, compile_output: null });

    await submitHandler({ body: baseBody, log: mockLog(), userDoc: { _id: "u1" } }, res);

    // Un-migrated documents have no `hiddenTestcaseSet.testcases` to grade
    // against yet — correctly falls through to the pre-existing "no
    // hidden testcases configured" 404 (not the disabled-503), matching
    // "missing hiddenTestcaseSet means enabled" but "empty means nothing
    // to grade" — exactly the same two-guard order as an enabled set with
    // zero testcases above. This is expected: un-migrated documents
    // should be migrated (scripts/migrateHiddenTestcaseSet.js) before
    // relying on Submit for them.
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: `No hidden testcases configured for "two-sum".`,
    });
  });

  it("still grades normally end-to-end when the set is enabled (no regression)", async () => {
    Problem.findOne.mockResolvedValue(makeProblem());
    callJudge0.mockResolvedValue({ stdout: JSON.stringify([0, 1]), stderr: null, compile_output: null });

    await submitHandler({ body: baseBody, log: mockLog(), userDoc: { _id: "u1" } }, res);

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: "Accepted" }));
  });
});

describe("hiddenTestcaseSet — Run is entirely unaffected either way", () => {
  let res;

  beforeEach(() => {
    vi.clearAllMocks();
    res = mockRes();
  });

  it("Run succeeds even when hiddenTestcaseSet is disabled — Run never reads hidden testcases", async () => {
    Problem.findOne.mockResolvedValue(makeProblem({ enabled: false }));
    callJudge0.mockResolvedValue({ stdout: JSON.stringify([0, 1]), stderr: null, compile_output: null });

    await runHandler({ body: runBody, log: mockLog(), userDoc: { _id: "u1" } }, res);

    expect(res.status).not.toHaveBeenCalledWith(503);
    expect(res.status).not.toHaveBeenCalledWith(404);
  });
});
