import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("../models/Contribution.js", () => ({
  default: { find: vi.fn(), countDocuments: vi.fn() },
}));
vi.mock("../services/contribution.js", () => ({
  approveContribution: vi.fn(),
  rejectContribution: vi.fn(),
  retryPendingContributionRewards: vi.fn(),
}));
vi.mock("../services/adminAuditLog.js", () => ({
  recordAdminAction: vi.fn(),
}));

import Contribution from "../models/Contribution.js";
import {
  approveContribution,
  rejectContribution,
  retryPendingContributionRewards,
} from "../services/contribution.js";
import { recordAdminAction } from "../services/adminAuditLog.js";
import {
  listContributionsAdmin,
  approveContributionAdmin,
  rejectContributionAdmin,
  retryContributionRewardsAdmin,
} from "./adminContributionController.js";

function mockRes() {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

function mockAdmin() {
  return { _id: "admin1", email: "admin@codeclub.in", role: "admin" };
}

function mockReq(overrides = {}) {
  return {
    userDoc: mockAdmin(),
    params: {},
    body: {},
    query: {},
    log: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
    ...overrides,
  };
}

describe("adminContributionController.js", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("listContributionsAdmin", () => {
    function mockQueryChain(result) {
      const chain = {
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        populate: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue(result),
      };
      Contribution.find.mockReturnValueOnce(chain);
      return chain;
    }

    it("defaults to the pending review queue when no status is given", async () => {
      mockQueryChain([{ _id: "c1" }]);
      Contribution.countDocuments.mockResolvedValueOnce(1);
      const req = mockReq();
      const res = mockRes();

      await listContributionsAdmin(req, res);

      expect(Contribution.find).toHaveBeenCalledWith({ status: "pending" });
      expect(Contribution.countDocuments).toHaveBeenCalledWith({ status: "pending" });
    });

    it("filters by an explicit status query param", async () => {
      mockQueryChain([]);
      Contribution.countDocuments.mockResolvedValueOnce(0);
      const req = mockReq({ query: { status: "approved" } });
      const res = mockRes();

      await listContributionsAdmin(req, res);

      expect(Contribution.find).toHaveBeenCalledWith({ status: "approved" });
    });

    it("removes the status filter entirely when status=all", async () => {
      mockQueryChain([]);
      Contribution.countDocuments.mockResolvedValueOnce(0);
      const req = mockReq({ query: { status: "all" } });
      const res = mockRes();

      await listContributionsAdmin(req, res);

      expect(Contribution.find).toHaveBeenCalledWith({});
      expect(Contribution.countDocuments).toHaveBeenCalledWith({});
    });

    it("sorts oldest-first (a review queue, not a feed)", async () => {
      const chain = mockQueryChain([]);
      Contribution.countDocuments.mockResolvedValueOnce(0);
      const req = mockReq();
      const res = mockRes();

      await listContributionsAdmin(req, res);

      expect(chain.sort).toHaveBeenCalledWith({ createdAt: 1 });
    });
  });

  describe("approveContributionAdmin", () => {
    it("approves via the service, records an audit action, and returns the result", async () => {
      approveContribution.mockResolvedValueOnce({ approved: true, rewardStatus: "issued" });
      const req = mockReq({ params: { id: "c1" } });
      const res = mockRes();

      await approveContributionAdmin(req, res);

      expect(approveContribution).toHaveBeenCalledWith({
        contributionId: "c1",
        reviewerId: "admin1",
      });
      expect(recordAdminAction).toHaveBeenCalledWith(
        expect.objectContaining({
          adminDoc: mockAdmin(),
          action: "contribution.approve",
          targetType: "Contribution",
          targetId: "c1",
          details: { rewardStatus: "issued" },
        })
      );
      expect(res.json).toHaveBeenCalledWith({ approved: true, rewardStatus: "issued" });
    });

    it("returns 409 without recording an audit action when the contribution can't be approved", async () => {
      approveContribution.mockResolvedValueOnce({
        approved: false,
        reason: "not_found_or_not_pending",
      });
      const req = mockReq({ params: { id: "c1" } });
      const res = mockRes();

      await approveContributionAdmin(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(recordAdminAction).not.toHaveBeenCalled();
    });

    it("returns 503 when req.userDoc is null (DB down)", async () => {
      const req = mockReq({ userDoc: null, params: { id: "c1" } });
      const res = mockRes();

      await approveContributionAdmin(req, res);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(approveContribution).not.toHaveBeenCalled();
    });

    it("returns 500 when the service throws", async () => {
      approveContribution.mockRejectedValueOnce(new Error("boom"));
      const req = mockReq({ params: { id: "c1" } });
      const res = mockRes();

      await approveContributionAdmin(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("rejectContributionAdmin", () => {
    it("rejects via the service with the given reason and records an audit action", async () => {
      rejectContribution.mockResolvedValueOnce({ rejected: true });
      const req = mockReq({ params: { id: "c1" }, body: { reason: "duplicate" } });
      const res = mockRes();

      await rejectContributionAdmin(req, res);

      expect(rejectContribution).toHaveBeenCalledWith({
        contributionId: "c1",
        reviewerId: "admin1",
        reason: "duplicate",
      });
      expect(recordAdminAction).toHaveBeenCalledWith(
        expect.objectContaining({ action: "contribution.reject", targetId: "c1" })
      );
      expect(res.json).toHaveBeenCalledWith({ rejected: true });
    });

    it("returns 409 without recording an audit action when the contribution can't be rejected", async () => {
      rejectContribution.mockResolvedValueOnce({
        rejected: false,
        reason: "not_found_or_not_pending",
      });
      const req = mockReq({ params: { id: "c1" }, body: {} });
      const res = mockRes();

      await rejectContributionAdmin(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(recordAdminAction).not.toHaveBeenCalled();
    });
  });

  describe("retryContributionRewardsAdmin", () => {
    it("calls the reconciliation service and returns its result", async () => {
      retryPendingContributionRewards.mockResolvedValueOnce({
        attempted: 3,
        issued: 2,
        stillUnissued: 1,
      });
      const req = mockReq({ body: {} });
      const res = mockRes();

      await retryContributionRewardsAdmin(req, res);

      expect(retryPendingContributionRewards).toHaveBeenCalledWith({});
      expect(res.json).toHaveBeenCalledWith({ attempted: 3, issued: 2, stillUnissued: 1 });
    });

    it("passes through a custom limit from the request body", async () => {
      retryPendingContributionRewards.mockResolvedValueOnce({
        attempted: 0,
        issued: 0,
        stillUnissued: 0,
      });
      const req = mockReq({ body: { limit: 25 } });
      const res = mockRes();

      await retryContributionRewardsAdmin(req, res);

      expect(retryPendingContributionRewards).toHaveBeenCalledWith({ limit: 25 });
    });

    it("records an admin audit action with the reconciliation result", async () => {
      retryPendingContributionRewards.mockResolvedValueOnce({
        attempted: 1,
        issued: 1,
        stillUnissued: 0,
      });
      const req = mockReq({ body: {} });
      const res = mockRes();

      await retryContributionRewardsAdmin(req, res);

      expect(recordAdminAction).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "contribution.retry_rewards",
          targetType: "Contribution",
          details: { attempted: 1, issued: 1, stillUnissued: 0 },
        })
      );
    });

    it("returns 500 without throwing if the reconciliation service errors", async () => {
      retryPendingContributionRewards.mockRejectedValueOnce(new Error("db down"));
      const req = mockReq({ body: {} });
      const res = mockRes();

      await retryContributionRewardsAdmin(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(req.log.error).toHaveBeenCalled();
    });
  });
});