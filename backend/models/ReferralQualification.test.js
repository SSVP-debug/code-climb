import { describe, expect, it } from "vitest";
import mongoose from "mongoose";
import ReferralQualification from "./ReferralQualification.js";

function baseDoc(overrides = {}) {
  return new ReferralQualification({
    referrerId: new mongoose.Types.ObjectId(),
    referredUserId: new mongoose.Types.ObjectId(),
    referralCodeUsed: "abc123",
    ...overrides,
  });
}

describe("ReferralQualification model", () => {
  it("validates successfully with all required fields present", () => {
    const doc = baseDoc();
    const err = doc.validateSync();
    expect(err).toBeUndefined();
  });

  it("defaults qualifiedAt to null", () => {
    const doc = baseDoc();
    expect(doc.qualifiedAt).toBeNull();
  });

  it("defaults rewardStatus to 'pending'", () => {
    const doc = baseDoc();
    expect(doc.rewardStatus).toBe("pending");
  });

  it("defaults qualificationSourceSubmissionId to null", () => {
    const doc = baseDoc();
    expect(doc.qualificationSourceSubmissionId).toBeNull();
  });

  it("defaults status to 'pending'", () => {
    const doc = baseDoc();
    expect(doc.status).toBe("pending");
  });

  it("defaults ineligibleReason to null", () => {
    const doc = baseDoc();
    expect(doc.ineligibleReason).toBeNull();
  });

  it("rejects an invalid status enum value", () => {
    const doc = baseDoc({ status: "approved" });
    const err = doc.validateSync();
    expect(err.errors.status).toBeDefined();
  });

  it("accepts each valid status value", () => {
    for (const status of ["pending", "qualified", "ineligible"]) {
      const doc = baseDoc({ status });
      expect(doc.validateSync()).toBeUndefined();
    }
  });

  it("accepts rewardStatus 'failed'", () => {
    const doc = baseDoc({ rewardStatus: "failed" });
    expect(doc.validateSync()).toBeUndefined();
  });

  it("declares the status + rewardStatus compound index used by the reward-retry reconciliation query", () => {
    const indexes = ReferralQualification.schema.indexes();
    const hasRetryIndex = indexes.some(
      ([fields]) => Object.keys(fields).join(",") === "status,rewardStatus"
    );
    expect(hasRetryIndex).toBe(true);
  });

  it("fails validation when referrerId is missing", () => {
    const doc = baseDoc({ referrerId: undefined });
    const err = doc.validateSync();
    expect(err.errors.referrerId).toBeDefined();
  });

  it("fails validation when referredUserId is missing", () => {
    const doc = baseDoc({ referredUserId: undefined });
    const err = doc.validateSync();
    expect(err.errors.referredUserId).toBeDefined();
  });

  it("fails validation when referralCodeUsed is missing", () => {
    const doc = baseDoc({ referralCodeUsed: undefined });
    const err = doc.validateSync();
    expect(err.errors.referralCodeUsed).toBeDefined();
  });

  it("rejects an invalid rewardStatus enum value", () => {
    const doc = baseDoc({ rewardStatus: "paid" });
    const err = doc.validateSync();
    expect(err.errors.rewardStatus).toBeDefined();
  });

  it("accepts each valid rewardStatus value", () => {
    for (const status of ["pending", "issued", "skipped_unconfigured"]) {
      const doc = baseDoc({ rewardStatus: status });
      expect(doc.validateSync()).toBeUndefined();
    }
  });

  it("declares a unique index on referredUserId (one referrer per account)", () => {
    const indexes = ReferralQualification.schema.indexes();
    const path = ReferralQualification.schema.path("referredUserId");
    // Mongoose applies `unique: true` as a path option, which surfaces as
    // its own index entry either via schema.indexes() or the path's own
    // options — check both since Mongoose versions differ slightly here.
    const hasExplicitUniqueIndex = indexes.some(
      ([fields, options]) =>
        options?.unique === true && Object.keys(fields).join(",") === "referredUserId"
    );
    expect(hasExplicitUniqueIndex || path?.options?.unique === true).toBe(true);
  });

  it("declares the referrerId + qualifiedAt compound index for stats lookups", () => {
    const indexes = ReferralQualification.schema.indexes();
    const hasStatsIndex = indexes.some(
      ([fields]) => Object.keys(fields).join(",") === "referrerId,qualifiedAt"
    );
    expect(hasStatsIndex).toBe(true);
  });
});
