import { describe, expect, it } from "vitest";
import { classifyJudgeError, labelForJudgeErrorKind } from "./judgeErrorTaxonomy";

function errorWithStatus(status, message = "some message") {
  const err = new Error(message);
  if (status !== undefined) err.status = status;
  return err;
}

describe("classifyJudgeError", () => {
  it("classifies a missing status (network failure) as infra", () => {
    const { kind, message } = classifyJudgeError(errorWithStatus(undefined, "Failed to fetch"));
    expect(kind).toBe("infra");
    expect(message).toMatch(/temporarily unavailable/i);
  });

  it("classifies 400 as config, prefixing the original message", () => {
    const { kind, message } = classifyJudgeError(errorWithStatus(400, "functionName is required"));
    expect(kind).toBe("config");
    expect(message).toBe("Execution configuration error: functionName is required");
  });

  it("classifies 401 as auth", () => {
    const { kind } = classifyJudgeError(errorWithStatus(401));
    expect(kind).toBe("auth");
  });

  it("classifies 403 as auth", () => {
    const { kind } = classifyJudgeError(errorWithStatus(403));
    expect(kind).toBe("auth");
  });

  it("classifies 404 as config (problem-not-found is a request-identity problem, not infra)", () => {
    const { kind } = classifyJudgeError(errorWithStatus(404, 'Problem "x" not found.'));
    expect(kind).toBe("config");
  });

  it("classifies 429 as rate_limit", () => {
    const { kind } = classifyJudgeError(errorWithStatus(429));
    expect(kind).toBe("rate_limit");
  });

  it("classifies 500 and other 5xx as infra", () => {
    expect(classifyJudgeError(errorWithStatus(500)).kind).toBe("infra");
    expect(classifyJudgeError(errorWithStatus(502)).kind).toBe("infra");
    expect(classifyJudgeError(errorWithStatus(503)).kind).toBe("infra");
  });

  it("falls back to infra for an unrecognized status", () => {
    expect(classifyJudgeError(errorWithStatus(418)).kind).toBe("infra");
  });
});

describe("labelForJudgeErrorKind", () => {
  it("returns a distinct label per kind, never collapsing config into 'Runner Unavailable'", () => {
    expect(labelForJudgeErrorKind("config")).toBe("Execution configuration error");
    expect(labelForJudgeErrorKind("infra")).toBe("Runner Unavailable");
    expect(labelForJudgeErrorKind("auth")).toBe("Authentication required");
    expect(labelForJudgeErrorKind("rate_limit")).toBe("Rate limited");
  });

  it("falls back to the infra label for an unknown kind", () => {
    expect(labelForJudgeErrorKind("something_new")).toBe("Runner Unavailable");
  });
});