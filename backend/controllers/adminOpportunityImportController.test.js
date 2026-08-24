import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

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
vi.mock("../utils/anthropicClient.js", () => ({
  callClaudeJSON: vi.fn(),
}));
vi.mock("../config/logger.js", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import Opportunity from "../models/Opportunity.js";
import { nextSequence } from "../models/Counter.js";
import { recordAdminAction } from "../services/adminAuditLog.js";
import { callClaudeJSON } from "../utils/anthropicClient.js";
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

describe("adminOpportunityImportController.js", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("extractOpportunities", () => {
    const ORIGINAL_ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

    beforeEach(() => {
      // Most tests in this block are about extraction *logic*, not the
      // config-presence check itself — give them a key so they exercise
      // the callClaudeJSON path. The specific "key is missing" behavior
      // is covered by its own tests below, which delete/restore this
      // themselves.
      process.env.ANTHROPIC_API_KEY = "sk-ant-test-key";
    });

    afterEach(() => {
      if (ORIGINAL_ANTHROPIC_API_KEY !== undefined) {
        process.env.ANTHROPIC_API_KEY = ORIGINAL_ANTHROPIC_API_KEY;
      } else {
        delete process.env.ANTHROPIC_API_KEY;
      }
    });

    it("returns 400 for empty research text without ever calling Claude", async () => {
      const req = { body: { researchText: "   " } };
      const res = mockRes();

      await extractOpportunities(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(callClaudeJSON).not.toHaveBeenCalled();
    });

    it("returns 400 for research text exceeding the max length, without calling Claude", async () => {
      const req = { body: { researchText: "x".repeat(20001) } };
      const res = mockRes();

      await extractOpportunities(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(callClaudeJSON).not.toHaveBeenCalled();
    });

    it("extracts a single opportunity from research text", async () => {
      callClaudeJSON.mockResolvedValue({
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
      callClaudeJSON.mockResolvedValue({
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
      callClaudeJSON.mockResolvedValue({
        opportunities: [validCandidate({ officialApplicationUrl: null, flags: [] })],
      });
      const req = { body: { researchText: "some vague text" } };
      const res = mockRes();

      await extractOpportunities(req, res);

      const candidate = res.json.mock.calls[0][0].opportunities[0];
      expect(candidate.officialApplicationUrl).toBe("");
      expect(candidate.flags.some((f) => f.toLowerCase().includes("application url"))).toBe(true);
    });

    it("flags but does not silently drop an ambiguous field Claude already flagged", async () => {
      callClaudeJSON.mockResolvedValue({
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

    it("always returns verificationStatus 'unverified' on every candidate, regardless of what Claude returns", async () => {
      callClaudeJSON.mockResolvedValue({
        opportunities: [validCandidate({ verificationStatus: "verified" })],
      });
      const req = { body: { researchText: "text claiming verification" } };
      const res = mockRes();

      await extractOpportunities(req, res);

      expect(res.json.mock.calls[0][0].opportunities[0].verificationStatus).toBe("unverified");
    });

    it("defaults an unrecognized type to 'other' and flags it rather than guessing", async () => {
      callClaudeJSON.mockResolvedValue({
        opportunities: [validCandidate({ type: "not-a-real-type" })],
      });
      const req = { body: { researchText: "text" } };
      const res = mockRes();

      await extractOpportunities(req, res);

      const candidate = res.json.mock.calls[0][0].opportunities[0];
      expect(candidate.type).toBe("other");
      expect(candidate.flags.some((f) => f.includes("Unrecognized type"))).toBe(true);
    });

    it("handles malformed/non-JSON-shaped Claude output gracefully (no opportunities array)", async () => {
      callClaudeJSON.mockResolvedValue({ notWhatWeExpected: true });
      const req = { body: { researchText: "text" } };
      const res = mockRes();

      await extractOpportunities(req, res);

      expect(res.json.mock.calls[0][0].opportunities).toEqual([]);
    });

    it("returns 503 (not 502) when ANTHROPIC_API_KEY is not set — a missing config, not an upstream outage", async () => {
      delete process.env.ANTHROPIC_API_KEY;

      const req = { body: { researchText: "some research text" } };
      const res = mockRes();

      await extractOpportunities(req, res);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining("Set ANTHROPIC_API_KEY to enable"),
        })
      );
      // Confirms the root-cause fix: no network call is even attempted
      // once the missing key is detected up front.
      expect(callClaudeJSON).not.toHaveBeenCalled();
    });

    it("still returns 503 (defensive fallback) if callClaudeJSON itself throws the missing-key error", async () => {
      // Key IS present (set by the block's beforeEach) so the upfront
      // check passes, but callClaudeJSON throws the same error it would
      // if the env var vanished between the check and the call — the
      // catch block's own message-based fallback should still catch this.
      callClaudeJSON.mockRejectedValue(new Error("ANTHROPIC_API_KEY is not set"));

      const req = { body: { researchText: "text" } };
      const res = mockRes();

      await extractOpportunities(req, res);

      expect(res.status).toHaveBeenCalledWith(503);
    });

    it("returns 502 (genuine upstream failure), distinct from the 503 config case, when Claude is reachable but errors", async () => {
      callClaudeJSON.mockRejectedValue(new Error("Anthropic API error (529): overloaded_error"));

      const req = { body: { researchText: "text" } };
      const res = mockRes();

      await extractOpportunities(req, res);

      expect(res.status).toHaveBeenCalledWith(502);
    });

    it("returns 502 when the Claude call itself fails", async () => {
      callClaudeJSON.mockRejectedValue(new Error("Anthropic API error (500)"));
      const req = { body: { researchText: "text" } };
      const res = mockRes();

      await extractOpportunities(req, res);

      expect(res.status).toHaveBeenCalledWith(502);
    });

    it("caps extraction at MAX_OPPORTUNITIES_PER_IMPORT even if Claude returns more", async () => {
      callClaudeJSON.mockResolvedValue({
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
