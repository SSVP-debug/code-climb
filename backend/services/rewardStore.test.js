import { describe, expect, it, vi, beforeEach } from "vitest";
import mongoose from "mongoose";

vi.mock("../models/RewardCatalogItem.js", () => ({
  default: { findById: vi.fn(), updateOne: vi.fn() },
}));
vi.mock("../models/RewardRedemption.js", () => ({
  default: { create: vi.fn(), findOneAndUpdate: vi.fn() },
}));
vi.mock("../models/User.js", () => ({
  default: { findOneAndUpdate: vi.fn(), updateOne: vi.fn(), findById: vi.fn() },
}));
vi.mock("./rewardLedger.js", () => ({
  writeRedemptionLedgerEntry: vi.fn(),
  getBalance: vi.fn(),
  REWARD_TYPES: {
    REDEMPTION_DEBIT: "REDEMPTION_DEBIT",
    REDEMPTION_REVERSED: "REDEMPTION_REVERSED",
  },
}));
vi.mock("../config/logger.js", () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import RewardCatalogItem from "../models/RewardCatalogItem.js";
import RewardRedemption from "../models/RewardRedemption.js";
import User from "../models/User.js";
import { writeRedemptionLedgerEntry, getBalance } from "./rewardLedger.js";
import {
  requestRedemption,
  fulfillRedemption,
  rejectRedemption,
  cancelRedemption,
  reconcileCreditsBalance,
} from "./rewardStore.js";

const userId = new mongoose.Types.ObjectId();
const itemId = new mongoose.Types.ObjectId();
const redemptionId = new mongoose.Types.ObjectId();

const digitalItem = {
  _id: itemId,
  name: "Extra AI Mock Interview",
  costCredits: 50,
  active: true,
  requiresShipping: false,
};

const physicalItem = {
  _id: itemId,
  name: "Code Club Hoodie",
  costCredits: 500,
  active: true,
  requiresShipping: true,
};

const validAddress = {
  recipientName: "Bunny",
  line1: "123 Main St",
  city: "Bengaluru",
  state: "Karnataka",
  postalCode: "560001",
  country: "India",
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("requestRedemption", () => {
  it("returns item_not_found when the item doesn't exist", async () => {
    RewardCatalogItem.findById.mockReturnValue({ lean: vi.fn().mockResolvedValue(null) });

    const result = await requestRedemption({ userId, itemId });

    expect(result).toEqual({ requested: false, reason: "item_not_found" });
    expect(User.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it("returns item_inactive without touching balance when the item is soft-disabled", async () => {
    RewardCatalogItem.findById.mockReturnValue({
      lean: vi.fn().mockResolvedValue({ ...digitalItem, active: false }),
    });

    const result = await requestRedemption({ userId, itemId });

    expect(result).toEqual({ requested: false, reason: "item_inactive" });
    expect(User.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it("returns shipping_address_required for a physical item with no address given", async () => {
    RewardCatalogItem.findById.mockReturnValue({ lean: vi.fn().mockResolvedValue(physicalItem) });

    const result = await requestRedemption({ userId, itemId });

    expect(result).toEqual({ requested: false, reason: "shipping_address_required" });
    expect(User.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it("returns shipping_address_required when the address is missing required fields", async () => {
    RewardCatalogItem.findById.mockReturnValue({ lean: vi.fn().mockResolvedValue(physicalItem) });

    const result = await requestRedemption({
      userId,
      itemId,
      shippingAddress: { recipientName: "Bunny" }, // missing everything else
    });

    expect(result).toEqual({ requested: false, reason: "shipping_address_required" });
  });

  it("returns insufficient_balance when the atomic guard matches nothing, before writing anything else", async () => {
    RewardCatalogItem.findById.mockReturnValue({ lean: vi.fn().mockResolvedValue(digitalItem) });
    User.findOneAndUpdate.mockResolvedValueOnce(null); // $gte guard didn't match

    const result = await requestRedemption({ userId, itemId });

    expect(result).toEqual({ requested: false, reason: "insufficient_balance" });
    expect(User.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: userId, creditsBalance: { $gte: 50 } },
      { $inc: { creditsBalance: -50 } }
    );
    expect(RewardRedemption.create).not.toHaveBeenCalled();
    expect(writeRedemptionLedgerEntry).not.toHaveBeenCalled();
  });

  it("on success: guards balance, creates a pending redemption, writes the debit, and links ledgerEntryId", async () => {
    RewardCatalogItem.findById.mockReturnValue({ lean: vi.fn().mockResolvedValue(digitalItem) });
    User.findOneAndUpdate.mockResolvedValueOnce({ _id: userId, creditsBalance: 50 });
    const saveSpy = vi.fn();
    const createdRedemption = {
      _id: redemptionId,
      save: saveSpy,
    };
    RewardRedemption.create.mockResolvedValueOnce(createdRedemption);
    writeRedemptionLedgerEntry.mockResolvedValueOnce({ entry: { _id: "ledgerEntry1" } });

    const result = await requestRedemption({ userId, itemId });

    expect(RewardRedemption.create).toHaveBeenCalledWith({
      userId,
      itemId,
      itemSnapshot: { name: digitalItem.name, costCredits: 50, requiresShipping: false },
      shippingAddress: null,
      status: "pending",
    });
    expect(writeRedemptionLedgerEntry).toHaveBeenCalledWith({
      userId,
      type: "REDEMPTION_DEBIT",
      amount: -50,
      redemptionId,
      metadata: { itemId: String(itemId), itemName: digitalItem.name },
    });
    expect(createdRedemption.ledgerEntryId).toBe("ledgerEntry1");
    expect(saveSpy).toHaveBeenCalled();
    expect(result).toEqual({ requested: true, redemption: createdRedemption });
  });

  it("on success for a physical item: snapshots requiresShipping and stores the given address", async () => {
    RewardCatalogItem.findById.mockReturnValue({ lean: vi.fn().mockResolvedValue(physicalItem) });
    User.findOneAndUpdate.mockResolvedValueOnce({ _id: userId, creditsBalance: 0 });
    RewardRedemption.create.mockResolvedValueOnce({ _id: redemptionId, save: vi.fn() });
    writeRedemptionLedgerEntry.mockResolvedValueOnce({ entry: { _id: "ledgerEntry2" } });

    await requestRedemption({ userId, itemId, shippingAddress: validAddress });

    expect(RewardRedemption.create).toHaveBeenCalledWith(
      expect.objectContaining({
        itemSnapshot: { name: physicalItem.name, costCredits: 500, requiresShipping: true },
        shippingAddress: validAddress,
      })
    );
  });
});

describe("fulfillRedemption", () => {
  it("returns not_found_or_not_pending when no matching pending row exists", async () => {
    RewardRedemption.findOneAndUpdate.mockResolvedValueOnce(null);

    const result = await fulfillRedemption({ redemptionId, reviewerId: "admin1" });

    expect(result).toEqual({ fulfilled: false, reason: "not_found_or_not_pending" });
    expect(RewardCatalogItem.updateOne).not.toHaveBeenCalled();
  });

  it("transitions to fulfilled, sets resolvedAt/adminNotes, and decrements stock", async () => {
    RewardRedemption.findOneAndUpdate.mockResolvedValueOnce({
      _id: redemptionId,
      itemId,
      status: "fulfilled",
    });

    const result = await fulfillRedemption({
      redemptionId,
      reviewerId: "admin1",
      adminNotes: "Shipped via Speed Post",
    });

    expect(RewardRedemption.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: redemptionId, status: "pending" },
      {
        $set: {
          status: "fulfilled",
          resolvedAt: expect.any(Date),
          adminNotes: "Shipped via Speed Post",
        },
      },
      { new: true }
    );
    expect(RewardCatalogItem.updateOne).toHaveBeenCalledWith(
      { _id: itemId, stock: { $ne: null, $gte: 1 } },
      { $inc: { stock: -1 } }
    );
    expect(result).toEqual({ fulfilled: true });
  });

  it("does NOT write any RewardLedger entry — the debit already happened at request time", async () => {
    RewardRedemption.findOneAndUpdate.mockResolvedValueOnce({ _id: redemptionId, itemId });

    await fulfillRedemption({ redemptionId, reviewerId: "admin1" });

    expect(writeRedemptionLedgerEntry).not.toHaveBeenCalled();
  });
});

describe("rejectRedemption", () => {
  it("returns rejected:false when no matching pending row exists", async () => {
    RewardRedemption.findOneAndUpdate.mockResolvedValueOnce(null);

    const result = await rejectRedemption({ redemptionId, reviewerId: "admin1" });

    expect(result).toEqual({ rejected: false, reason: "not_found_or_not_pending" });
    expect(User.updateOne).not.toHaveBeenCalled();
    expect(writeRedemptionLedgerEntry).not.toHaveBeenCalled();
  });

  it("credits the balance back, writes a REDEMPTION_REVERSED entry, and links reversalLedgerEntryId", async () => {
    const saveSpy = vi.fn();
    RewardRedemption.findOneAndUpdate.mockResolvedValueOnce({
      _id: redemptionId,
      userId,
      itemSnapshot: { name: "Code Club Hoodie", costCredits: 500 },
      save: saveSpy,
    });
    writeRedemptionLedgerEntry.mockResolvedValueOnce({ entry: { _id: "reversalEntry1" } });

    const result = await rejectRedemption({ redemptionId, reviewerId: "admin1", reason: "Out of stock" });

    expect(RewardRedemption.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: redemptionId, status: "pending" },
      { $set: { status: "rejected", resolvedAt: expect.any(Date), adminNotes: "Out of stock" } },
      { new: true }
    );
    expect(User.updateOne).toHaveBeenCalledWith(
      { _id: userId },
      { $inc: { creditsBalance: 500 } }
    );
    expect(writeRedemptionLedgerEntry).toHaveBeenCalledWith({
      userId,
      type: "REDEMPTION_REVERSED",
      amount: 500,
      redemptionId,
      metadata: { itemName: "Code Club Hoodie" },
    });
    expect(saveSpy).toHaveBeenCalled();
    expect(result).toEqual({ rejected: true, reason: undefined });
  });
});

describe("cancelRedemption", () => {
  it("scopes the transition to the requesting user's own redemption (extraMatch: { userId })", async () => {
    RewardRedemption.findOneAndUpdate.mockResolvedValueOnce(null);

    await cancelRedemption({ redemptionId, userId });

    expect(RewardRedemption.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: redemptionId, status: "pending", userId },
      expect.objectContaining({ $set: expect.objectContaining({ status: "cancelled" }) }),
      { new: true }
    );
  });

  it("reverses the debit the same way rejectRedemption does, on success", async () => {
    const saveSpy = vi.fn();
    RewardRedemption.findOneAndUpdate.mockResolvedValueOnce({
      _id: redemptionId,
      userId,
      itemSnapshot: { name: "Extra AI Mock Interview", costCredits: 50 },
      save: saveSpy,
    });
    writeRedemptionLedgerEntry.mockResolvedValueOnce({ entry: { _id: "reversalEntry2" } });

    const result = await cancelRedemption({ redemptionId, userId });

    expect(User.updateOne).toHaveBeenCalledWith({ _id: userId }, { $inc: { creditsBalance: 50 } });
    expect(result).toEqual({ cancelled: true, reason: undefined });
  });
});

describe("reconcileCreditsBalance", () => {
  it("returns reconciled:false and writes nothing when the stored balance already matches the ledger", async () => {
    getBalance.mockResolvedValueOnce(1850);
    User.findById.mockReturnValue({
      select: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue({ creditsBalance: 1850 }) }),
    });

    const result = await reconcileCreditsBalance(userId);

    expect(result).toEqual({ reconciled: false, ledgerBalance: 1850, priorStoredBalance: 1850 });
    expect(User.updateOne).not.toHaveBeenCalled();
  });

  it("corrects a drifted stored balance to match the ledger aggregate", async () => {
    getBalance.mockResolvedValueOnce(1800);
    User.findById.mockReturnValue({
      select: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue({ creditsBalance: 1850 }) }),
    });

    const result = await reconcileCreditsBalance(userId);

    expect(User.updateOne).toHaveBeenCalledWith({ _id: userId }, { $set: { creditsBalance: 1800 } });
    expect(result).toEqual({ reconciled: true, ledgerBalance: 1800, priorStoredBalance: 1850 });
  });

  it("treats a missing User doc's balance as 0 rather than throwing", async () => {
    getBalance.mockResolvedValueOnce(0);
    User.findById.mockReturnValue({
      select: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue(null) }),
    });

    const result = await reconcileCreditsBalance(userId);

    expect(result).toEqual({ reconciled: false, ledgerBalance: 0, priorStoredBalance: 0 });
  });
});