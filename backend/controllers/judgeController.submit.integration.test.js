import { describe, expect, it, vi, beforeAll, beforeEach, afterEach, afterAll } from "vitest";
import { startTestMongo, clearTestMongo, stopTestMongo } from "../test/mongoMemoryServer.js";

// ── P0 workflows: Submit → Submission, and Forged Accepted Result ────────
//
// Exercises submitHandler against REAL Problem/Submission/User documents
// in Mongo — the only mocked boundary is Judge0 itself (callJudge0), which
// is the actual external I/O call submitHandler makes. Everything else
// (Problem lookup, testcase assembly, verdict computation, Submission
// persistence via recordVerifiedSubmission) runs for real, so this proves
// the whole chain of layers actually works together — not just that each
// layer's own mocked unit tests pass in isolation (see routes/judge.test.js
// for that mocked-model tier; this file is the real-Mongo counterpart).

const callJudge0 = vi.fn();

vi.mock("../controllers/compilerController.js", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, callJudge0 };
});

const { submitHandler } = await import("./judgeController.js");
const { default: Submission } = await import("../models/Submission.js");
const { default: User } = await import("../models/User.js");
const { seedProblem: seedBaseProblem } = await import("../test/fixtures/problem.js");

function mockRes() {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

function mockLog() {
  return { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() };
}

// This file's own default test data (specific input/expectedOutput) layered
// on top of the shared, schema-complete base fixture — see
// test/fixtures/problem.js for why the base fixture exists as a single
// source of truth rather than being duplicated here.
async function seedProblem(overrides = {}) {
  return seedBaseProblem({
    hiddentestcases: [
      { input: { nums: [3, 3], target: 6 }, expectedOutput: [0, 1] },
    ],
    ...overrides,
  });
}

async function seedUser(overrides = {}) {
  return User.create({
    firebaseUid: `fb-${Math.random().toString(36).slice(2)}`,
    email: "solver@test.com",
    ...overrides,
  });
}

function baseReq({ userDoc, body }) {
  return {
    body,
    userDoc,
    log: mockLog(),
  };
}

describe("Submit → Submission workflow (real Mongo, mocked Judge0)", () => {
  beforeAll(async () => {
    await startTestMongo();
  }, 60_000);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await clearTestMongo();
  });

  afterAll(async () => {
    await stopTestMongo();
  });

  it("persists a real Accepted Submission with correct fields when Judge0 genuinely passes every testcase", async () => {
    const problem = await seedProblem();
    const user = await seedUser();

    // Only one hidden testcase configured above, and visibletestcases is
    // empty, so a single passing Judge0 call is enough for the whole
    // submission to resolve Accepted.
    callJudge0.mockResolvedValue({ stdout: JSON.stringify([0, 1]), stderr: "", compile_output: "" });

    const req = baseReq({
      userDoc: user,
      body: {
        problemSlug: problem.slug,
        code: "def twoSum(nums, target): return [0, 1]",
        language: "python",
        visibletestcases: [],
      },
    });
    const res = mockRes();

    await submitHandler(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ status: "Accepted" })
    );

    const stored = await Submission.findOne({ userId: user._id, problemSlug: problem.slug }).lean();
    expect(stored).toBeTruthy();
    expect(stored.userId.toString()).toBe(user._id.toString());
    expect(stored.problemSlug).toBe("two-sum");
    expect(stored.language).toBe("python");
    expect(stored.status).toBe("Accepted");
    expect(stored.passed).toBe(1);
    expect(stored.total).toBe(1);
  });

  it("persists a real Wrong Answer Submission when Judge0's actual output doesn't match expected", async () => {
    const problem = await seedProblem();
    const user = await seedUser();

    callJudge0.mockResolvedValue({ stdout: JSON.stringify([9, 9]), stderr: "", compile_output: "" });

    const req = baseReq({
      userDoc: user,
      body: {
        problemSlug: problem.slug,
        code: "def twoSum(nums, target): return [9, 9]",
        language: "python",
        visibletestcases: [],
      },
    });
    const res = mockRes();

    await submitHandler(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ status: "Wrong Answer" })
    );

    const stored = await Submission.findOne({ userId: user._id, problemSlug: problem.slug }).lean();
    expect(stored.status).toBe("Wrong Answer");
    expect(stored.passed).toBe(0);
  });

  it("resolves the execution contract (functionName/languageId) from the stored Problem, not from the request body", async () => {
    const problem = await seedProblem({
      id: 2,
      slug: "two-sum-contract",
      functionName: "realFunctionName",
    });
    const user = await seedUser();

    callJudge0.mockResolvedValue({ stdout: JSON.stringify([0, 1]), stderr: "", compile_output: "" });

    const req = baseReq({
      userDoc: user,
      body: {
        problemSlug: problem.slug,
        code: "irrelevant",
        language: "python",
        visibletestcases: [],
        // Attempt to smuggle a different function name — submitHandler
        // must ignore this and use problem.functionName instead.
        functionName: "attackerControlledName",
      },
    });
    const res = mockRes();

    await submitHandler(req, res);

    expect(callJudge0).toHaveBeenCalledWith(
      expect.objectContaining({ functionName: "realFunctionName" })
    );
  });
});

describe("Forged Accepted Result — client-supplied status is never trusted", () => {
  beforeAll(async () => {
    await startTestMongo();
  }, 60_000);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await clearTestMongo();
  });

  afterAll(async () => {
    await stopTestMongo();
  });

  it("ignores a forged status:'Accepted' in the request body when Judge0 actually returns a wrong answer", async () => {
    const problem = await seedProblem();
    const user = await seedUser();

    // Judge0 genuinely disagrees with the code.
    callJudge0.mockResolvedValue({ stdout: JSON.stringify([9, 9]), stderr: "", compile_output: "" });

    const req = baseReq({
      userDoc: user,
      body: {
        problemSlug: problem.slug,
        code: "def twoSum(nums, target): return [9, 9]",
        language: "python",
        visibletestcases: [],
        // The forged claim — submitHandler never destructures `status`
        // from req.body at all, so this must have zero effect.
        status: "Accepted",
        passed: 999,
        total: 999,
      },
    });
    const res = mockRes();

    await submitHandler(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ status: "Wrong Answer" })
    );

    const stored = await Submission.findOne({ userId: user._id, problemSlug: problem.slug }).lean();
    expect(stored.status).toBe("Wrong Answer");
    expect(stored.status).not.toBe("Accepted");
    // The forged passed/total values must not leak into the persisted row.
    expect(stored.passed).toBe(0);
    expect(stored.total).toBe(1);
  });

  it("never creates an Accepted Submission via any client-controlled field, even when Judge0 itself errors", async () => {
    const problem = await seedProblem();
    const user = await seedUser();

    callJudge0.mockRejectedValue(new Error("Judge0 unreachable"));

    const req = baseReq({
      userDoc: user,
      body: {
        problemSlug: problem.slug,
        code: "anything",
        language: "python",
        visibletestcases: [],
        status: "Accepted",
      },
    });
    const res = mockRes();

    await submitHandler(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ status: "Judge Error" })
    );

    const acceptedCount = await Submission.countDocuments({
      userId: user._id,
      problemSlug: problem.slug,
      status: "Accepted",
    });
    expect(acceptedCount).toBe(0);
  });
});