import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

vi.mock("../config/logger.js", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { logger } from "../config/logger.js";
import { getOpportunityAIDiagnostics } from "./adminOpportunityAIDiagnosticsController.js";

function mockRes() {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

function googleResponse(body, { ok = true, status = 200 } = {}) {
  return {
    ok,
    status,
    json: () => Promise.resolve(body),
  };
}

describe("getOpportunityAIDiagnostics", () => {
  const ORIGINAL_KEY = process.env.GEMINI_API_KEY;
  const ORIGINAL_MODEL = process.env.GEMINI_MODEL;

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    if (ORIGINAL_KEY !== undefined) process.env.GEMINI_API_KEY = ORIGINAL_KEY;
    else delete process.env.GEMINI_API_KEY;
    if (ORIGINAL_MODEL !== undefined) process.env.GEMINI_MODEL = ORIGINAL_MODEL;
    else delete process.env.GEMINI_MODEL;
  });

  it("reports configured:false and never calls Google when GEMINI_API_KEY is missing", async () => {
    delete process.env.GEMINI_API_KEY;
    process.env.GEMINI_MODEL = "gemini-2.5-flash";

    const res = mockRes();
    await getOpportunityAIDiagnostics({}, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      configured: false,
      provider: "gemini",
      configuredModel: "gemini-2.5-flash",
      googleStatus: null,
      models: [],
    });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("calls the correct Google models.list endpoint with the key as a query param", async () => {
    process.env.GEMINI_API_KEY = "test-key-value";
    global.fetch.mockResolvedValue(googleResponse({ models: [] }));

    await getOpportunityAIDiagnostics({}, mockRes());

    const [url, options] = global.fetch.mock.calls[0];
    expect(url).toBe("https://generativelanguage.googleapis.com/v1beta/models?key=test-key-value");
    expect(options.method).toBe("GET");
  });

  it("returns a successful list of models with only the safe fields", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    process.env.GEMINI_MODEL = "gemini-2.5-flash";
    global.fetch.mockResolvedValue(
      googleResponse({
        models: [
          {
            name: "models/gemini-2.5-pro",
            supportedGenerationMethods: ["generateContent"],
            inputTokenLimit: 1000000,
            outputTokenLimit: 8192,
            // extra fields that must NOT be echoed through
            description: "some internal description",
            version: "001",
          },
          {
            name: "models/gemini-2.5-flash",
            supportedGenerationMethods: ["generateContent", "countTokens"],
            // no token limits provided for this one
          },
        ],
      })
    );

    const res = mockRes();
    await getOpportunityAIDiagnostics({}, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const payload = res.json.mock.calls[0][0];
    expect(payload.configured).toBe(true);
    expect(payload.provider).toBe("gemini");
    expect(payload.configuredModel).toBe("gemini-2.5-flash");
    expect(payload.googleStatus).toBe(200);
    expect(payload.models).toEqual([
      {
        name: "models/gemini-2.5-pro",
        supportedGenerationMethods: ["generateContent"],
        inputTokenLimit: 1000000,
        outputTokenLimit: 8192,
      },
      {
        name: "models/gemini-2.5-flash",
        supportedGenerationMethods: ["generateContent", "countTokens"],
        inputTokenLimit: null,
        outputTokenLimit: null,
      },
    ]);
    // No extra fields leaked through
    expect(payload.models[0]).not.toHaveProperty("description");
    expect(payload.models[0]).not.toHaveProperty("version");
  });

  it("returns a safe diagnostic on a Google 401 (bad/revoked key)", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    global.fetch.mockResolvedValue(
      googleResponse(
        { error: { code: 401, message: "API key not valid", status: "UNAUTHENTICATED" } },
        { ok: false, status: 401 }
      )
    );

    const res = mockRes();
    await getOpportunityAIDiagnostics({}, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        configured: true,
        provider: "gemini",
        googleStatus: 401,
        errorType: "UNAUTHENTICATED",
        errorMessage: "API key not valid",
      })
    );
  });

  it("returns a safe diagnostic on a Google 403 (permission denied)", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    global.fetch.mockResolvedValue(
      googleResponse(
        { error: { code: 403, message: "permission denied for this model", status: "PERMISSION_DENIED" } },
        { ok: false, status: 403 }
      )
    );

    const res = mockRes();
    await getOpportunityAIDiagnostics({}, res);

    const payload = res.json.mock.calls[0][0];
    expect(payload.googleStatus).toBe(403);
    expect(payload.errorType).toBe("PERMISSION_DENIED");
  });

  it("returns a safe diagnostic on a Google 429 (rate limit / quota)", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    global.fetch.mockResolvedValue(
      googleResponse(
        { error: { code: 429, message: "quota exceeded", status: "RESOURCE_EXHAUSTED" } },
        { ok: false, status: 429 }
      )
    );

    const res = mockRes();
    await getOpportunityAIDiagnostics({}, res);

    const payload = res.json.mock.calls[0][0];
    expect(payload.googleStatus).toBe(429);
    expect(payload.errorType).toBe("RESOURCE_EXHAUSTED");
  });

  it("returns a safe diagnostic on a Google 5xx", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    global.fetch.mockResolvedValue(
      googleResponse(
        { error: { code: 503, message: "backend unavailable", status: "UNAVAILABLE" } },
        { ok: false, status: 503 }
      )
    );

    const res = mockRes();
    await getOpportunityAIDiagnostics({}, res);

    const payload = res.json.mock.calls[0][0];
    expect(payload.googleStatus).toBe(503);
    expect(payload.errorType).toBe("UNAVAILABLE");
  });

  it("handles a non-JSON error body from Google gracefully (does not throw)", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    global.fetch.mockResolvedValue({
      ok: false,
      status: 502,
      json: () => Promise.reject(new Error("not json")),
    });

    const res = mockRes();
    await getOpportunityAIDiagnostics({}, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const payload = res.json.mock.calls[0][0];
    expect(payload.googleStatus).toBe(502);
    expect(payload.errorType).toBeNull();
    expect(payload.errorMessage).toBeNull();
  });

  it("returns 502 when fetch itself fails (network-level failure, no Google response at all)", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    global.fetch.mockRejectedValue(new TypeError("fetch failed"));

    const res = mockRes();
    await getOpportunityAIDiagnostics({}, res);

    expect(res.status).toHaveBeenCalledWith(502);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ configured: true, provider: "gemini", googleStatus: null, errorType: "network_error" })
    );
  });

  it("never includes the API key in the JSON response, in any scenario", async () => {
    process.env.GEMINI_API_KEY = "super-secret-gemini-key-value";
    global.fetch.mockResolvedValue(
      googleResponse({ models: [{ name: "models/gemini-2.5-flash", supportedGenerationMethods: [] }] })
    );

    const res = mockRes();
    await getOpportunityAIDiagnostics({}, res);

    const payload = res.json.mock.calls[0][0];
    expect(JSON.stringify(payload)).not.toContain("super-secret-gemini-key-value");
  });

  it("never logs the API key, on success, provider error, or network failure", async () => {
    process.env.GEMINI_API_KEY = "super-secret-gemini-key-value";

    // Success case
    global.fetch.mockResolvedValueOnce(googleResponse({ models: [] }));
    await getOpportunityAIDiagnostics({}, mockRes());

    // Provider error case
    global.fetch.mockResolvedValueOnce(
      googleResponse({ error: { code: 401, message: "bad key", status: "UNAUTHENTICATED" } }, { ok: false, status: 401 })
    );
    await getOpportunityAIDiagnostics({}, mockRes());

    // Network failure case
    global.fetch.mockRejectedValueOnce(new TypeError("fetch failed"));
    await getOpportunityAIDiagnostics({}, mockRes());

    const allLoggedText = [...logger.error.mock.calls, ...logger.warn.mock.calls, ...logger.info.mock.calls]
      .map((call) => JSON.stringify(call))
      .join("\n");
    expect(allLoggedText).not.toContain("super-secret-gemini-key-value");
  });

  it("never logs or returns raw request headers or an Authorization header value", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    global.fetch.mockResolvedValue(googleResponse({ models: [] }));

    const res = mockRes();
    await getOpportunityAIDiagnostics({}, res);

    // The implementation never sets an Authorization header at all (the
    // key goes in the query string per Google's REST convention) — spot
    // check that fetch was never called with any header containing
    // "Authorization" or "Bearer".
    const [, options] = global.fetch.mock.calls[0];
    expect(options.headers).toBeUndefined();
    const payload = res.json.mock.calls[0][0];
    expect(payload).not.toHaveProperty("headers");
    expect(payload).not.toHaveProperty("authorization");
  });
});
