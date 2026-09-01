import { describe, expect, it } from "vitest";
import mongoose from "mongoose";
import FeatureRequest from "./FeatureRequest.js";

function baseDoc(overrides = {}) {
  return new FeatureRequest({
    ccId: "FR/001",
    ccNumber: 1,
    submittedBy: new mongoose.Types.ObjectId(),
    title: "Dark mode for the editor",
    description: "It would be great to have a dark theme for the code editor.",
    ...overrides,
  });
}

describe("FeatureRequest model", () => {
  it("validates successfully with all required fields present", () => {
    const doc = baseDoc();
    const err = doc.validateSync();
    expect(err).toBeUndefined();
  });

  it("defaults status to 'open'", () => {
    const doc = baseDoc();
    expect(doc.status).toBe("open");
  });

  it("defaults voteCount to 0", () => {
    const doc = baseDoc();
    expect(doc.voteCount).toBe(0);
  });

  it("defaults rewardStatus to 'pending'", () => {
    const doc = baseDoc();
    expect(doc.rewardStatus).toBe("pending");
  });

  it("defaults reviewedBy/reviewedAt to null", () => {
    const doc = baseDoc();
    expect(doc.reviewedBy).toBeNull();
    expect(doc.reviewedAt).toBeNull();
  });

  it("fails validation when ccId is missing", () => {
    const doc = baseDoc({ ccId: undefined });
    const err = doc.validateSync();
    expect(err.errors.ccId).toBeDefined();
  });

  it("fails validation when ccNumber is missing", () => {
    const doc = baseDoc({ ccNumber: undefined });
    const err = doc.validateSync();
    expect(err.errors.ccNumber).toBeDefined();
  });

  it("fails validation when submittedBy is missing", () => {
    const doc = baseDoc({ submittedBy: undefined });
    const err = doc.validateSync();
    expect(err.errors.submittedBy).toBeDefined();
  });

  it("fails validation when title is missing", () => {
    const doc = baseDoc({ title: undefined });
    const err = doc.validateSync();
    expect(err.errors.title).toBeDefined();
  });

  it("fails validation when description is missing", () => {
    const doc = baseDoc({ description: undefined });
    const err = doc.validateSync();
    expect(err.errors.description).toBeDefined();
  });

  it("rejects a title longer than 200 characters", () => {
    const doc = baseDoc({ title: "a".repeat(201) });
    const err = doc.validateSync();
    expect(err.errors.title).toBeDefined();
  });

  it("rejects a description longer than 5000 characters", () => {
    const doc = baseDoc({ description: "a".repeat(5001) });
    const err = doc.validateSync();
    expect(err.errors.description).toBeDefined();
  });

  it("rejects a negative voteCount", () => {
    const doc = baseDoc({ voteCount: -1 });
    const err = doc.validateSync();
    expect(err.errors.voteCount).toBeDefined();
  });

  it("accepts every valid status value", () => {
    for (const status of ["open", "planned", "in_progress", "shipped", "declined", "withdrawn"]) {
      const doc = baseDoc({ status });
      const err = doc.validateSync();
      expect(err).toBeUndefined();
    }
  });

  it("rejects an invalid status enum value", () => {
    const doc = baseDoc({ status: "archived" });
    const err = doc.validateSync();
    expect(err.errors.status).toBeDefined();
  });

  it("rejects an invalid rewardStatus enum value", () => {
    const doc = baseDoc({ rewardStatus: "refunded" });
    const err = doc.validateSync();
    expect(err.errors.rewardStatus).toBeDefined();
  });

  it("declares a unique index on ccId", () => {
    const indexes = FeatureRequest.schema.indexes();
    const hasUniqueCcId = indexes.some(
      ([fields, options]) => options?.unique === true && Object.keys(fields).join(",") === "ccId"
    );
    expect(hasUniqueCcId).toBe(true);
  });

  it("declares a unique index on ccNumber", () => {
    const indexes = FeatureRequest.schema.indexes();
    const hasUniqueCcNumber = indexes.some(
      ([fields, options]) =>
        options?.unique === true && Object.keys(fields).join(",") === "ccNumber"
    );
    expect(hasUniqueCcNumber).toBe(true);
  });

  it("declares the { status, rewardStatus } reward-retry index", () => {
    const indexes = FeatureRequest.schema.indexes();
    const hasRetryIndex = indexes.some(
      ([fields]) => Object.keys(fields).join(",") === "status,rewardStatus"
    );
    expect(hasRetryIndex).toBe(true);
  });
});