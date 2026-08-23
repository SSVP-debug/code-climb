import { describe, expect, it } from "vitest";
import mongoose from "mongoose";
import Opportunity from "./Opportunity.js";

function baseDoc(overrides = {}) {
  return new Opportunity({
    ccId: "CC/001",
    ccNumber: 1,
    slug: "test-opportunity-001",
    title: "Test Fellowship",
    organization: "Test Org",
    type: "fellowship",
    category: "Software Engineering",
    shortSummary: "A short summary.",
    description: "Full description.",
    officialApplicationUrl: "https://example.com/apply",
    officialSourceUrl: "https://example.com/source",
    createdBy: new mongoose.Types.ObjectId(),
    ...overrides,
  });
}

describe("Opportunity model", () => {
  it("validates successfully with all required fields present", () => {
    const doc = baseDoc();
    const err = doc.validateSync();
    expect(err).toBeUndefined();
  });

  it("fails validation when a required field is missing", () => {
    const doc = baseDoc({ title: undefined });
    const err = doc.validateSync();
    expect(err.errors.title).toBeDefined();
  });

  it("rejects an invalid type enum value", () => {
    const doc = baseDoc({ type: "not-a-real-type" });
    const err = doc.validateSync();
    expect(err.errors.type).toBeDefined();
  });

  it("rejects an invalid status enum value", () => {
    const doc = baseDoc({ status: "not-a-real-status" });
    const err = doc.validateSync();
    expect(err.errors.status).toBeDefined();
  });

  it("defaults status to draft", () => {
    const doc = baseDoc();
    expect(doc.status).toBe("draft");
  });

  it("defaults sourceType to manual (AI research never auto-publishes)", () => {
    const doc = baseDoc();
    expect(doc.sourceType).toBe("manual");
  });

  describe("isExpiredByDeadline()", () => {
    it("returns false when there is no deadline", () => {
      const doc = baseDoc({ applicationDeadline: null });
      expect(doc.isExpiredByDeadline()).toBe(false);
    });

    it("returns false when the deadline is in the future", () => {
      const doc = baseDoc({ applicationDeadline: new Date(Date.now() + 100000) });
      expect(doc.isExpiredByDeadline()).toBe(false);
    });

    it("returns true when the deadline has passed", () => {
      const doc = baseDoc({ applicationDeadline: new Date(Date.now() - 100000) });
      expect(doc.isExpiredByDeadline()).toBe(true);
    });
  });
});
