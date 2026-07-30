import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

vi.mock("../config/logger.js", () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock("../services/executionQueue.js", () => ({
  // Pass-through — these tests are about fetchJudge0's own retry/health
  // logic, not the concurrency queue (already covered by
  // executionQueue.test.js / directExecutionQueue.test.js).
  enqueueExecution: vi.fn((job) => job()),
}));

vi.mock("../utils/generateDriverCode.js", () => ({
  generateDriverCode: vi.fn(() => "print('driver')"),
}));

vi.mock("../services/judge0Health.js", () => ({
  recordJudge0Success: vi.fn(),
  recordJudge0Failure: vi.fn(),
}));

import { recordJudge0Success, recordJudge0Failure } from "../services/judge0Health.js";
import { callJudge0 } from "./compilerController.js";

function b64(str) {
  return Buffer.from(str, "utf-8").toString("base64");
}

function jsonResponse(body, { ok = true, status = 200 } = {}) {
  return {
    ok,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  };
}

describe("compilerController — Judge0 health recording (Fest Readiness Audit, P1-1)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(global, "fetch");
  });

  afterEach(() => {
    global.fetch.mockRestore?.();
  });

  it("records a success on a normal, well-formed Judge0 response — regardless of the graded verdict", async () => {
    // "Wrong Answer" is a perfectly successful Judge0 HTTP interaction —
    // the infrastructure worked; the user's code just didn't pass. Must
    // count as a health SUCCESS, not a failure.
    global.fetch.mockResolvedValue(
      jsonResponse({
        stdout: b64("wrong output"),
        stderr: null,
        compile_output: null,
        status: { id: 4, description: "Wrong Answer" },
      })
    );

    await callJudge0({
      sourceCode: "def solve(): pass",
      language: "python",
      languageId: 71,
      testcaseInput: {},
      functionName: "solve",
    });

    expect(recordJudge0Success).toHaveBeenCalledOnce();
    expect(recordJudge0Failure).not.toHaveBeenCalled();
  });

  it("records a failure when Judge0 returns 5xx on every retry attempt", async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 503,
      text: async () => "Service Unavailable",
    });

    await expect(
      callJudge0({
        sourceCode: "def solve(): pass",
        language: "python",
        languageId: 71,
        testcaseInput: {},
        functionName: "solve",
      })
    ).rejects.toThrow(/503/);

    expect(recordJudge0Failure).toHaveBeenCalledOnce();
    expect(recordJudge0Success).not.toHaveBeenCalled();
  });

  it("does NOT record a failure for a 4xx — that's our own bad request, not Judge0 being unhealthy", async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 422,
      text: async () => "Unprocessable",
    });

    await expect(
      callJudge0({
        sourceCode: "def solve(): pass",
        language: "python",
        languageId: 71,
        testcaseInput: {},
        functionName: "solve",
      })
    ).rejects.toThrow(/422/);

    expect(recordJudge0Failure).not.toHaveBeenCalled();
    expect(recordJudge0Success).not.toHaveBeenCalled();
  });

  it("records a failure when every retry hits a network error", async () => {
    const networkError = new Error("fetch failed");
    networkError.cause = { code: "ECONNREFUSED" };
    global.fetch.mockRejectedValue(networkError);

    await expect(
      callJudge0({
        sourceCode: "def solve(): pass",
        language: "python",
        languageId: 71,
        testcaseInput: {},
        functionName: "solve",
      })
    ).rejects.toThrow();

    expect(recordJudge0Failure).toHaveBeenCalledOnce();
    expect(recordJudge0Success).not.toHaveBeenCalled();
  });

  it("records exactly one success, not one per internal retry, after a transient 5xx recovers", async () => {
    global.fetch
      .mockResolvedValueOnce({ ok: false, status: 503, text: async () => "down" })
      .mockResolvedValueOnce(
        jsonResponse({
          stdout: b64("ok"),
          stderr: null,
          compile_output: null,
          status: { id: 3, description: "Accepted" },
        })
      );

    await callJudge0({
      sourceCode: "def solve(): pass",
      language: "python",
      languageId: 71,
      testcaseInput: {},
      functionName: "solve",
    });

    expect(recordJudge0Success).toHaveBeenCalledOnce();
    expect(recordJudge0Failure).not.toHaveBeenCalled();
  });
});
