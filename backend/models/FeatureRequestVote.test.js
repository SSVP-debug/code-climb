import { describe, expect, it } from "vitest";
import mongoose from "mongoose";
import FeatureRequestVote from "./FeatureRequestVote.js";

function baseDoc(overrides = {}) {
  return new FeatureRequestVote({
    featureRequestId: new mongoose.Types.ObjectId(),
    userId: new mongoose.Types.ObjectId(),
    ...overrides,
  });
}

describe("FeatureRequestVote model", () => {
  it("validates successfully with all required fields present", () => {
    const doc = baseDoc();
    const err = doc.validateSync();
    expect(err).toBeUndefined();
  });

  it("fails validation when featureRequestId is missing", () => {
    const doc = baseDoc({ featureRequestId: undefined });
    const err = doc.validateSync();
    expect(err.errors.featureRequestId).toBeDefined();
  });

  it("fails validation when userId is missing", () => {
    const doc = baseDoc({ userId: undefined });
    const err = doc.validateSync();
    expect(err.errors.userId).toBeDefined();
  });

  it("declares the (featureRequestId, userId) unique index — the exactly-once-per-user vote guarantee", () => {
    const indexes = FeatureRequestVote.schema.indexes();
    const hasIdempotencyIndex = indexes.some(
      ([fields, options]) =>
        options?.unique === true &&
        Object.keys(fields).join(",") === "featureRequestId,userId"
    );
    expect(hasIdempotencyIndex).toBe(true);
  });

  it("declares a (userId, featureRequestId) index for reverse lookups", () => {
    const indexes = FeatureRequestVote.schema.indexes();
    const hasReverseIndex = indexes.some(
      ([fields]) => Object.keys(fields).join(",") === "userId,featureRequestId"
    );
    expect(hasReverseIndex).toBe(true);
  });
});