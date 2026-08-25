import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("../models/Opportunity.js", () => ({
  default: {
    exists: vi.fn(),
    create: vi.fn(),
  },
}));
vi.mock("../models/Counter.js", () => ({
  nextSequence: vi.fn(),
}));
vi.mock("../services/adminAuditLog.js", () => ({
  recordAdminAction: vi.fn(),
}));
vi.mock("../utils/opportunityAI.js", () => ({
  callOpportunityAI: vi.fn(),
  checkOpportunityAIConfig: vi.fn(),
}));
vi.mock("../config/logger.js", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import Opportunity from "../models/Opportunity.js";
import { nextSequence } from "../models/Counter.js";
import { recordAdminAction } from "../services/adminAuditLog.js";
import { callOpportunityAI, checkOpportunityAIConfig } from "../utils/opportunityAI.js";
import { logger } from "../config/logger.js";
import { extractOpportunities, importSelectedOpportunities } from "./adminOpportunityImportController.js";

function mockRes() {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

function mockAdmin() {
  return { _id: "admin1", email: "admin@codeclub.in", role: "admin" };
}

function validCandidate(overrides = {}) {
  return {
    title: "MLH Fellowship",
    organization: "Major League Hacking",
    organizationLogoUrl: null,
    type: "fellowship",
    category: "Software Engineering",
    shortSummary: "A remote fellowship for student developers.",
    description: "Full description here.",
    eligibility: "Currently enrolled students",
    eligibleDegrees: ["B.Tech"],
    eligibleBranches: ["CSE"],
    eligibleGraduationYears: [2026],
    minYear: 2,
    maxYear: 4,
    location: "Remote",
    workMode: "remote",
    country: "Global",
    duration: "12 weeks",
    stipend: "$1500/month",
    prize: "",
    compensationNotes: "",
    applicationDeadline: "2026-08-31",
    startDate: null,
    officialApplicationUrl: "https://fellowship.mlh.io/apply",
    officialSourceUrl: "https://fellowship.mlh.io",
    verificationStatus: "unverified",
    flags: [],
    ...overrides,
  };
}

// Default "everything is configured and ready" response for
// checkOpportunityAIConfig() — most tests below are about extraction
// *logic*, not the config-presence check itself, so they don't need to
// think about provider/env-var details at all. The specific
// not-configured behavior is covered by its own tests, which override
// this per-test.
function configuredOk(provider = "gemini") {
  return {
    configured: true,
    provider,
    envVar: provider === "gemini" ? "GEMINI_API_KEY" : "ANTHROPIC_API_KEY",
    reason: null,
  };
}

describe("adminOpportunityImportController.js", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("extractOpportunities", () => {
    beforeEach(() => {
      checkOpportunityAIConfig.mockReturnValue(configuredOk());
    });

    it("returns 400 for empty research text without ever calling the AI provider", async () => {
      const req = { body: { researchText: "   " } };
      const res = mockRes();

      await extractOpportunities(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(callOpportunityAI).not.toHaveBeenCalled();
    });

    it("returns 400 for research text exceeding the max length, without calling the AI provider", async () => {
      const req = { body: { researchText: "x".repeat(20001) } };
      const res = mockRes();

      await extractOpportunities(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(callOpportunityAI).not.toHaveBeenCalled();
    });

    it("extracts a single opportunity from research text", async () => {
      callOpportunityAI.mockResolvedValue({
        opportunities: [validCandidate()],
      });
      const req = { body: { researchText: "MLH Fellowship details..." } };
      const res = mockRes();

      await extractOpportunities(req, res);

      const payload = res.json.mock.calls[0][0];
      expect(payload.opportunities).toHaveLength(1);
      expect(payload.opportunities[0].title).toBe("MLH Fellowship");
    });

    it("extracts multiple distinct opportunities from one pasted block", async () => {
      callOpportunityAI.mockResolvedValue({
        opportunities: [
          validCandidate({ title: "Smart India Hackathon 2026" }),
          validCandidate({ title: "ISRO Internship" }),
          validCandidate({ title: "DRDO Internship" }),
        ],
      });
      const req = { body: { researchText: "1. SIH 2026...\n2. ISRO...\n3. DRDO..." } };
      const res = mockRes();

      await extractOpportunities(req, res);

      const payload = res.json.mock.calls[0][0];
      expect(payload.opportunities.map((o) => o.title)).toEqual([
        "Smart India Hackathon 2026",
        "ISRO Internship",
        "DRDO Internship",
      ]);
    });

    it("never invents a missing officialApplicationUrl — leaves it empty and flags it", async () => {
      callOpportunityAI.mockResolvedValue({
        opportunities: [validCandidate({ officialApplicationUrl: null, flags: [] })],
      });
      const req = { body: { researchText: "some vague text" } };
      const res = mockRes();

      await extractOpportunities(req, res);

      const candidate = res.json.mock.calls[0][0].opportunities[0];
      expect(candidate.officialApplicationUrl).toBe("");
      expect(candidate.flags.some((f) => f.toLowerCase().includes("application url"))).toBe(true);
    });

    it("flags but does not silently drop an ambiguous field the provider already flagged", async () => {
      callOpportunityAI.mockResolvedValue({
        opportunities: [
          validCandidate({ flags: ["Deadline mentioned as both Aug 31 and Sep 5 — verify with the admin."] }),
        ],
      });
      const req = { body: { researchText: "ambiguous deadline text" } };
      const res = mockRes();

      await extractOpportunities(req, res);

      const candidate = res.json.mock.calls[0][0].opportunities[0];
      expect(candidate.flags).toContain("Deadline mentioned as both Aug 31 and Sep 5 — verify with the admin.");
    });

    it("always returns verificationStatus 'unverified' on every candidate, regardless of what the provider returns", async () => {
      callOpportunityAI.mockResolvedValue({
        opportunities: [validCandidate({ verificationStatus: "verified" })],
      });
      const req = { body: { researchText: "text claiming verification" } };
      const res = mockRes();

      await extractOpportunities(req, res);

      expect(res.json.mock.calls[0][0].opportunities[0].verificationStatus).toBe("unverified");
    });

    it("defaults an unrecognized type to 'other' and flags it rather than guessing", async () => {
      callOpportunityAI.mockResolvedValue({
        opportunities: [validCandidate({ type: "not-a-real-type" })],
      });
      const req = { body: { researchText: "text" } };
      const res = mockRes();

      await extractOpportunities(req, res);

      const candidate = res.json.mock.calls[0][0].opportunities[0];
      expect(candidate.type).toBe("other");
      expect(candidate.flags.some((f) => f.includes("Unrecognized type"))).toBe(true);
    });

    it("handles malformed/non-JSON-shaped provider output gracefully (no opportunities array)", async () => {
      callOpportunityAI.mockResolvedValue({ notWhatWeExpected: true });
      const req = { body: { researchText: "text" } };
      const res = mockRes();

      await extractOpportunities(req, res);

      expect(res.json.mock.calls[0][0].opportunities).toEqual([]);
    });

    it("returns 503 (not 502) when the configured provider isn't ready — a missing config, not an upstream outage", async () => {
      checkOpportunityAIConfig.mockReturnValue({
        configured: false,
        provider: "gemini",
        envVar: "GEMINI_API_KEY",
        reason: "Opportunity extraction is unavailable. Set GEMINI_API_KEY to enable.",
      });

      const req = { body: { researchText: "some research text" } };
      const res = mockRes();

      await extractOpportunities(req, res);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining("Set GEMINI_API_KEY to enable"),
        })
      );
      // Confirms the root-cause fix: no provider call is even attempted
      // once the missing key is detected up front.
      expect(callOpportunityAI).not.toHaveBeenCalled();
    });

    it("still returns 503 (defensive fallback) if callOpportunityAI itself throws the missing-key error", async () => {
      // Upfront check passes (first call), but callOpportunityAI throws
      // the same "is not set" error it would if the env var vanished
      // between the check and the call — the catch block re-checks
      // config (second call), which should now report not-configured.
      checkOpportunityAIConfig
        .mockReturnValueOnce(configuredOk())
        .mockReturnValueOnce({
          configured: false,
          provider: "gemini",
          envVar: "GEMINI_API_KEY",
          reason: "Opportunity extraction is unavailable. Set GEMINI_API_KEY to enable.",
        });
      callOpportunityAI.mockRejectedValue(new Error("GEMINI_API_KEY is not set"));

      const req = { body: { researchText: "text" } };
      const res = mockRes();

      await extractOpportunities(req, res);

      expect(res.status).toHaveBeenCalledWith(503);
    });

    it("returns 502 (genuine upstream failure), distinct from the 503 config case, when the provider is reachable but errors", async () => {
      const err = new Error("Provider API error (500): internal_server_error");
      err.status = 500;
      callOpportunityAI.mockRejectedValue(err);

      const req = { body: { researchText: "text" } };
      const res = mockRes();

      await extractOpportunities(req, res);

      expect(res.status).toHaveBeenCalledWith(502);
    });

    it("returns 502 when the provider call itself fails", async () => {
      const err = new Error("Provider API error (500)");
      err.status = 500;
      callOpportunityAI.mockRejectedValue(err);
      const req = { body: { researchText: "text" } };
      const res = mockRes();

      await extractOpportunities(req, res);

      expect(res.status).toHaveBeenCalledWith(502);
    });

    it("returns 503 with a key-specific message (naming the configured provider's env var) on a 401 from the provider", async () => {
      checkOpportunityAIConfig.mockReturnValue(configuredOk("anthropic"));
      const err = new Error("Anthropic API error (401): authentication_error");
      err.status = 401;
      callOpportunityAI.mockRejectedValue(err);
      const req = { body: { researchText: "text" } };
      const res = mockRes();

      await extractOpportunities(req, res);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining("API key was rejected"),
        })
      );
      expect(res.json.mock.calls[0][0].error).toContain("ANTHROPIC_API_KEY");
    });

    it("names GEMINI_API_KEY specifically when Gemini is the configured provider and returns a 401", async () => {
      checkOpportunityAIConfig.mockReturnValue(configuredOk("gemini"));
      const err = new Error("Gemini API error (401): UNAUTHENTICATED");
      err.status = 401;
      callOpportunityAI.mockRejectedValue(err);
      const req = { body: { researchText: "text" } };
      const res = mockRes();

      await extractOpportunities(req, res);

      expect(res.json.mock.calls[0][0].error).toContain("GEMINI_API_KEY");
    });

    it("returns 503 with a key-specific message on a 403 from the provider too", async () => {
      const err = new Error("Provider API error (403): permission_error");
      err.status = 403;
      callOpportunityAI.mockRejectedValue(err);
      const req = { body: { researchText: "text" } };
      const res = mockRes();

      await extractOpportunities(req, res);

      expect(res.status).toHaveBeenCalledWith(503);
    });

    it("returns 503 with a model-specific message on a 404 (invalid/unavailable model) from the provider", async () => {
      const err = new Error("Provider API error (404): not_found_error");
      err.status = 404;
      callOpportunityAI.mockRejectedValue(err);
      const req = { body: { researchText: "text" } };
      const res = mockRes();

      await extractOpportunities(req, res);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.stringContaining("AI model is not available") })
      );
    });

    it("returns 502 with a rate-limit-specific message on a 429 from the provider", async () => {
      const err = new Error("Provider API error (429): rate_limit_error");
      err.status = 429;
      callOpportunityAI.mockRejectedValue(err);
      const req = { body: { researchText: "text" } };
      const res = mockRes();

      await extractOpportunities(req, res);

      expect(res.status).toHaveBeenCalledWith(502);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.stringContaining("rate-limited") })
      );
    });

    it("returns 502 with an overload-specific message on a 529 from the provider", async () => {
      const err = new Error("Provider API error (529): overloaded_error");
      err.status = 529;
      callOpportunityAI.mockRejectedValue(err);
      const req = { body: { researchText: "text" } };
      const res = mockRes();

      await extractOpportunities(req, res);

      expect(res.status).toHaveBeenCalledWith(502);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.stringContaining("overloaded") })
      );
    });

    it("never echoes the provider's raw response body or the API key into the client-facing error message", async () => {
      const err = new Error('Provider API error (401): {"error":{"message":"invalid key: sk-secret-value"}}');
      err.status = 401;
      err.providerBody = '{"error":{"message":"invalid key: sk-secret-value"}}';
      callOpportunityAI.mockRejectedValue(err);
      const req = { body: { researchText: "text" } };
      const res = mockRes();

      await extractOpportunities(req, res);

      const responseBody = res.json.mock.calls[0][0];
      expect(JSON.stringify(responseBody)).not.toContain("sk-secret-value");
    });

    describe("server-side diagnostic logging", () => {
      it("logs a structured diagnostic with name/message/status/code/providerType on a provider rejection", async () => {
        const err = new Error("Provider API error (401): authentication_error");
        err.status = 401;
        err.code = null;
        err.providerType = "authentication_error";
        callOpportunityAI.mockRejectedValue(err);

        await extractOpportunities({ body: { researchText: "text" } }, mockRes());

        const [diagnostic] = logger.error.mock.calls[0];
        expect(diagnostic).toMatchObject({
          name: "Error",
          status: 401,
          hasProviderResponse: true,
          providerStatus: 401,
          providerType: "authentication_error",
        });
      });

      it("bakes the diagnostic into the visible log message text, including which provider is active, not just a hidden merging-object field", async () => {
        checkOpportunityAIConfig.mockReturnValue(configuredOk("gemini"));
        const err = new Error("Provider API error (401): authentication_error");
        err.status = 401;
        err.providerType = "authentication_error";
        callOpportunityAI.mockRejectedValue(err);

        await extractOpportunities({ body: { researchText: "text" } }, mockRes());

        const [, message] = logger.error.mock.calls[0];
        expect(message).toContain("[OpportunityImport] AI extraction call failed");
        expect(message).toContain("provider: gemini");
        expect(message).toContain('"status":401');
        expect(message).toContain('"providerType":"authentication_error"');
      });

      it("marks hasProviderResponse:false and kind:'network_or_config' when no HTTP status exists (fetch itself failed)", async () => {
        const err = new Error("Failed to reach the AI provider: fetch failed");
        // deliberately no err.status — simulates a network-level failure,
        // which neither geminiClient.js nor anthropicClient.js ever
        // attaches .status to.
        callOpportunityAI.mockRejectedValue(err);

        await extractOpportunities({ body: { researchText: "text" } }, mockRes());

        const [diagnostic] = logger.error.mock.calls[0];
        expect(diagnostic.hasProviderResponse).toBe(false);
        expect(diagnostic.providerStatus).toBeNull();
        expect(diagnostic.kind).toBe("network_or_config");
      });

      it("marks hasProviderResponse:true and kind:'provider_response' when a real HTTP status came back", async () => {
        const err = new Error("Provider API error (429): rate_limit_error");
        err.status = 429;
        err.providerType = "rate_limit_error";
        callOpportunityAI.mockRejectedValue(err);

        await extractOpportunities({ body: { researchText: "text" } }, mockRes());

        const [diagnostic] = logger.error.mock.calls[0];
        expect(diagnostic.hasProviderResponse).toBe(true);
        expect(diagnostic.kind).toBe("provider_response");
      });

      it("includes err.code when present (e.g. a network-level failure code)", async () => {
        const err = new Error("Failed to reach the AI provider: connect ECONNREFUSED");
        err.code = "ECONNREFUSED";
        callOpportunityAI.mockRejectedValue(err);

        await extractOpportunities({ body: { researchText: "text" } }, mockRes());

        const [diagnostic] = logger.error.mock.calls[0];
        expect(diagnostic.code).toBe("ECONNREFUSED");
      });

      it("never logs the configured provider's API key, providerBody, or the research text in the diagnostic", async () => {
        const originalKey = process.env.GEMINI_API_KEY;
        process.env.GEMINI_API_KEY = "the-real-configured-secret-key";
        try {
          const err = new Error("Provider API error (401): authentication_error");
          err.status = 401;
          err.providerBody = '{"error":{"message":"invalid key"}}'; // raw provider body — must not be logged
          err.providerType = "authentication_error";
          callOpportunityAI.mockRejectedValue(err);

          const secretResearchText = "CONFIDENTIAL RESEARCH — must not leak into logs";
          await extractOpportunities({ body: { researchText: secretResearchText } }, mockRes());

          const [diagnostic, message] = logger.error.mock.calls[0];
          const serializedDiagnostic = JSON.stringify(diagnostic);

          // The real configured secret must never appear anywhere in the
          // logged output, in either form.
          expect(serializedDiagnostic).not.toContain(process.env.GEMINI_API_KEY);
          expect(message).not.toContain(process.env.GEMINI_API_KEY);
          // The diagnostic is a fixed, narrow field set — providerBody
          // (the provider's raw, unbounded response text) is deliberately
          // excluded from it, only the extracted providerType is kept.
          expect(diagnostic.providerBody).toBeUndefined();
          // The admin's pasted research text must never end up in a log
          // line either.
          expect(serializedDiagnostic).not.toContain(secretResearchText);
          expect(message).not.toContain(secretResearchText);
        } finally {
          if (originalKey !== undefined) process.env.GEMINI_API_KEY = originalKey;
          else delete process.env.GEMINI_API_KEY;
        }
      });
    });

    it("caps extraction at MAX_OPPORTUNITIES_PER_IMPORT even if the provider returns more", async () => {
      callOpportunityAI.mockResolvedValue({
        opportunities: Array.from({ length: 40 }, (_, i) => validCandidate({ title: `Opportunity ${i}` })),
      });
      const req = { body: { researchText: "a huge list" } };
      const res = mockRes();

      await extractOpportunities(req, res);

      expect(res.json.mock.calls[0][0].opportunities.length).toBeLessThanOrEqual(25);
    });
  });

  describe("importSelectedOpportunities", () => {
    it("returns 503 without an authenticated admin", async () => {
      const req = { body: { opportunities: [validCandidate()] }, userDoc: null };
      const res = mockRes();

      await importSelectedOpportunities(req, res);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(Opportunity.create).not.toHaveBeenCalled();
    });

    it("returns 400 when no opportunities are selected", async () => {
      const req = { body: { opportunities: [] }, userDoc: mockAdmin() };
      const res = mockRes();

      await importSelectedOpportunities(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("imports a single valid opportunity as pending_review, unverified, ai_research", async () => {
      nextSequence.mockResolvedValue(30);
      Opportunity.exists.mockResolvedValue(false);
      Opportunity.create.mockResolvedValue({ _id: "opp1", ccId: "CC/030", title: "MLH Fellowship" });

      const req = { body: { opportunities: [validCandidate()] }, userDoc: mockAdmin() };
      const res = mockRes();

      await importSelectedOpportunities(req, res);

      expect(Opportunity.create).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "pending_review",
          sourceType: "ai_research",
          verificationStatus: "unverified",
          ccId: "CC/030",
        })
      );
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it("imports multiple opportunities in one call, each with its own CC-ID", async () => {
      nextSequence.mockResolvedValueOnce(31).mockResolvedValueOnce(32);
      Opportunity.exists.mockResolvedValue(false);
      Opportunity.create
        .mockResolvedValueOnce({ _id: "opp1", ccId: "CC/031", title: "A" })
        .mockResolvedValueOnce({ _id: "opp2", ccId: "CC/032", title: "B" });

      const req = {
        body: { opportunities: [validCandidate({ title: "A" }), validCandidate({ title: "B" })] },
        userDoc: mockAdmin(),
      };
      const res = mockRes();

      await importSelectedOpportunities(req, res);

      const payload = res.json.mock.calls[0][0];
      expect(payload.imported).toHaveLength(2);
      expect(payload.imported.map((o) => o.ccId)).toEqual(["CC/031", "CC/032"]);
    });

    it("forces verificationStatus to unverified even if the client tries to send 'verified'", async () => {
      nextSequence.mockResolvedValue(33);
      Opportunity.exists.mockResolvedValue(false);
      Opportunity.create.mockResolvedValue({ _id: "opp1", ccId: "CC/033", title: "X" });

      const req = {
        body: { opportunities: [validCandidate({ verificationStatus: "verified" })] },
        userDoc: mockAdmin(),
      };
      await importSelectedOpportunities(req, mockRes());

      expect(Opportunity.create).toHaveBeenCalledWith(
        expect.objectContaining({ verificationStatus: "unverified" })
      );
    });

    it("does not auto-publish — status is never anything but pending_review from this path", async () => {
      nextSequence.mockResolvedValue(34);
      Opportunity.exists.mockResolvedValue(false);
      Opportunity.create.mockResolvedValue({ _id: "opp1", ccId: "CC/034", title: "X" });

      const req = {
        body: { opportunities: [validCandidate({ status: "published" })] }, // client attempts to force it
        userDoc: mockAdmin(),
      };
      await importSelectedOpportunities(req, mockRes());

      expect(Opportunity.create).toHaveBeenCalledWith(expect.objectContaining({ status: "pending_review" }));
    });

    it("rejects a malformed candidate (schema validation) without failing the whole batch", async () => {
      nextSequence.mockResolvedValue(35);
      Opportunity.exists.mockResolvedValue(false);
      Opportunity.create.mockResolvedValue({ _id: "opp1", ccId: "CC/035", title: "Valid one" });

      const malformed = validCandidate({ officialApplicationUrl: "not-a-url", title: "Broken one" });
      const valid = validCandidate({ title: "Valid one" });

      const req = { body: { opportunities: [malformed, valid] }, userDoc: mockAdmin() };
      const res = mockRes();

      await importSelectedOpportunities(req, res);

      const payload = res.json.mock.calls[0][0];
      expect(payload.imported).toHaveLength(1);
      expect(payload.imported[0].title).toBe("Valid one");
      expect(payload.failed).toHaveLength(1);
      expect(payload.failed[0].title).toBe("Broken one");
    });

    it("returns 400 when every candidate in the batch fails validation", async () => {
      const req = {
        body: { opportunities: [validCandidate({ officialApplicationUrl: "not-a-url" })] },
        userDoc: mockAdmin(),
      };
      const res = mockRes();

      await importSelectedOpportunities(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(Opportunity.create).not.toHaveBeenCalled();
    });

    it("records a single bulk audit log entry, not one per opportunity", async () => {
      nextSequence.mockResolvedValueOnce(36).mockResolvedValueOnce(37);
      Opportunity.exists.mockResolvedValue(false);
      Opportunity.create
        .mockResolvedValueOnce({ _id: "opp1", ccId: "CC/036", title: "A" })
        .mockResolvedValueOnce({ _id: "opp2", ccId: "CC/037", title: "B" });

      const req = {
        body: { opportunities: [validCandidate({ title: "A" }), validCandidate({ title: "B" })] },
        userDoc: mockAdmin(),
      };
      await importSelectedOpportunities(req, mockRes());

      expect(recordAdminAction).toHaveBeenCalledTimes(1);
      expect(recordAdminAction).toHaveBeenCalledWith(
        expect.objectContaining({ action: "opportunity.import_bulk" })
      );
    });

    it("rejects a batch larger than the max import size", async () => {
      const req = {
        body: { opportunities: Array.from({ length: 30 }, () => validCandidate()) },
        userDoc: mockAdmin(),
      };
      const res = mockRes();

      await importSelectedOpportunities(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(Opportunity.create).not.toHaveBeenCalled();
    });
  });
});
