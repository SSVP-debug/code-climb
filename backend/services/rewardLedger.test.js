import { describe, expect, it, vi, beforeEach } from "vitest";
import mongoose from "mongoose";

vi.mock("../models/RewardLedger.js", () => ({
  default: {
    create: vi.fn(),
    findOne: vi.fn(),
    aggregate: vi.fn(),
    find: vi.fn(),
    countDocuments: vi.fn(),
  },
}));
vi.mock("../models/User.js", () => ({
  default: { updateOne: vi.fn() },
}));
vi.mock("../config/logger.js", () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import RewardLedger from "../models/RewardLedger.js";
import User from "../models/User.js";
import { logger } from "../config/logger.js";
import {
  issueReward,
  getBalance,
  getLedger,
  writeRedemptionLedgerEntry,
  REWARD_TYPES,
} from "./rewardLedger.js";

const userId = new mongoose.Types.ObjectId();
const sourceId = new mongoose.Types.ObjectId();

beforeEach(() => {
  vi.clearAllMocks();
});

describe("issueReward", () => {
  it("creates a ledger entry with the expected shape", async () => {
    RewardLedger.create.mockResolvedValueOnce({ _id: "entry1" });

    const result = await issueReward({
      recipientId: userId,
      type: REWARD_TYPES.REFERRAL_QUALIFIED,
      amount: 100,
      sourceType: "REFERRAL",
      sourceId,
      metadata: { note: "first solve" },
    });

    expect(RewardLedger.create).toHaveBeenCalledWith({
      userId,
      type: "REFERRAL_QUALIFIED",
      amount: 100,
      sourceType: "REFERRAL",
      sourceId,
      metadata: { note: "first solve" },
    });
    expect(result).toEqual({ entry: { _id: "entry1" }, created: true });
  });

  it("defaults metadata to {} when omitted", async () => {
    RewardLedger.create.mockResolvedValueOnce({ _id: "entry1" });

    await issueReward({
      recipientId: userId,
      type: REWARD_TYPES.CONTRIBUTION_APPROVED,
      amount: 500,
      sourceType: "CONTRIBUTION",
      sourceId,
    });

    expect(RewardLedger.create).toHaveBeenCalledWith(
      expect.objectContaining({ metadata: {} })
    );
  });

  it("is idempotent: a duplicate-key error returns the existing entry, created=false, and does not throw", async () => {
    const duplicateError = Object.assign(new Error("E11000 duplicate key"), { code: 11000 });
    RewardLedger.create.mockRejectedValueOnce(duplicateError);
    RewardLedger.findOne.mockResolvedValueOnce({ _id: "existingEntry" });

    const result = await issueReward({
      recipientId: userId,
      type: REWARD_TYPES.REFERRAL_QUALIFIED,
      amount: 100,
      sourceType: "REFERRAL",
      sourceId,
    });

    expect(result).toEqual({ entry: { _id: "existingEntry" }, created: false });
    expect(RewardLedger.findOne).toHaveBeenCalledWith({
      sourceType: "REFERRAL",
      sourceId,
      userId,
      type: "REFERRAL_QUALIFIED",
    });
    expect(logger.info).toHaveBeenCalled();
  });

  it("re-throws non-duplicate-key errors", async () => {
    const dbError = new Error("connection lost");
    RewardLedger.create.mockRejectedValueOnce(dbError);

    await expect(
      issueReward({
        recipientId: userId,
        type: REWARD_TYPES.REFERRAL_QUALIFIED,
        amount: 100,
        sourceType: "REFERRAL",
        sourceId,
      })
    ).rejects.toThrow("connection lost");
  });

  it("rejects a negative amount before ever touching the database", async () => {
    await expect(
      issueReward({
        recipientId: userId,
        type: REWARD_TYPES.REFERRAL_QUALIFIED,
        amount: -10,
        sourceType: "REFERRAL",
        sourceId,
      })
    ).rejects.toThrow();
    expect(RewardLedger.create).not.toHaveBeenCalled();
  });

  it("accepts FEATURE_REQUEST as a valid sourceType (Phase 5)", async () => {
    RewardLedger.create.mockResolvedValueOnce({ _id: "entry1" });
    User.updateOne.mockResolvedValueOnce({});

    await issueReward({
      recipientId: userId,
      type: REWARD_TYPES.FEATURE_REQUEST_SHIPPED,
      amount: 40,
      sourceType: "FEATURE_REQUEST",
      sourceId,
    });

    expect(RewardLedger.create).toHaveBeenCalledWith(
      expect.objectContaining({ sourceType: "FEATURE_REQUEST" })
    );
  });

  it("rejects an unknown sourceType before ever touching the database", async () => {
    await expect(
      issueReward({
        recipientId: userId,
        type: "SOMETHING",
        amount: 10,
        sourceType: "CONTEST", // not yet a supported source per Phase 2
        sourceId,
      })
    ).rejects.toThrow();
    expect(RewardLedger.create).not.toHaveBeenCalled();
  });

  it("rejects when recipientId is missing", async () => {
    await expect(
      issueReward({
        type: REWARD_TYPES.REFERRAL_QUALIFIED,
        amount: 10,
        sourceType: "REFERRAL",
        sourceId,
      })
    ).rejects.toThrow();
  });

  it("increments User.creditsBalance by amount when a new row is written (Phase 4)", async () => {
    RewardLedger.create.mockResolvedValueOnce({ _id: "entry1" });

    await issueReward({
      recipientId: userId,
      type: REWARD_TYPES.CONTRIBUTION_APPROVED,
      amount: 50,
      sourceType: "CONTRIBUTION",
      sourceId,
    });

    expect(User.updateOne).toHaveBeenCalledWith(
      { _id: userId },
      { $inc: { creditsBalance: 50 } }
    );
  });

  it("does NOT increment User.creditsBalance again on a duplicate (idempotent) call", async () => {
    const duplicateError = Object.assign(new Error("E11000 duplicate key"), { code: 11000 });
    RewardLedger.create.mockRejectedValueOnce(duplicateError);
    RewardLedger.findOne.mockResolvedValueOnce({ _id: "existingEntry" });

    await issueReward({
      recipientId: userId,
      type: REWARD_TYPES.REFERRAL_QUALIFIED,
      amount: 100,
      sourceType: "REFERRAL",
      sourceId,
    });

    expect(User.updateOne).not.toHaveBeenCalled();
  });
});

describe("writeRedemptionLedgerEntry (Phase 4)", () => {
  it("creates a REDEMPTION-sourced debit row with a negative amount", async () => {
    RewardLedger.create.mockResolvedValueOnce({ _id: "debit1" });

    const result = await writeRedemptionLedgerEntry({
      userId,
      type: REWARD_TYPES.REDEMPTION_DEBIT,
      amount: -50,
      redemptionId: sourceId,
    });

    expect(RewardLedger.create).toHaveBeenCalledWith({
      userId,
      type: "REDEMPTION_DEBIT",
      amount: -50,
      sourceType: "REDEMPTION",
      sourceId,
      metadata: {},
    });
    expect(result).toEqual({ entry: { _id: "debit1" }, created: true });
  });

  it("creates a REDEMPTION-sourced reversal row with a positive amount", async () => {
    RewardLedger.create.mockResolvedValueOnce({ _id: "reversal1" });

    await writeRedemptionLedgerEntry({
      userId,
      type: REWARD_TYPES.REDEMPTION_REVERSED,
      amount: 50,
      redemptionId: sourceId,
    });

    expect(RewardLedger.create).toHaveBeenCalledWith(
      expect.objectContaining({ type: "REDEMPTION_REVERSED", amount: 50 })
    );
  });

  it("is idempotent: a duplicate-key error returns the existing entry, created=false", async () => {
    const duplicateError = Object.assign(new Error("E11000 duplicate key"), { code: 11000 });
    RewardLedger.create.mockRejectedValueOnce(duplicateError);
    RewardLedger.findOne.mockResolvedValueOnce({ _id: "existingDebit" });

    const result = await writeRedemptionLedgerEntry({
      userId,
      type: REWARD_TYPES.REDEMPTION_DEBIT,
      amount: -50,
      redemptionId: sourceId,
    });

    expect(result).toEqual({ entry: { _id: "existingDebit" }, created: false });
  });

  it("rejects a zero amount", async () => {
    await expect(
      writeRedemptionLedgerEntry({
        userId,
        type: REWARD_TYPES.REDEMPTION_DEBIT,
        amount: 0,
        redemptionId: sourceId,
      })
    ).rejects.toThrow();
    expect(RewardLedger.create).not.toHaveBeenCalled();
  });

  it("rejects an unknown type", async () => {
    await expect(
      writeRedemptionLedgerEntry({
        userId,
        type: "SOMETHING_ELSE",
        amount: -50,
        redemptionId: sourceId,
      })
    ).rejects.toThrow();
    expect(RewardLedger.create).not.toHaveBeenCalled();
  });
});

describe("getBalance", () => {
  it("returns the aggregated sum for issued rows", async () => {
    RewardLedger.aggregate.mockResolvedValueOnce([{ _id: null, balance: 1850 }]);

    const balance = await getBalance(userId);

    expect(balance).toBe(1850);
    expect(RewardLedger.aggregate).toHaveBeenCalledWith([
      { $match: { userId, status: "issued" } },
      { $group: { _id: null, balance: { $sum: "$amount" } } },
    ]);
  });

  it("returns 0 when there are no ledger entries", async () => {
    RewardLedger.aggregate.mockResolvedValueOnce([]);

    const balance = await getBalance(userId);

    expect(balance).toBe(0);
  });

  it("casts a string userId to an ObjectId for the aggregation match", async () => {
    RewardLedger.aggregate.mockResolvedValueOnce([{ _id: null, balance: 50 }]);

    await getBalance(userId.toString());

    const [pipeline] = RewardLedger.aggregate.mock.calls[0];
    const [stage] = pipeline;
    expect(stage.$match.userId).toBeInstanceOf(mongoose.Types.ObjectId);
  });
});

describe("getLedger", () => {
  it("paginates and returns entries + total", async () => {
    RewardLedger.find.mockReturnValue({
      sort: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue([{ _id: "e1" }, { _id: "e2" }]),
    });
    RewardLedger.countDocuments.mockResolvedValueOnce(2);

    const result = await getLedger(userId, { page: 1, limit: 20 });

    expect(result).toEqual({
      entries: [{ _id: "e1" }, { _id: "e2" }],
      total: 2,
      page: 1,
      limit: 20,
    });
  });

  it("clamps limit to a maximum of 100", async () => {
    const limitSpy = vi.fn().mockReturnThis();
    RewardLedger.find.mockReturnValue({
      sort: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      limit: limitSpy,
      lean: vi.fn().mockResolvedValue([]),
    });
    RewardLedger.countDocuments.mockResolvedValueOnce(0);

    await getLedger(userId, { page: 1, limit: 500 });

    expect(limitSpy).toHaveBeenCalledWith(100);
  });

  it("floors page/limit at 1", async () => {
    const skipSpy = vi.fn().mockReturnThis();
    RewardLedger.find.mockReturnValue({
      sort: vi.fn().mockReturnThis(),
      skip: skipSpy,
      limit: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue([]),
    });
    RewardLedger.countDocuments.mockResolvedValueOnce(0);

    await getLedger(userId, { page: -5, limit: 0 });

    expect(skipSpy).toHaveBeenCalledWith(0); // (page 1 - 1) * limit 1
  });
});