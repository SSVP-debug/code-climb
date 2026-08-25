import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

/**
 * Mocks @google/genai entirely — generateContent is a shared mock fn so
 * each test controls exactly what it resolves/rejects, matching how
 * anthropicClient.test.js mocks global.fetch. GoogleGenAI's constructor
 * is also a spy so tests can assert it was called with the right apiKey
 * without needing a real key anywhere.
 */
const { generateContent, GoogleGenAIMock } = vi.hoisted(() => {
  const generateContent = vi.fn();
  const GoogleGenAIMock = vi.fn().mockImplementation(() => ({
    models: { generateContent },
  }));
  return { generateContent, GoogleGenAIMock };
});

vi.mock("@google/genai", () => ({
  GoogleGenAI: GoogleGenAIMock,
}));

import { callGeminiJSON } from "./geminiClient.js";

// Mirrors the SDK's real ApiError shape exactly (see
// node_modules/@google/genai/dist/node/index.mjs's throwErrorIfNotOK):
// name "ApiError", `.status` is the real HTTP status, `.message` is
// JSON.stringify() of Google's standard error body.
function apiError(status, errorBody) {
  const err = new Error(JSON.stringify(errorBody));
  err.name = "ApiError";
  err.status = status;
  return err;
}

describe("callGeminiJSON", () => {
  const ORIGINAL_KEY = process.env.GEMINI_API_KEY;
  const ORIGINAL_MODEL = process.env.GEMINI_MODEL;

  beforeEach(() => {
    process.env.GEMINI_API_KEY = "test-gemini-key";
    delete process.env.GEMINI_MODEL;
    generateContent.mockReset();
    GoogleGenAIMock.mockClear();
  });

  afterEach(() => {
    if (ORIGINAL_KEY !== undefined) process.env.GEMINI_API_KEY = ORIGINAL_KEY;
    else delete process.env.GEMINI_API_KEY;
    if (ORIGINAL_MODEL !== undefined) process.env.GEMINI_MODEL = ORIGINAL_MODEL;
    else delete process.env.GEMINI_MODEL;
  });

  it("throws 'GEMINI_API_KEY is not set' without ever constructing the SDK client when the key is missing", async () => {
    delete process.env.GEMINI_API_KEY;

    await expect(callGeminiJSON({ systemPrompt: "sys", userMessage: "msg" })).rejects.toThrow(
      "GEMINI_API_KEY is not set"
    );
    expect(GoogleGenAIMock).not.toHaveBeenCalled();
  });

  it("constructs the client with the configured API key and calls generateContent with the default model", async () => {
    generateContent.mockResolvedValue({ text: '{"opportunities":[]}' });

    await callGeminiJSON({ systemPrompt: "sys", userMessage: "msg" });

    expect(GoogleGenAIMock).toHaveBeenCalledWith({ apiKey: "test-gemini-key" });
    const [call] = generateContent.mock.calls;
    expect(call[0].model).toBe("gemini-2.5-flash");
    expect(call[0].contents).toBe("msg");
    expect(call[0].config.systemInstruction).toBe("sys");
    expect(call[0].config.responseMimeType).toBe("application/json");
  });

  it("uses GEMINI_MODEL when set, instead of the default", async () => {
    process.env.GEMINI_MODEL = "gemini-2.5-flash-lite";
    generateContent.mockResolvedValue({ text: "{}" });

    await callGeminiJSON({ systemPrompt: "sys", userMessage: "msg" });

    expect(generateContent.mock.calls[0][0].model).toBe("gemini-2.5-flash-lite");
  });

  it("parses a valid JSON response into an object", async () => {
    generateContent.mockResolvedValue({ text: '{"opportunities":[{"title":"X"}]}' });

    const result = await callGeminiJSON({ systemPrompt: "sys", userMessage: "msg" });

    expect(result).toEqual({ opportunities: [{ title: "X" }] });
  });

  it("strips markdown code fences before parsing, if Gemini adds them despite the JSON response format", async () => {
    generateContent.mockResolvedValue({ text: '```json\n{"opportunities":[]}\n```' });

    const result = await callGeminiJSON({ systemPrompt: "sys", userMessage: "msg" });

    expect(result).toEqual({ opportunities: [] });
  });

  it("throws a clear error on an empty response", async () => {
    generateContent.mockResolvedValue({ text: "" });

    await expect(callGeminiJSON({ systemPrompt: "sys", userMessage: "msg" })).rejects.toThrow(
      "Gemini returned an empty response."
    );
  });

  it("throws if Gemini's response text is not valid JSON (malformed provider response)", async () => {
    generateContent.mockResolvedValue({ text: "not json at all" });

    await expect(callGeminiJSON({ systemPrompt: "sys", userMessage: "msg" })).rejects.toThrow(
      /non-JSON response/
    );
  });

  it("attaches the real HTTP status on a 401 (auth failure), with providerType from Google's error body", async () => {
    generateContent.mockRejectedValue(
      apiError(401, { error: { code: 401, message: "API key not valid", status: "UNAUTHENTICATED" } })
    );

    let caught;
    try {
      await callGeminiJSON({ systemPrompt: "sys", userMessage: "msg" });
    } catch (err) {
      caught = err;
    }

    expect(caught.status).toBe(401);
    expect(caught.providerType).toBe("UNAUTHENTICATED");
  });

  it("attaches a 403 with PERMISSION_DENIED distinctly from a 401", async () => {
    generateContent.mockRejectedValue(
      apiError(403, { error: { code: 403, message: "forbidden", status: "PERMISSION_DENIED" } })
    );

    let caught;
    try {
      await callGeminiJSON({ systemPrompt: "sys", userMessage: "msg" });
    } catch (err) {
      caught = err;
    }

    expect(caught.status).toBe(403);
    expect(caught.providerType).toBe("PERMISSION_DENIED");
  });

  it("attaches a 429 with RESOURCE_EXHAUSTED for rate-limit/quota errors", async () => {
    generateContent.mockRejectedValue(
      apiError(429, { error: { code: 429, message: "quota exceeded", status: "RESOURCE_EXHAUSTED" } })
    );

    let caught;
    try {
      await callGeminiJSON({ systemPrompt: "sys", userMessage: "msg" });
    } catch (err) {
      caught = err;
    }

    expect(caught.status).toBe(429);
    expect(caught.providerType).toBe("RESOURCE_EXHAUSTED");
  });

  it("attaches a 5xx status for a provider-side outage", async () => {
    generateContent.mockRejectedValue(
      apiError(503, { error: { code: 503, message: "model overloaded", status: "UNAVAILABLE" } })
    );

    let caught;
    try {
      await callGeminiJSON({ systemPrompt: "sys", userMessage: "msg" });
    } catch (err) {
      caught = err;
    }

    expect(caught.status).toBe(503);
    expect(caught.providerType).toBe("UNAVAILABLE");
  });

  it("sets providerType to null (does not throw) when the ApiError message isn't valid JSON", async () => {
    const err = new Error("not json");
    err.name = "ApiError";
    err.status = 500;
    generateContent.mockRejectedValue(err);

    let caught;
    try {
      await callGeminiJSON({ systemPrompt: "sys", userMessage: "msg" });
    } catch (e) {
      caught = e;
    }

    expect(caught.status).toBe(500);
    expect(caught.providerType).toBeNull();
  });

  it("does not attach .status when the SDK call fails at the network level (no ApiError)", async () => {
    const networkErr = new TypeError("fetch failed");
    networkErr.cause = { code: "ECONNREFUSED" };
    generateContent.mockRejectedValue(networkErr);

    let caught;
    try {
      await callGeminiJSON({ systemPrompt: "sys", userMessage: "msg" });
    } catch (err) {
      caught = err;
    }

    expect(caught.status).toBeUndefined();
    expect(caught.code).toBe("ECONNREFUSED");
    expect(caught.message).toContain("Failed to reach Gemini API");
  });

  it("never logs or includes the API key in any thrown error", async () => {
    process.env.GEMINI_API_KEY = "super-secret-gemini-key-value";
    generateContent.mockRejectedValue(
      apiError(401, { error: { code: 401, message: "bad key", status: "UNAUTHENTICATED" } })
    );

    let caught;
    try {
      await callGeminiJSON({ systemPrompt: "sys", userMessage: "msg" });
    } catch (err) {
      caught = err;
    }

    expect(caught.message).not.toContain("super-secret-gemini-key-value");
    expect(JSON.stringify(caught)).not.toContain("super-secret-gemini-key-value");
  });
});
