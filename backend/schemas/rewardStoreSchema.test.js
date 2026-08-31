import { describe, expect, it } from "vitest";
import {
  CatalogItemCreateSchema,
  CatalogItemUpdateSchema,
  RedemptionRequestSchema,
  RedemptionRejectSchema,
  RedemptionFulfillSchema,
} from "./rewardStoreSchema.js";

function validCatalogItem(overrides = {}) {
  return {
    name: "Extra AI Mock Interview",
    description: "Unlocks one additional AI-driven mock interview session.",
    costCredits: 50,
    ...overrides,
  };
}

const validAddress = {
  recipientName: "Bunny",
  line1: "123 Main St",
  city: "Bengaluru",
  state: "Karnataka",
  postalCode: "560001",
  country: "India",
};

describe("CatalogItemCreateSchema", () => {
  it("accepts a minimal valid digital item and defaults requiresShipping to false", () => {
    const result = CatalogItemCreateSchema.safeParse(validCatalogItem());
    expect(result.success).toBe(true);
    expect(result.data.requiresShipping).toBe(false);
  });

  it("accepts a full physical item", () => {
    const result = CatalogItemCreateSchema.safeParse(
      validCatalogItem({
        name: "Code Club Hoodie",
        costCredits: 500,
        requiresShipping: true,
        stock: 25,
        category: "Merchandise",
        imageUrl: "https://example.com/hoodie.png",
      })
    );
    expect(result.success).toBe(true);
  });

  it("rejects a missing name", () => {
    const result = CatalogItemCreateSchema.safeParse(validCatalogItem({ name: undefined }));
    expect(result.success).toBe(false);
  });

  it("rejects costCredits below 1", () => {
    const result = CatalogItemCreateSchema.safeParse(validCatalogItem({ costCredits: 0 }));
    expect(result.success).toBe(false);
  });

  it("rejects a negative stock", () => {
    const result = CatalogItemCreateSchema.safeParse(validCatalogItem({ stock: -1 }));
    expect(result.success).toBe(false);
  });

  it("accepts stock: null (unlimited)", () => {
    const result = CatalogItemCreateSchema.safeParse(validCatalogItem({ stock: null }));
    expect(result.success).toBe(true);
  });

  it("rejects a malformed imageUrl", () => {
    const result = CatalogItemCreateSchema.safeParse(
      validCatalogItem({ imageUrl: "not-a-url" })
    );
    expect(result.success).toBe(false);
  });
});

describe("CatalogItemUpdateSchema", () => {
  it("accepts an empty object — a no-op partial update", () => {
    const result = CatalogItemUpdateSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("accepts toggling just `active`", () => {
    const result = CatalogItemUpdateSchema.safeParse({ active: false });
    expect(result.success).toBe(true);
  });

  it("still enforces costCredits >= 1 when provided", () => {
    const result = CatalogItemUpdateSchema.safeParse({ costCredits: 0 });
    expect(result.success).toBe(false);
  });
});

describe("RedemptionRequestSchema", () => {
  it("accepts a bare itemId with no shippingAddress", () => {
    const result = RedemptionRequestSchema.safeParse({ itemId: "item1" });
    expect(result.success).toBe(true);
  });

  it("accepts itemId + a well-formed shippingAddress", () => {
    const result = RedemptionRequestSchema.safeParse({
      itemId: "item1",
      shippingAddress: validAddress,
    });
    expect(result.success).toBe(true);
  });

  it("rejects a missing itemId", () => {
    const result = RedemptionRequestSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects a shippingAddress missing a required subfield, when one is given at all", () => {
    const result = RedemptionRequestSchema.safeParse({
      itemId: "item1",
      shippingAddress: { recipientName: "Bunny" },
    });
    expect(result.success).toBe(false);
  });
});

describe("RedemptionRejectSchema / RedemptionFulfillSchema", () => {
  it("RedemptionRejectSchema defaults reason to null when omitted", () => {
    const result = RedemptionRejectSchema.safeParse({});
    expect(result.success).toBe(true);
    expect(result.data.reason).toBeNull();
  });

  it("RedemptionFulfillSchema defaults adminNotes to null when omitted", () => {
    const result = RedemptionFulfillSchema.safeParse({});
    expect(result.success).toBe(true);
    expect(result.data.adminNotes).toBeNull();
  });
});