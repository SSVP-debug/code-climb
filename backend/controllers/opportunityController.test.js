import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("../models/Opportunity.js", () => ({
  default: {
    find: vi.fn(),
    findOne: vi.fn(),
    updateOne: vi.fn(),
  },
}));
vi.mock("../config/logger.js", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import Opportunity from "../models/Opportunity.js";
import {
  listOpportunities,
  getOpportunity,
  trackView,
  trackApplyClick,
} from "./opportunityController.js";

function mockRes() {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  res.end = vi.fn().mockReturnValue(res);
  return res;
}

function mockQueryChain(resolvedValue) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    sort: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    lean: vi.fn().mockResolvedValue(resolvedValue),
  };
  return chain;
}

describe("opportunityController.js — public routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("listOpportunities", () => {
    it("only ever queries status: published", async () => {
      Opportunity.find.mockReturnValue(mockQueryChain([]));
      const req = { query: {} };
      const res = mockRes();

      await listOpportunities(req, res);

      expect(Opportunity.find).toHaveBeenCalledWith(
        expect.objectContaining({ status: "published" })
      );
    });

    it("filters out opportunities whose deadline has already passed, even if status is stale", async () => {
      const past = new Date(Date.now() - 100000).toISOString();
      const future = new Date(Date.now() + 100000).toISOString();
      Opportunity.find.mockReturnValue(
        mockQueryChain([
          { ccId: "CC/001", applicationDeadline: past },
          { ccId: "CC/002", applicationDeadline: future },
          { ccId: "CC/003", applicationDeadline: null },
        ])
      );
      const req = { query: {} };
      const res = mockRes();

      await listOpportunities(req, res);

      const returned = res.json.mock.calls[0][0].opportunities.map((o) => o.ccId);
      expect(returned).toEqual(["CC/002", "CC/003"]);
    });
  });

  describe("getOpportunity", () => {
    function mockDoc(overrides = {}) {
      return {
        ccId: "CC/001",
        status: "published",
        applicationDeadline: null,
        isExpiredByDeadline: vi.fn().mockReturnValue(false),
        save: vi.fn().mockResolvedValue(undefined),
        ...overrides,
      };
    }

    it("returns 404 for an opportunity that isn't published or expired (e.g. draft)", async () => {
      Opportunity.findOne.mockReturnValue({
        select: vi.fn().mockResolvedValue(mockDoc({ status: "draft" })),
      });
      const req = { params: { ccId: "027" } };
      const res = mockRes();

      await getOpportunity(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("returns 404 when no opportunity matches", async () => {
      Opportunity.findOne.mockReturnValue({ select: vi.fn().mockResolvedValue(null) });
      const req = { params: { ccId: "999" } };
      const res = mockRes();

      await getOpportunity(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("flips a published-but-past-deadline doc to expired and still returns it (Applications closed)", async () => {
      const doc = mockDoc({ status: "published", isExpiredByDeadline: vi.fn().mockReturnValue(true) });
      Opportunity.findOne.mockReturnValue({ select: vi.fn().mockResolvedValue(doc) });
      const req = { params: { ccId: "001" } };
      const res = mockRes();

      await getOpportunity(req, res);

      expect(doc.status).toBe("expired");
      expect(doc.save).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalledWith(404);
    });

    it("returns 200 for a published opportunity", async () => {
      Opportunity.findOne.mockReturnValue({ select: vi.fn().mockResolvedValue(mockDoc()) });
      const req = { params: { ccId: "CC/001" } };
      const res = mockRes();

      await getOpportunity(req, res);

      expect(res.status).not.toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalled();
    });
  });

  describe("trackView", () => {
    it("increments viewCount only for published/expired opportunities", async () => {
      Opportunity.updateOne.mockResolvedValue({});
      const req = { params: { ccId: "CC/001" } };
      const res = mockRes();

      await trackView(req, res);

      expect(Opportunity.updateOne).toHaveBeenCalledWith(
        { ccNumber: 1, status: { $in: ["published", "expired"] } },
        { $inc: { viewCount: 1 } }
      );
      expect(res.status).toHaveBeenCalledWith(204);
    });

    it("never throws or 500s even if the DB write fails (must not break page load)", async () => {
      Opportunity.updateOne.mockRejectedValue(new Error("db down"));
      const req = { params: { ccId: "CC/001" } };
      const res = mockRes();

      await trackView(req, res);

      expect(res.status).toHaveBeenCalledWith(204);
    });
  });

  describe("trackApplyClick", () => {
    it("increments applyClickCount and the correct source bucket", async () => {
      Opportunity.updateOne.mockResolvedValue({});
      const req = { params: { ccId: "CC/001" }, body: { source: "whatsapp" } };
      const res = mockRes();

      await trackApplyClick(req, res);

      expect(Opportunity.updateOne).toHaveBeenCalledWith(
        { ccNumber: 1, status: { $in: ["published", "expired"] } },
        { $inc: { applyClickCount: 1, "sourceBreakdown.whatsapp": 1 } }
      );
    });

    it("falls back to 'other' for an unrecognized source value", async () => {
      Opportunity.updateOne.mockResolvedValue({});
      const req = { params: { ccId: "CC/001" }, body: { source: "instagram" } };
      const res = mockRes();

      await trackApplyClick(req, res);

      expect(Opportunity.updateOne).toHaveBeenCalledWith(
        expect.anything(),
        { $inc: { applyClickCount: 1, "sourceBreakdown.other": 1 } }
      );
    });

    it("defaults to 'direct' when no source is provided", async () => {
      Opportunity.updateOne.mockResolvedValue({});
      const req = { params: { ccId: "CC/001" }, body: {} };
      const res = mockRes();

      await trackApplyClick(req, res);

      expect(Opportunity.updateOne).toHaveBeenCalledWith(
        expect.anything(),
        { $inc: { applyClickCount: 1, "sourceBreakdown.direct": 1 } }
      );
    });
  });
});
