import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { callClaudeJSON } from "./anthropicClient.js";

function jsonResponse(body, { ok = true, status = 200 } = {}) {
  return {
    ok,
    status,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(typeof body === "string" ? body : JSON.stringify(body)),
  };
}

describe("callClaudeJSON", () => {
  const ORIGINAL_KEY = process.env.ANTHROPIC_API_KEY;

  beforeEach(() => {
    process.env.ANTHROPIC_API_KEY = "sk-ant-test-key";
    global.fetch = vi.fn();
  });

  afterEach(() => {
    if (ORIGINAL_KEY !== undefined) process.env.ANTHROPIC_API_KEY = ORIGINAL_KEY;
    else delete process.env.ANTHROPIC_API_KEY;
    vi.restoreAllMocks();
  });

  it("throws 'ANTHROPIC_API_KEY is not set' without ever calling fetch when the key is missing", async () => {
    delete process.env.ANTHROPIC_API_KEY;

    await expect(callClaudeJSON({ systemPrompt: "sys", userMessage: "msg" })).rejects.toThrow(
      "ANTHROPIC_API_KEY is not set"
    );
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("sends the request to the correct Anthropic endpoint with the required headers", async () => {
    global.fetch.mockResolvedValue(jsonResponse({ content: [{ text: '{"ok":true}' }] }));

    await callClaudeJSON({ systemPrompt: "sys", userMessage: "msg" });

    const [url, options] = global.fetch.mock.calls[0];
    expect(url).toBe("https://api.anthropic.com/v1/messages");
    expect(options.headers["x-api-key"]).toBe("sk-ant-test-key");
    expect(options.headers["anthropic-version"]).toBe("2023-06-01");
    expect(options.headers["Content-Type"]).toBe("application/json");
  });

  it("parses a valid JSON response into an object", async () => {
    global.fetch.mockResolvedValue(jsonResponse({ content: [{ text: '{"opportunities":[]}' }] }));

    const result = await callClaudeJSON({ systemPrompt: "sys", userMessage: "msg" });

    expect(result).toEqual({ opportunities: [] });
  });

  it("strips markdown code fences before parsing, if Claude adds them despite instructions", async () => {
    global.fetch.mockResolvedValue(
      jsonResponse({ content: [{ text: '```json\n{"opportunities":[]}\n```' }] })
    );

    const result = await callClaudeJSON({ systemPrompt: "sys", userMessage: "msg" });

    expect(result).toEqual({ opportunities: [] });
  });

  it("attaches the real HTTP status to the thrown error on a non-2xx response", async () => {
    global.fetch.mockResolvedValue(
      jsonResponse('{"error":{"message":"invalid x-api-key"}}', { ok: false, status: 401 })
    );

    let caught;
    try {
      await callClaudeJSON({ systemPrompt: "sys", userMessage: "msg" });
    } catch (err) {
      caught = err;
    }

    expect(caught).toBeDefined();
    expect(caught.status).toBe(401);
  });

  it("attaches a 404 status distinctly from a 401, so callers can tell 'bad model' from 'bad key'", async () => {
    global.fetch.mockResolvedValue(
      jsonResponse('{"error":{"message":"model not found"}}', { ok: false, status: 404 })
    );

    let caught;
    try {
      await callClaudeJSON({ systemPrompt: "sys", userMessage: "msg" });
    } catch (err) {
      caught = err;
    }

    expect(caught.status).toBe(404);
  });

  it("extracts providerType from Anthropic's JSON error body ({ error: { type } })", async () => {
    global.fetch.mockResolvedValue(
      jsonResponse('{"type":"error","error":{"type":"authentication_error","message":"invalid x-api-key"}}', {
        ok: false,
        status: 401,
      })
    );

    let caught;
    try {
      await callClaudeJSON({ systemPrompt: "sys", userMessage: "msg" });
    } catch (err) {
      caught = err;
    }

    expect(caught.providerType).toBe("authentication_error");
  });

  it("sets providerType to null (does not throw) when the error body isn't valid JSON", async () => {
    global.fetch.mockResolvedValue(
      jsonResponse("<html>502 Bad Gateway</html>", { ok: false, status: 502 })
    );

    let caught;
    try {
      await callClaudeJSON({ systemPrompt: "sys", userMessage: "msg" });
    } catch (err) {
      caught = err;
    }

    expect(caught.status).toBe(502);
    expect(caught.providerType).toBeNull();
  });

  it("attaches err.code from the underlying network error when fetch itself throws", async () => {
    const networkErr = new TypeError("fetch failed");
    networkErr.cause = { code: "ECONNREFUSED" };
    global.fetch.mockRejectedValue(networkErr);

    let caught;
    try {
      await callClaudeJSON({ systemPrompt: "sys", userMessage: "msg" });
    } catch (err) {
      caught = err;
    }

    expect(caught.code).toBe("ECONNREFUSED");
    expect(caught.status).toBeUndefined();
  });

  it("does not attach a .status when fetch itself throws (never got a response at all)", async () => {
    global.fetch.mockRejectedValue(new TypeError("fetch failed"));

    let caught;
    try {
      await callClaudeJSON({ systemPrompt: "sys", userMessage: "msg" });
    } catch (err) {
      caught = err;
    }

    expect(caught).toBeDefined();
    expect(caught.status).toBeUndefined();
    expect(caught.message).toContain("Failed to reach Anthropic API");
  });

  it("throws if Claude's response text is not valid JSON", async () => {
    global.fetch.mockResolvedValue(jsonResponse({ content: [{ text: "not json at all" }] }));

    await expect(callClaudeJSON({ systemPrompt: "sys", userMessage: "msg" })).rejects.toThrow();
  });
});
