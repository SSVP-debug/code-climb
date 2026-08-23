import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("../models/Opportunity.js", () => ({
  default: {
    find: vi.fn(),
    findById: vi.fn(),
    findOne: vi.fn(),
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
vi.mock("../config/logger.js", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import Opportunity from "../models/Opportunity.js";
import { nextSequence } from "../models/Counter.js";
import { recordAdminAction } from "../services/adminAuditLog.js";
import {
  createOpportunity,
  updateOpportunity,
  submitForReview,
  approveOpportunity,
  publishOpportunity,
  rejectOpportunity,
  archiveOpportunity,
  markExpiredOpportunity,
  duplicateOpportunity,
  getOpportunityAnalytics,
} from "./adminOpportunityController.js";

function mockRes() {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

function mockAdmin() {
  return { _id: "admin1", email: "admin@codeclub.in", role: "admin" };
}

describe("adminOpportunityController.js", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createOpportunity", () => {
    it("allocates a sequential CC-ID via the atomic counter, not a highest-id lookup", async () => {
      nextSequence.mockResolvedValue(7);
      Opportunity.exists.mockResolvedValue(false);
      Opportunity.create.mockResolvedValue({
        _id: "opp1",
        ccId: "CC/007",
        title: "Test",
      });

      const req = { body: { title: "Test Fellowship" }, userDoc: mockAdmin() };
      const res = mockRes();

      await createOpportunity(req, res);

      expect(nextSequence).toHaveBeenCalledWith("opportunity");
      expect(Opportunity.create).toHaveBeenCalledWith(
        expect.objectContaining({ ccId: "CC/007", ccNumber: 7, status: "draft" })
      );
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it("records an admin audit log entry on creation", async () => {
      nextSequence.mockResolvedValue(1);
      Opportunity.exists.mockResolvedValue(false);
      Opportunity.create.mockResolvedValue({ _id: "opp1", ccId: "CC/001", title: "Test" });

      const req = { body: { title: "Test" }, userDoc: mockAdmin() };
      await createOpportunity(req, mockRes());

      expect(recordAdminAction).toHaveBeenCalledWith(
        expect.objectContaining({ action: "opportunity.create" })
      );
    });

    it("returns 503 when there is no authenticated user doc (DB/auth unavailable)", async () => {
      const req = { body: { title: "Test" }, userDoc: null };
      const res = mockRes();

      await createOpportunity(req, res);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(Opportunity.create).not.toHaveBeenCalled();
    });
  });

  describe("status transitions", () => {
    function mockOpp(status) {
      return {
        _id: "opp1",
        ccId: "CC/001",
        status,
        save: vi.fn().mockResolvedValue(undefined),
      };
    }

    it("allows draft -> pending_review via submitForReview", async () => {
      const opp = mockOpp("draft");
      Opportunity.findById.mockResolvedValue(opp);
      const req = { params: { id: "opp1" }, userDoc: mockAdmin(), body: {} };
      const res = mockRes();

      await submitForReview(req, res);

      expect(opp.status).toBe("pending_review");
      expect(res.status).not.toHaveBeenCalledWith(409);
    });

    it("rejects draft -> published directly (must go through pending_review/approved)", async () => {
      const opp = mockOpp("draft");
      Opportunity.findById.mockResolvedValue(opp);
      const req = { params: { id: "opp1" }, userDoc: mockAdmin(), body: {} };
      const res = mockRes();

      await publishOpportunity(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(opp.status).toBe("draft"); // unchanged
    });

    it("allows pending_review -> approved -> published happy path", async () => {
      const opp = mockOpp("pending_review");
      Opportunity.findById.mockResolvedValue(opp);
      const req = { params: { id: "opp1" }, userDoc: mockAdmin(), body: {} };

      await approveOpportunity(req, mockRes());
      expect(opp.status).toBe("approved");

      await publishOpportunity(req, mockRes());
      expect(opp.status).toBe("published");
      expect(opp.publishedAt).toBeInstanceOf(Date);
    });

    it("records a rejection reason on reject", async () => {
      const opp = mockOpp("pending_review");
      Opportunity.findById.mockResolvedValue(opp);
      const req = {
        params: { id: "opp1" },
        userDoc: mockAdmin(),
        body: { reason: "Deadline already passed at time of review" },
      };

      await rejectOpportunity(req, mockRes());

      expect(opp.status).toBe("rejected");
      expect(opp.rejectionReason).toBe("Deadline already passed at time of review");
    });

    it("allows archiving from multiple non-published states", async () => {
      for (const status of ["draft", "pending_review", "approved", "rejected", "expired"]) {
        const opp = mockOpp(status);
        Opportunity.findById.mockResolvedValue(opp);
        const req = { params: { id: "opp1" }, userDoc: mockAdmin(), body: {} };
        await archiveOpportunity(req, mockRes());
        expect(opp.status).toBe("archived");
      }
    });

    it("marks a published opportunity as expired", async () => {
      const opp = mockOpp("published");
      Opportunity.findById.mockResolvedValue(opp);
      const req = { params: { id: "opp1" }, userDoc: mockAdmin(), body: {} };

      await markExpiredOpportunity(req, mockRes());

      expect(opp.status).toBe("expired");
      expect(opp.expiredAt).toBeInstanceOf(Date);
    });

    it("returns 404 when the opportunity doesn't exist", async () => {
      Opportunity.findById.mockResolvedValue(null);
      const req = { params: { id: "missing" }, userDoc: mockAdmin(), body: {} };
      const res = mockRes();

      await approveOpportunity(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe("duplicateOpportunity", () => {
    it("allocates a fresh CC-ID and resets status to draft, ignoring the source's analytics/workflow fields", async () => {
      nextSequence.mockResolvedValue(9);
      Opportunity.exists.mockResolvedValue(false);
      Opportunity.findById.mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          _id: "opp1",
          ccId: "CC/001",
          ccNumber: 1,
          slug: "old-slug",
          title: "Original",
          status: "published",
          viewCount: 500,
          applyClickCount: 100,
          publishedAt: new Date(),
        }),
      });
      Opportunity.create.mockResolvedValue({ _id: "opp2", ccId: "CC/009" });

      const req = { params: { id: "opp1" }, userDoc: mockAdmin() };
      const res = mockRes();

      await duplicateOpportunity(req, res);

      const createArgs = Opportunity.create.mock.calls[0][0];
      expect(createArgs.ccId).toBe("CC/009");
      expect(createArgs.status).toBe("draft");
      expect(createArgs.viewCount).toBeUndefined();
      expect(createArgs.applyClickCount).toBeUndefined();
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe("getOpportunityAnalytics", () => {
    it("returns only real tracked counters, no fabricated metrics", async () => {
      Opportunity.findById.mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          ccId: "CC/027",
          title: "MLH Fellowship",
          viewCount: 2481,
          applyClickCount: 614,
          sourceBreakdown: { whatsapp: 1420, discord: 681, linkedin: 280, direct: 100, other: 0 },
        }),
      });
      const req = { params: { id: "opp1" } };
      const res = mockRes();

      await getOpportunityAnalytics(req, res);

      const payload = res.json.mock.calls[0][0];
      expect(payload.viewCount).toBe(2481);
      expect(payload.applyClickCount).toBe(614);
      expect(payload.clickThroughRate).toBeCloseTo(24.7, 1);
      expect(payload).not.toHaveProperty("shareCount");
    });

    it("returns null click-through-rate (not a fabricated 0) when there are zero views", async () => {
      Opportunity.findById.mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          ccId: "CC/001",
          viewCount: 0,
          applyClickCount: 0,
          sourceBreakdown: {},
        }),
      });
      const req = { params: { id: "opp1" } };
      const res = mockRes();

      await getOpportunityAnalytics(req, res);

      expect(res.json.mock.calls[0][0].clickThroughRate).toBeNull();
    });
  });
});
