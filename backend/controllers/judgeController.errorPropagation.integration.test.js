import { describe, expect, it, vi, beforeAll, beforeEach, afterEach, afterAll } from "vitest";
import { startTestMongo, clearTestMongo, stopTestMongo } from "../test/mongoMemoryServer.js";

// ── P0 workflow: Error propagation (Judge0 unavailable → controller → ────
// ── service → HTTP response) ──────────────────────────────────────────
//
// Judge0 is mocked (the genuine external boundary); Problem/Submission/
// User/Contest/BattleRoom are all real Mongo. Verifies: a controlled
// status is always returned (never a hang, never an unhandled 5xx crash),
// no internal/infra details leak into the client-facing response, and a
// scoring-side failure (bad contestId/battleRoomId) degrades gracefully
// without corrupting the already-computed, already-correct verdict.

const callJudge0 = vi.fn();

vi.mock("../controllers/compilerController.js", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, callJudge0 };
});

const { submitHandler } = await import("./judgeController.js");
const { default: Submission } = await import("../models/Submission.js");
const { default: User } = await import("../models/User.js");
const { seedProblem } = await import("../test/fixtures/problem.js");

function mockRes() {
  const res = {};
  res._status = 200;
  res._json = null;
  res.status = vi.fn((c) => { res._status = c; return res; });
  res.json = vi.fn((b) => { res._json = b; return res; });
  return res;
}

function mockLog() {
  return { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() };
}

async function seedUser(overrides = {}) {
  return User.create({
    firebaseUid: `fb-${Math.random().toString(36).slice(2)}`,
    email: "errtest@test.com",
    ...overrides,
  });
}

function req({ userDoc, body }) {
  return { userDoc, body, log: mockLog() };
}

describe("Error propagation: Judge0 unavailable (real Mongo, mocked Judge0)", () => {
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

  it("returns a controlled 200/'Judge Error' response, not a hang or a 500, when Judge0 is unreachable", async () => {
    const problem = await seedProblem();
    const user = await seedUser();
    callJudge0.mockRejectedValue(new Error("fetch failed"));

    const res = mockRes();
    await submitHandler(req({ userDoc: user, body: { problemSlug: problem.slug, code: "x", language: "python", visibletestcases: [] } }), res);

    expect(res._status).toBe(200); // no unhandled crash — a clean status is always returned
    expect(res._json.status).toBe("Judge Error");
  });

  it("REGRESSION (bug found + fixed this audit): a Judge0 HTTP-error body embedding infra details never reaches the client or the persisted Submission", async () => {
    const problem = await seedProblem();
    const user = await seedUser();

    // Simulates fetchJudge0's own error construction
    // (`Judge0 returned HTTP 500: ${raw}`) where `raw` is Judge0's literal
    // response body — previously this whole string, including whatever
    // Judge0 or a misconfigured proxy in front of it put in that body,
    // was returned to the client verbatim as the `error` field.
    callJudge0.mockRejectedValue(
      new Error(
        'Judge0 returned HTTP 500: {"internal_host":"judge0-worker-3.internal.railway.app","AUTHN_TOKEN":"leaked-secret-value","stack":"at /app/internal/worker.rb:42"}'
      )
    );

    const res = mockRes();
    await submitHandler(req({ userDoc: user, body: { problemSlug: problem.slug, code: "x", language: "python", visibletestcases: [] } }), res);

    expect(res._json.status).toBe("Judge Error");
    const responseText = JSON.stringify(res._json);
    expect(responseText).not.toMatch(/internal_host|AUTHN_TOKEN|leaked-secret-value|worker\.rb|railway\.app/);

    const stored = await Submission.findOne({ userId: user._id, problemSlug: problem.slug }).lean();
    const storedText = JSON.stringify(stored);
    expect(storedText).not.toMatch(/internal_host|AUTHN_TOKEN|leaked-secret-value|worker\.rb|railway\.app/);
  });

  it("a network-level ECONNREFUSED-style failure produces the same safe, generic error message, not a raw stack/connection string", async () => {
    const problem = await seedProblem();
    const user = await seedUser();

    const netErr = new Error("connect ECONNREFUSED 10.244.1.7:2358");
    callJudge0.mockRejectedValue(netErr);

    const res = mockRes();
    await submitHandler(req({ userDoc: user, body: { problemSlug: problem.slug, code: "x", language: "python", visibletestcases: [] } }), res);

    expect(JSON.stringify(res._json)).not.toMatch(/ECONNREFUSED|10\.244\.1\.7/);
  });

  it("never persists or reports an Accepted verdict when Judge0 fails outright, regardless of any client-sent claim", async () => {
    const problem = await seedProblem();
    const user = await seedUser();
    callJudge0.mockRejectedValue(new Error("fetch failed"));

    const res = mockRes();
    await submitHandler(
      req({ userDoc: user, body: { problemSlug: problem.slug, code: "x", language: "python", visibletestcases: [], status: "Accepted" } }),
      res
    );

    expect(res._json.status).not.toBe("Accepted");
    const acceptedCount = await Submission.countDocuments({ userId: user._id, problemSlug: problem.slug, status: "Accepted" });
    expect(acceptedCount).toBe(0);
  });
});

describe("Error propagation: malformed contest/battle-room references degrade gracefully", () => {
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

  it("a malformed contestId does not crash the request or corrupt an otherwise-real Accepted verdict", async () => {
    const problem = await seedProblem();
    const user = await seedUser();
    callJudge0.mockResolvedValue({ stdout: JSON.stringify([]), stderr: "", compile_output: "" });

    const res = mockRes();
    await submitHandler(
      req({
        userDoc: user,
        body: {
          problemSlug: problem.slug,
          code: "def twoSum(): return []",
          language: "python",
          visibletestcases: [],
          contestId: "not-a-valid-object-id",
        },
      }),
      res
    );

    // The real, correctly-computed verdict is unaffected by the scoring
    // side-channel failing.
    expect(res._json.status).toBe("Accepted");
    expect(res._json.contest).toEqual(expect.objectContaining({ scored: false }));

    const stored = await Submission.findOne({ userId: user._id, problemSlug: problem.slug }).lean();
    expect(stored.status).toBe("Accepted");
  });

  it("a malformed battleRoomId does not crash the request or corrupt an otherwise-real Accepted verdict", async () => {
    const problem = await seedProblem();
    const user = await seedUser();
    callJudge0.mockResolvedValue({ stdout: JSON.stringify([]), stderr: "", compile_output: "" });

    const res = mockRes();
    await submitHandler(
      req({
        userDoc: user,
        body: {
          problemSlug: problem.slug,
          code: "def twoSum(): return []",
          language: "python",
          visibletestcases: [],
          battleRoomId: "also-not-valid",
        },
      }),
      res
    );

    expect(res._json.status).toBe("Accepted");
    expect(res._json.battleRoom).toEqual(expect.objectContaining({ scored: false }));

    const stored = await Submission.findOne({ userId: user._id, problemSlug: problem.slug }).lean();
    expect(stored.status).toBe("Accepted");
  });

  it("a nonexistent problem slug returns a clean 404, not a crash", async () => {
    const user = await seedUser();
    const res = mockRes();

    await submitHandler(
      req({ userDoc: user, body: { problemSlug: "does-not-exist", code: "x", language: "python", visibletestcases: [] } }),
      res
    );

    expect(res._status).toBe(404);
  });
});