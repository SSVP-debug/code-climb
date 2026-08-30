import { describe, expect, it } from "vitest";
import mongoose from "mongoose";
import RewardCatalogItem from "./RewardCatalogItem.js";

function baseDoc(overrides = {}) {
  return new RewardCatalogItem({
    name: "Extra AI Mock Interview",
    description: "Unlocks one additional AI-driven mock interview session.",
    costCredits: 50,
    createdBy: new mongoose.Types.ObjectId(),
    ...overrides,
  });
}

describe("RewardCatalogItem model", () => {
  it("validates successfully with all required fields present", () => {
    const doc = baseDoc();
    expect(doc.validateSync()).toBeUndefined();
  });

  it("defaults active to true", () => {
    const doc = baseDoc();
    expect(doc.active).toBe(true);
  });

  it("defaults requiresShipping to false", () => {
    const doc = baseDoc();
    expect(doc.requiresShipping).toBe(false);
  });

  it("defaults stock to null (unlimited)", () => {
    const doc = baseDoc();
    expect(doc.stock).toBeNull();
  });

  it("defaults category to null", () => {
    const doc = baseDoc();
    expect(doc.category).toBeNull();
  });

  it("fails validation when name is missing", () => {
    const doc = baseDoc({ name: undefined });
    const err = doc.validateSync();
    expect(err.errors.name).toBeDefined();
  });

  it("fails validation when description is missing", () => {
    const doc = baseDoc({ description: undefined });
    const err = doc.validateSync();
    expect(err.errors.description).toBeDefined();
  });

  it("fails validation when costCredits is missing", () => {
    const doc = baseDoc({ costCredits: undefined });
    const err = doc.validateSync();
    expect(err.errors.costCredits).toBeDefined();
  });

  it("rejects a costCredits below 1", () => {
    const doc = baseDoc({ costCredits: 0 });
    const err = doc.validateSync();
    expect(err.errors.costCredits).toBeDefined();
  });

  it("fails validation when createdBy is missing", () => {
    const doc = baseDoc({ createdBy: undefined });
    const err = doc.validateSync();
    expect(err.errors.createdBy).toBeDefined();
  });

  it("accepts a finite stock number", () => {
    const doc = baseDoc({ stock: 25 });
    expect(doc.validateSync()).toBeUndefined();
    expect(doc.stock).toBe(25);
  });

  it("rejects a negative stock", () => {
    const doc = baseDoc({ stock: -1 });
    const err = doc.validateSync();
    expect(err.errors.stock).toBeDefined();
  });

  it("declares the active + createdAt index used for store browsing", () => {
    const indexes = RewardCatalogItem.schema.indexes();
    const hasBrowseIndex = indexes.some(
      ([fields]) => Object.keys(fields).join(",") === "active,createdAt"
    );
    expect(hasBrowseIndex).toBe(true);
  });
});