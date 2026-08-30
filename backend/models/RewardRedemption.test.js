import { describe, expect, it } from "vitest";
import mongoose from "mongoose";
import RewardRedemption from "./RewardRedemption.js";

function baseDoc(overrides = {}) {
  return new RewardRedemption({
    userId: new mongoose.Types.ObjectId(),
    itemId: new mongoose.Types.ObjectId(),
    itemSnapshot: {
      name: "Extra AI Mock Interview",
      costCredits: 50,
      requiresShipping: false,
    },
    ...overrides,
  });
}

const validAddress = {
  recipientName: "Bunny",
  line1: "123 Main St",
  city: "Bengaluru",
  state: "Karnataka",
  postalCode: "560001",
  country: "India",
};

describe("RewardRedemption model", () => {
  it("validates successfully with all required fields present", () => {
    const doc = baseDoc();
    expect(doc.validateSync()).toBeUndefined();
  });

  it("defaults status to 'pending'", () => {
    const doc = baseDoc();
    expect(doc.status).toBe("pending");
  });

  it("defaults shippingAddress, resolvedAt, adminNotes, ledgerEntryId, and reversalLedgerEntryId to null", () => {
    const doc = baseDoc();
    expect(doc.shippingAddress).toBeNull();
    expect(doc.resolvedAt).toBeNull();
    expect(doc.adminNotes).toBeNull();
    expect(doc.ledgerEntryId).toBeNull();
    expect(doc.reversalLedgerEntryId).toBeNull();
  });

  it("fails validation when userId is missing", () => {
    const doc = baseDoc({ userId: undefined });
    const err = doc.validateSync();
    expect(err.errors.userId).toBeDefined();
  });

  it("fails validation when itemId is missing", () => {
    const doc = baseDoc({ itemId: undefined });
    const err = doc.validateSync();
    expect(err.errors.itemId).toBeDefined();
  });

  it("fails validation when itemSnapshot.name is missing", () => {
    const doc = baseDoc({ itemSnapshot: { costCredits: 50, requiresShipping: false } });
    const err = doc.validateSync();
    expect(err.errors["itemSnapshot.name"]).toBeDefined();
  });

  it("fails validation when itemSnapshot.costCredits is missing", () => {
    const doc = baseDoc({ itemSnapshot: { name: "x", requiresShipping: false } });
    const err = doc.validateSync();
    expect(err.errors["itemSnapshot.costCredits"]).toBeDefined();
  });

  it("fails validation when itemSnapshot.requiresShipping is missing", () => {
    const doc = baseDoc({ itemSnapshot: { name: "x", costCredits: 50 } });
    const err = doc.validateSync();
    expect(err.errors["itemSnapshot.requiresShipping"]).toBeDefined();
  });

  it("rejects an invalid status enum value", () => {
    const doc = baseDoc({ status: "shipped" });
    const err = doc.validateSync();
    expect(err.errors.status).toBeDefined();
  });

  it("accepts each valid status value", () => {
    for (const status of ["pending", "fulfilled", "rejected", "cancelled"]) {
      const doc = baseDoc({ status });
      expect(doc.validateSync()).toBeUndefined();
    }
  });

  it("accepts a full shippingAddress for a physical-item redemption", () => {
    const doc = baseDoc({
      itemSnapshot: { name: "Code Club Hoodie", costCredits: 500, requiresShipping: true },
      shippingAddress: validAddress,
    });
    expect(doc.validateSync()).toBeUndefined();
    expect(doc.shippingAddress.postalCode).toBe("560001");
  });

  it("fails validation when a provided shippingAddress is missing a required subfield", () => {
    const doc = baseDoc({
      itemSnapshot: { name: "Code Club Hoodie", costCredits: 500, requiresShipping: true },
      shippingAddress: { recipientName: "Bunny" }, // missing line1/city/state/postalCode/country
    });
    const err = doc.validateSync();
    expect(err.errors["shippingAddress.line1"]).toBeDefined();
  });

  it("declares the userId + createdAt index used for a user's own redemption history", () => {
    const indexes = RewardRedemption.schema.indexes();
    const hasHistoryIndex = indexes.some(
      ([fields]) => Object.keys(fields).join(",") === "userId,createdAt"
    );
    expect(hasHistoryIndex).toBe(true);
  });

  it("declares the status + createdAt index used for the admin fulfillment queue", () => {
    const indexes = RewardRedemption.schema.indexes();
    const hasQueueIndex = indexes.some(
      ([fields]) => Object.keys(fields).join(",") === "status,createdAt"
    );
    expect(hasQueueIndex).toBe(true);
  });
});