import { describe, expect, it } from "vitest";
import mongoose from "mongoose";
import RewardLedger from "./RewardLedger.js";

function baseDoc(overrides = {}) {
  return new RewardLedger({
    userId: new mongoose.Types.ObjectId(),
    type: "REFERRAL_QUALIFIED",
    amount: 100,
    sourceType: "REFERRAL",
    sourceId: new mongoose.Types.ObjectId(),
    ...overrides,
  });
}

describe("RewardLedger model", () => {
  it("validates successfully with all required fields present", () => {
    const doc = baseDoc();
    const err = doc.validateSync();
    expect(err).toBeUndefined();
  });

  it("defaults status to 'issued'", () => {
    const doc = baseDoc();
    expect(doc.status).toBe("issued");
  });

  it("fails validation when userId is missing", () => {
    const doc = baseDoc({ userId: undefined });
    const err = doc.validateSync();
    expect(err.errors.userId).toBeDefined();
  });

  it("fails validation when type is missing", () => {
    const doc = baseDoc({ type: undefined });
    const err = doc.validateSync();
    expect(err.errors.type).toBeDefined();
  });

  it("fails validation when amount is missing", () => {
    const doc = baseDoc({ amount: undefined });
    const err = doc.validateSync();
    expect(err.errors.amount).toBeDefined();
  });

  it("rejects a negative amount", () => {
    const doc = baseDoc({ amount: -50 });
    const err = doc.validateSync();
    expect(err.errors.amount).toBeDefined();
  });

  it("rejects an invalid sourceType enum value", () => {
    const doc = baseDoc({ sourceType: "CONTEST" });
    const err = doc.validateSync();
    expect(err.errors.sourceType).toBeDefined();
  });

  it("rejects an invalid status enum value", () => {
    const doc = baseDoc({ status: "spent" });
    const err = doc.validateSync();
    expect(err.errors.status).toBeDefined();
  });

  it("accepts status 'reversed'", () => {
    const doc = baseDoc({ status: "reversed" });
    const err = doc.validateSync();
    expect(err).toBeUndefined();
  });

  it("declares the idempotency unique index on (sourceType, sourceId, userId, type)", () => {
    const indexes = RewardLedger.schema.indexes();
    const hasIdempotencyIndex = indexes.some(
      ([fields, options]) =>
        options?.unique === true &&
        Object.keys(fields).join(",") === "sourceType,sourceId,userId,type"
    );
    expect(hasIdempotencyIndex).toBe(true);
  });
});
