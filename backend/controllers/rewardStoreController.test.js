import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("../models/RewardCatalogItem.js", () => ({
  default: { find: vi.fn(), countDocuments: vi.fn() },
}));
vi.mock("../models/RewardRedemption.js", () => ({
  default: { find: vi.fn(), countDocuments: vi.fn() },
}));
vi.mock("../services/rewardStore.js", () => ({
  requestRedemption: vi.fn(),
  cancelRedemption: vi.fn(),
}));

import RewardCatalogItem from "../models/RewardCatalogItem.js";
import RewardRedemption from "../models/RewardRedemption.js";
import { requestRedemption, cancelRedemption } from "../services/rewardStore.js";
import {
  listStoreItems,
  requestRedemptionController,
  getMyRedemptions,
  cancelMyRedemption,
} from "./rewardStoreController.js";

function mockRes() {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

function mockReq(overrides = {}) {
  return {
    userDoc: { _id: "user1" },
    body: {},
    query: {},
    params: {},
    log: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
    ...overrides,
  };
}

function mockQueryChain(model, result) {
  const chain = {
    sort: vi.fn().mockReturnThis(),
    skip: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    lean: vi.fn().mockResolvedValue(result),
  };
  model.find.mockReturnValueOnce(chain);
  return chain;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("listStoreItems", () => {
  it("only ever queries active:true — never returns a soft-disabled item to a student", async () => {
    mockQueryChain(RewardCatalogItem, [{ _id: "item1" }]);
    RewardCatalogItem.countDocuments.mockResolvedValueOnce(1);
    const req = mockReq();
    const res = mockRes();

    await listStoreItems(req, res);

    expect(RewardCatalogItem.find).toHaveBeenCalledWith({ active: true });
    expect(RewardCatalogItem.countDocuments).toHaveBeenCalledWith({ active: true });
  });

  it("caps limit at 100", async () => {
    const chain = mockQueryChain(RewardCatalogItem, []);
    RewardCatalogItem.countDocuments.mockResolvedValueOnce(0);
    const req = mockReq({ query: { limit: "500" } });

    await listStoreItems(req, mockRes());

    expect(chain.limit).toHaveBeenCalledWith(100);
  });
});

describe("requestRedemptionController", () => {
  it("passes userId/itemId/shippingAddress through to the service and returns 201 on success", async () => {
    requestRedemption.mockResolvedValueOnce({ requested: true, redemption: { _id: "r1" } });
    const req = mockReq({ body: { itemId: "item1", shippingAddress: { city: "Bengaluru" } } });
    const res = mockRes();

    await requestRedemptionController(req, res);

    expect(requestRedemption).toHaveBeenCalledWith({
      userId: "user1",
      itemId: "item1",
      shippingAddress: { city: "Bengaluru" },
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ redemption: { _id: "r1" } });
  });

  it("defaults shippingAddress to null when omitted", async () => {
    requestRedemption.mockResolvedValueOnce({ requested: true, redemption: {} });
    const req = mockReq({ body: { itemId: "item1" } });

    await requestRedemptionController(req, mockRes());

    expect(requestRedemption).toHaveBeenCalledWith(
      expect.objectContaining({ shippingAddress: null })
    );
  });

  it("returns 404 when the item isn't found", async () => {
    requestRedemption.mockResolvedValueOnce({ requested: false, reason: "item_not_found" });
    const req = mockReq({ body: { itemId: "missing" } });
    const res = mockRes();

    await requestRedemptionController(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("returns 409 for insufficient_balance", async () => {
    requestRedemption.mockResolvedValueOnce({ requested: false, reason: "insufficient_balance" });
    const req = mockReq({ body: { itemId: "item1" } });
    const res = mockRes();

    await requestRedemptionController(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ reason: "insufficient_balance" })
    );
  });

  it("returns 503 when req.userDoc is null (DB down)", async () => {
    const req = mockReq({ userDoc: null });
    const res = mockRes();

    await requestRedemptionController(req, res);

    expect(res.status).toHaveBeenCalledWith(503);
    expect(requestRedemption).not.toHaveBeenCalled();
  });
});

describe("getMyRedemptions", () => {
  it("scopes the read to req.userDoc._id, never a client-supplied userId", async () => {
    mockQueryChain(RewardRedemption, [{ _id: "r1" }]);
    RewardRedemption.countDocuments.mockResolvedValueOnce(1);
    const req = mockReq({ query: { userId: "someoneElse" } });
    const res = mockRes();

    await getMyRedemptions(req, res);

    expect(RewardRedemption.find).toHaveBeenCalledWith({ userId: "user1" });
    expect(RewardRedemption.countDocuments).toHaveBeenCalledWith({ userId: "user1" });
  });
});

describe("cancelMyRedemption", () => {
  it("passes redemptionId + req.userDoc._id through and returns the result on success", async () => {
    cancelRedemption.mockResolvedValueOnce({ cancelled: true });
    const req = mockReq({ params: { id: "r1" } });
    const res = mockRes();

    await cancelMyRedemption(req, res);

    expect(cancelRedemption).toHaveBeenCalledWith({ redemptionId: "r1", userId: "user1" });
    expect(res.json).toHaveBeenCalledWith({ cancelled: true });
  });

  it("returns 409 when the service reports cancelled:false", async () => {
    cancelRedemption.mockResolvedValueOnce({
      cancelled: false,
      reason: "not_found_or_not_pending",
    });
    const req = mockReq({ params: { id: "r1" } });
    const res = mockRes();

    await cancelMyRedemption(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
  });
});