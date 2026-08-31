import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("../models/FeatureRequest.js", () => ({
  default: { find: vi.fn(), countDocuments: vi.fn() },
}));
vi.mock("../services/featureRequests.js", () => ({
  updateFeatureRequestStatus: vi.fn(),
  retryPendingFeatureRequestRewards: vi.fn(),
}));
vi.mock("../services/adminAuditLog.js", () => ({
  recordAdminAction: vi.fn(),
}));

import FeatureRequest from "../models/FeatureRequest.js";
import {
  updateFeatureRequestStatus,
  retryPendingFeatureRequestRewards,
} from "../services/featureRequests.js";
import { recordAdminAction } from "../services/adminAuditLog.js";
import {
  listFeatureRequestsAdmin,
  updateFeatureRequestStatusAdmin,
  retryFeatureRequestRewardsAdmin,
} from "./adminFeatureRequestController.js";

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

beforeEach(() => {
  vi.clearAllMocks();
});

describe("listFeatureRequestsAdmin", () => {
  function mockQueryChain(result) {
    const chain = {
      sort: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      populate: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue(result),
    };
    FeatureRequest.find.mockReturnValueOnce(chain);
    return chain;
  }

  it("shows every status by default — no implicit queue filter, unlike Contribution's admin listing", async () => {
    mockQueryChain([{ _id: "fr1" }]);
    FeatureRequest.countDocuments.mockResolvedValueOnce(1);
    const req = mockReq();
    const res = mockRes();

    await listFeatureRequestsAdmin(req, res);

    expect(FeatureRequest.find).toHaveBeenCalledWith({});
    expect(FeatureRequest.countDocuments).toHaveBeenCalledWith({});
  });

  it("filters by an explicit status when given", async () => {
    mockQueryChain([]);
    FeatureRequest.countDocuments.mockResolvedValueOnce(0);
    const req = mockReq({ query: { status: "withdrawn" } });
    const res = mockRes();

    await listFeatureRequestsAdmin(req, res);

    expect(FeatureRequest.find).toHaveBeenCalledWith({ status: "withdrawn" });
  });

  it("sorts by voteCount by default and by recency when sort='recent'", async () => {
    const chain = mockQueryChain([]);
    FeatureRequest.countDocuments.mockResolvedValueOnce(0);
    const req = mockReq({ query: { sort: "recent" } });
    const res = mockRes();

    await listFeatureRequestsAdmin(req, res);

    expect(chain.sort).toHaveBeenCalledWith({ createdAt: -1 });
  });

  it("defaults page/limit when not provided, and caps limit at 100", async () => {
    const chain = mockQueryChain([]);
    FeatureRequest.countDocuments.mockResolvedValueOnce(0);
    const req = mockReq({ query: { limit: "500" } });
    const res = mockRes();

    await listFeatureRequestsAdmin(req, res);

    expect(chain.skip).toHaveBeenCalledWith(0);
    expect(chain.limit).toHaveBeenCalledWith(100);
  });
});

describe("updateFeatureRequestStatusAdmin", () => {
  it("transitions status, records the admin action, and returns the result on success", async () => {
    updateFeatureRequestStatus.mockResolvedValueOnce({ updated: true, rewardStatus: "issued" });
    const req = mockReq({ params: { id: "fr1" }, body: { status: "shipped" } });
    const res = mockRes();

    await updateFeatureRequestStatusAdmin(req, res);

    expect(updateFeatureRequestStatus).toHaveBeenCalledWith({
      featureRequestId: "fr1",
      status: "shipped",
      reviewerId: "admin1",
    });
    expect(recordAdminAction).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "feature_request.update_status",
        targetType: "FeatureRequest",
        targetId: "fr1",
        details: { status: "shipped", rewardStatus: "issued" },
      })
    );
    expect(res.json).toHaveBeenCalledWith({ updated: true, rewardStatus: "issued" });
  });

  it("returns 409 and does not record an admin action when the transition fails", async () => {
    updateFeatureRequestStatus.mockResolvedValueOnce({
      updated: false,
      reason: "not_found_or_already_terminal",
    });
    const req = mockReq({ params: { id: "fr1" }, body: { status: "planned" } });
    const res = mockRes();

    await updateFeatureRequestStatusAdmin(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(recordAdminAction).not.toHaveBeenCalled();
  });

  it("returns 503 when req.userDoc is null (DB down)", async () => {
    const req = mockReq({ userDoc: null, params: { id: "fr1" }, body: { status: "planned" } });
    const res = mockRes();

    await updateFeatureRequestStatusAdmin(req, res);

    expect(res.status).toHaveBeenCalledWith(503);
    expect(updateFeatureRequestStatus).not.toHaveBeenCalled();
  });
});

describe("retryFeatureRequestRewardsAdmin", () => {
  it("passes limit through when provided and records the admin action", async () => {
    retryPendingFeatureRequestRewards.mockResolvedValueOnce({
      attempted: 3,
      issued: 2,
      stillUnissued: 1,
    });
    const req = mockReq({ body: { limit: 50 } });
    const res = mockRes();

    await retryFeatureRequestRewardsAdmin(req, res);

    expect(retryPendingFeatureRequestRewards).toHaveBeenCalledWith({ limit: 50 });
    expect(recordAdminAction).toHaveBeenCalledWith(
      expect.objectContaining({ action: "feature_request.retry_rewards" })
    );
    expect(res.json).toHaveBeenCalledWith({ attempted: 3, issued: 2, stillUnissued: 1 });
  });

  it("calls the service with no options when limit is omitted", async () => {
    retryPendingFeatureRequestRewards.mockResolvedValueOnce({
      attempted: 0,
      issued: 0,
      stillUnissued: 0,
    });
    const req = mockReq();
    const res = mockRes();

    await retryFeatureRequestRewardsAdmin(req, res);

    expect(retryPendingFeatureRequestRewards).toHaveBeenCalledWith({});
  });
});