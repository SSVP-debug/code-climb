import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("../models/RewardCatalogItem.js", () => ({
  default: { find: vi.fn(), countDocuments: vi.fn(), create: vi.fn(), findByIdAndUpdate: vi.fn() },
}));
vi.mock("../models/RewardRedemption.js", () => ({
  default: { find: vi.fn(), countDocuments: vi.fn() },
}));
vi.mock("../services/rewardStore.js", () => ({
  fulfillRedemption: vi.fn(),
  rejectRedemption: vi.fn(),
}));
vi.mock("../services/adminAuditLog.js", () => ({
  recordAdminAction: vi.fn(),
}));

import RewardCatalogItem from "../models/RewardCatalogItem.js";
import RewardRedemption from "../models/RewardRedemption.js";
import { fulfillRedemption, rejectRedemption } from "../services/rewardStore.js";
import { recordAdminAction } from "../services/adminAuditLog.js";
import {
  listCatalogItemsAdmin,
  createCatalogItemAdmin,
  updateCatalogItemAdmin,
  listRedemptionsAdmin,
  fulfillRedemptionAdmin,
  rejectRedemptionAdmin,
} from "./adminRewardStoreController.js";

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

function mockQueryChain(model, result, { withPopulate = false } = {}) {
  const chain = {
    sort: vi.fn().mockReturnThis(),
    skip: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    lean: vi.fn().mockResolvedValue(result),
  };
  if (withPopulate) chain.populate = vi.fn().mockReturnThis();
  model.find.mockReturnValueOnce(chain);
  return chain;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("listCatalogItemsAdmin", () => {
  it("defaults to status=all (no filter) — sees active AND inactive items", async () => {
    mockQueryChain(RewardCatalogItem, [{ _id: "item1" }]);
    RewardCatalogItem.countDocuments.mockResolvedValueOnce(1);
    const req = mockReq();

    await listCatalogItemsAdmin(req, mockRes());

    expect(RewardCatalogItem.find).toHaveBeenCalledWith({});
  });

  it("filters to active:true when status=active is given", async () => {
    mockQueryChain(RewardCatalogItem, []);
    RewardCatalogItem.countDocuments.mockResolvedValueOnce(0);
    const req = mockReq({ query: { status: "active" } });

    await listCatalogItemsAdmin(req, mockRes());

    expect(RewardCatalogItem.find).toHaveBeenCalledWith({ active: true });
  });

  it("filters to active:false when status=inactive is given", async () => {
    mockQueryChain(RewardCatalogItem, []);
    RewardCatalogItem.countDocuments.mockResolvedValueOnce(0);
    const req = mockReq({ query: { status: "inactive" } });

    await listCatalogItemsAdmin(req, mockRes());

    expect(RewardCatalogItem.find).toHaveBeenCalledWith({ active: false });
  });
});

describe("createCatalogItemAdmin", () => {
  it("stamps createdBy from req.userDoc, records an admin action, and returns 201", async () => {
    RewardCatalogItem.create.mockResolvedValueOnce({
      _id: "item1",
      name: "Hoodie",
      costCredits: 500,
    });
    const req = mockReq({ body: { name: "Hoodie", costCredits: 500 } });
    const res = mockRes();

    await createCatalogItemAdmin(req, res);

    expect(RewardCatalogItem.create).toHaveBeenCalledWith({
      name: "Hoodie",
      costCredits: 500,
      createdBy: "admin1",
    });
    expect(recordAdminAction).toHaveBeenCalledWith(
      expect.objectContaining({ action: "reward_store.create_item" })
    );
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it("returns 503 when req.userDoc is null (DB down)", async () => {
    const req = mockReq({ userDoc: null });
    const res = mockRes();

    await createCatalogItemAdmin(req, res);

    expect(res.status).toHaveBeenCalledWith(503);
    expect(RewardCatalogItem.create).not.toHaveBeenCalled();
  });
});

describe("updateCatalogItemAdmin", () => {
  it("applies a partial $set and returns the updated item", async () => {
    RewardCatalogItem.findByIdAndUpdate.mockResolvedValueOnce({ _id: "item1", active: false });
    const req = mockReq({ params: { id: "item1" }, body: { active: false } });
    const res = mockRes();

    await updateCatalogItemAdmin(req, res);

    expect(RewardCatalogItem.findByIdAndUpdate).toHaveBeenCalledWith(
      "item1",
      { $set: { active: false } },
      { new: true }
    );
    expect(res.json).toHaveBeenCalledWith({ item: { _id: "item1", active: false } });
  });

  it("returns 404 when the item doesn't exist", async () => {
    RewardCatalogItem.findByIdAndUpdate.mockResolvedValueOnce(null);
    const req = mockReq({ params: { id: "missing" }, body: { active: false } });
    const res = mockRes();

    await updateCatalogItemAdmin(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});

describe("listRedemptionsAdmin", () => {
  it("defaults to the pending fulfillment queue when no status is given", async () => {
    mockQueryChain(RewardRedemption, [{ _id: "r1" }], { withPopulate: true });
    RewardRedemption.countDocuments.mockResolvedValueOnce(1);
    const req = mockReq();

    await listRedemptionsAdmin(req, mockRes());

    expect(RewardRedemption.find).toHaveBeenCalledWith({ status: "pending" });
  });

  it("respects an explicit status query param", async () => {
    mockQueryChain(RewardRedemption, [], { withPopulate: true });
    RewardRedemption.countDocuments.mockResolvedValueOnce(0);
    const req = mockReq({ query: { status: "fulfilled" } });

    await listRedemptionsAdmin(req, mockRes());

    expect(RewardRedemption.find).toHaveBeenCalledWith({ status: "fulfilled" });
  });

  it("returns everything when status=all", async () => {
    mockQueryChain(RewardRedemption, [], { withPopulate: true });
    RewardRedemption.countDocuments.mockResolvedValueOnce(0);
    const req = mockReq({ query: { status: "all" } });

    await listRedemptionsAdmin(req, mockRes());

    expect(RewardRedemption.find).toHaveBeenCalledWith({});
  });
});

describe("fulfillRedemptionAdmin", () => {
  it("calls the service, records an admin action, and returns the result on success", async () => {
    fulfillRedemption.mockResolvedValueOnce({ fulfilled: true });
    const req = mockReq({ params: { id: "r1" }, body: { adminNotes: "Shipped" } });
    const res = mockRes();

    await fulfillRedemptionAdmin(req, res);

    expect(fulfillRedemption).toHaveBeenCalledWith({
      redemptionId: "r1",
      reviewerId: "admin1",
      adminNotes: "Shipped",
    });
    expect(recordAdminAction).toHaveBeenCalledWith(
      expect.objectContaining({ action: "reward_store.fulfill_redemption" })
    );
    expect(res.json).toHaveBeenCalledWith({ fulfilled: true });
  });

  it("returns 409 when the service reports fulfilled:false, and does NOT record an admin action", async () => {
    fulfillRedemption.mockResolvedValueOnce({
      fulfilled: false,
      reason: "not_found_or_not_pending",
    });
    const req = mockReq({ params: { id: "r1" } });
    const res = mockRes();

    await fulfillRedemptionAdmin(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(recordAdminAction).not.toHaveBeenCalled();
  });
});

describe("rejectRedemptionAdmin", () => {
  it("calls the service with the rejection reason and returns the result on success", async () => {
    rejectRedemption.mockResolvedValueOnce({ rejected: true });
    const req = mockReq({ params: { id: "r1" }, body: { reason: "Out of stock" } });
    const res = mockRes();

    await rejectRedemptionAdmin(req, res);

    expect(rejectRedemption).toHaveBeenCalledWith({
      redemptionId: "r1",
      reviewerId: "admin1",
      reason: "Out of stock",
    });
    expect(res.json).toHaveBeenCalledWith({ rejected: true });
  });

  it("returns 409 when the service reports rejected:false", async () => {
    rejectRedemption.mockResolvedValueOnce({ rejected: false, reason: "not_found_or_not_pending" });
    const req = mockReq({ params: { id: "r1" } });
    const res = mockRes();

    await rejectRedemptionAdmin(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
  });
});