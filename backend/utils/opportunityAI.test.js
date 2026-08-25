import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

const { callGeminiJSONMock, callClaudeJSONMock } = vi.hoisted(() => ({
  callGeminiJSONMock: vi.fn(),
  callClaudeJSONMock: vi.fn(),
}));

vi.mock("./geminiClient.js", () => ({
  callGeminiJSON: callGeminiJSONMock,
}));
vi.mock("./anthropicClient.js", () => ({
  callClaudeJSON: callClaudeJSONMock,
}));

import { callOpportunityAI, getOpportunityAIProvider, checkOpportunityAIConfig } from "./opportunityAI.js";

describe("opportunityAI.js — provider abstraction", () => {
  const ORIGINAL_PROVIDER = process.env.OPPORTUNITY_AI_PROVIDER;
  const ORIGINAL_GEMINI_KEY = process.env.GEMINI_API_KEY;
  const ORIGINAL_ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    const restore = (name, value) => {
      if (value !== undefined) process.env[name] = value;
      else delete process.env[name];
    };
    restore("OPPORTUNITY_AI_PROVIDER", ORIGINAL_PROVIDER);
    restore("GEMINI_API_KEY", ORIGINAL_GEMINI_KEY);
    restore("ANTHROPIC_API_KEY", ORIGINAL_ANTHROPIC_KEY);
  });

  describe("callOpportunityAI", () => {
    it("routes to Gemini when OPPORTUNITY_AI_PROVIDER=gemini", async () => {
      process.env.OPPORTUNITY_AI_PROVIDER = "gemini";
      callGeminiJSONMock.mockResolvedValue({ opportunities: [] });

      await callOpportunityAI({ systemPrompt: "sys", userMessage: "msg", maxTokens: 4000 });

      expect(callGeminiJSONMock).toHaveBeenCalledWith({ systemPrompt: "sys", userMessage: "msg", maxTokens: 4000 });
      expect(callClaudeJSONMock).not.toHaveBeenCalled();
    });

    it("routes to Anthropic when OPPORTUNITY_AI_PROVIDER=anthropic", async () => {
      process.env.OPPORTUNITY_AI_PROVIDER = "anthropic";
      callClaudeJSONMock.mockResolvedValue({ opportunities: [] });

      await callOpportunityAI({ systemPrompt: "sys", userMessage: "msg", maxTokens: 4000 });

      expect(callClaudeJSONMock).toHaveBeenCalledWith({ systemPrompt: "sys", userMessage: "msg", maxTokens: 4000 });
      expect(callGeminiJSONMock).not.toHaveBeenCalled();
    });

    it("defaults to Gemini when OPPORTUNITY_AI_PROVIDER is unset", async () => {
      delete process.env.OPPORTUNITY_AI_PROVIDER;
      callGeminiJSONMock.mockResolvedValue({ opportunities: [] });

      await callOpportunityAI({ systemPrompt: "sys", userMessage: "msg" });

      expect(callGeminiJSONMock).toHaveBeenCalled();
      expect(callClaudeJSONMock).not.toHaveBeenCalled();
    });

    it("is case-insensitive and trims whitespace on the provider value", async () => {
      process.env.OPPORTUNITY_AI_PROVIDER = "  ANTHROPIC  ";
      callClaudeJSONMock.mockResolvedValue({ opportunities: [] });

      await callOpportunityAI({ systemPrompt: "sys", userMessage: "msg" });

      expect(callClaudeJSONMock).toHaveBeenCalled();
    });

    it("throws a plain configuration error, without calling any provider, for an unsupported provider value", async () => {
      process.env.OPPORTUNITY_AI_PROVIDER = "openai";

      await expect(callOpportunityAI({ systemPrompt: "sys", userMessage: "msg" })).rejects.toThrow(
        /Unsupported OPPORTUNITY_AI_PROVIDER "openai"/
      );
      expect(callGeminiJSONMock).not.toHaveBeenCalled();
      expect(callClaudeJSONMock).not.toHaveBeenCalled();
    });

    it("propagates the underlying provider error unchanged (status/code/providerType intact)", async () => {
      process.env.OPPORTUNITY_AI_PROVIDER = "gemini";
      const err = new Error("Gemini API error (429)");
      err.status = 429;
      err.providerType = "RESOURCE_EXHAUSTED";
      callGeminiJSONMock.mockRejectedValue(err);

      let caught;
      try {
        await callOpportunityAI({ systemPrompt: "sys", userMessage: "msg" });
      } catch (e) {
        caught = e;
      }

      expect(caught.status).toBe(429);
      expect(caught.providerType).toBe("RESOURCE_EXHAUSTED");
    });
  });

  describe("getOpportunityAIProvider", () => {
    it("returns 'gemini' by default", () => {
      delete process.env.OPPORTUNITY_AI_PROVIDER;
      expect(getOpportunityAIProvider()).toBe("gemini");
    });

    it("returns the configured provider, normalized", () => {
      process.env.OPPORTUNITY_AI_PROVIDER = "Anthropic";
      expect(getOpportunityAIProvider()).toBe("anthropic");
    });
  });

  describe("checkOpportunityAIConfig", () => {
    it("reports configured:true when the Gemini key is present and provider is gemini/default", () => {
      delete process.env.OPPORTUNITY_AI_PROVIDER;
      process.env.GEMINI_API_KEY = "some-key";

      const result = checkOpportunityAIConfig();

      expect(result).toEqual({ configured: true, provider: "gemini", envVar: "GEMINI_API_KEY", reason: null });
    });

    it("reports configured:false with the right envVar when GEMINI_API_KEY is missing", () => {
      delete process.env.OPPORTUNITY_AI_PROVIDER;
      delete process.env.GEMINI_API_KEY;

      const result = checkOpportunityAIConfig();

      expect(result.configured).toBe(false);
      expect(result.envVar).toBe("GEMINI_API_KEY");
      expect(result.reason).toContain("GEMINI_API_KEY");
    });

    it("reports configured:true for provider=anthropic when ANTHROPIC_API_KEY is present", () => {
      process.env.OPPORTUNITY_AI_PROVIDER = "anthropic";
      process.env.ANTHROPIC_API_KEY = "some-key";

      const result = checkOpportunityAIConfig();

      expect(result).toEqual({ configured: true, provider: "anthropic", envVar: "ANTHROPIC_API_KEY", reason: null });
    });

    it("reports configured:false with the right envVar when ANTHROPIC_API_KEY is missing for provider=anthropic", () => {
      process.env.OPPORTUNITY_AI_PROVIDER = "anthropic";
      delete process.env.ANTHROPIC_API_KEY;

      const result = checkOpportunityAIConfig();

      expect(result.configured).toBe(false);
      expect(result.envVar).toBe("ANTHROPIC_API_KEY");
    });

    it("reports configured:false with envVar:null for an unsupported provider value", () => {
      process.env.OPPORTUNITY_AI_PROVIDER = "openai";

      const result = checkOpportunityAIConfig();

      expect(result.configured).toBe(false);
      expect(result.envVar).toBeNull();
      expect(result.reason).toContain("openai");
    });

    it("never includes the actual key value in the reason string", () => {
      delete process.env.OPPORTUNITY_AI_PROVIDER;
      process.env.GEMINI_API_KEY = "super-secret-value";

      const result = checkOpportunityAIConfig();

      expect(JSON.stringify(result)).not.toContain("super-secret-value");
    });
  });
});
