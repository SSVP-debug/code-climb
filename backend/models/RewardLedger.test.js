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

  it("accepts a negative amount (Phase 4: REDEMPTION debits) and REDEMPTION as a valid sourceType", () => {
    // Phase 2 rejected negative amounts outright — Phase 4 (Rewards
    // Store) re-derives this: a debit is represented as a negative
    // amount on a REDEMPTION-sourced row. See this model's header
    // comment and plans/004-rewards-store-scoping.md §3 for the full
    // reasoning. Schema validation intentionally does NOT enforce
    // "negative amount implies sourceType REDEMPTION" or vice versa —
    // that correlation is an application-level concern
    // (services/rewardStore.js), not a schema-level one, matching this
    // model's existing "type is free-form, validated at the service
    // boundary" philosophy for its `type` field.
    const doc = baseDoc({ amount: -50, sourceType: "REDEMPTION", type: "REDEMPTION_DEBIT" });
    const err = doc.validateSync();
    expect(err).toBeUndefined();
  });

  it("rejects a non-finite amount", () => {
    const doc = baseDoc({ amount: NaN });
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