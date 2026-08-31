import { describe, expect, it } from "vitest";
import {
  FeatureRequestCreateSchema,
  FeatureRequestUpdateSchema,
  FeatureRequestStatusUpdateSchema,
  FeatureRequestRetrySchema,
} from "./featureRequestSchema.js";

describe("FeatureRequestCreateSchema", () => {
  it("accepts a valid title + description", () => {
    const result = FeatureRequestCreateSchema.safeParse({
      title: "Dark mode",
      description: "Add a dark theme for the editor.",
    });
    expect(result.success).toBe(true);
  });

  it("trims title and description", () => {
    const result = FeatureRequestCreateSchema.safeParse({
      title: "  Dark mode  ",
      description: "  Add a dark theme.  ",
    });
    expect(result.success).toBe(true);
    expect(result.data.title).toBe("Dark mode");
    expect(result.data.description).toBe("Add a dark theme.");
  });

  it("rejects a missing title", () => {
    const result = FeatureRequestCreateSchema.safeParse({ description: "D" });
    expect(result.success).toBe(false);
  });

  it("rejects a missing description", () => {
    const result = FeatureRequestCreateSchema.safeParse({ title: "T" });
    expect(result.success).toBe(false);
  });

  it("rejects an empty title", () => {
    const result = FeatureRequestCreateSchema.safeParse({ title: "", description: "D" });
    expect(result.success).toBe(false);
  });

  it("rejects a title over 200 characters", () => {
    const result = FeatureRequestCreateSchema.safeParse({
      title: "a".repeat(201),
      description: "D",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a description over 5000 characters", () => {
    const result = FeatureRequestCreateSchema.safeParse({
      title: "T",
      description: "a".repeat(5001),
    });
    expect(result.success).toBe(false);
  });
});

describe("FeatureRequestUpdateSchema", () => {
  it("accepts title alone", () => {
    const result = FeatureRequestUpdateSchema.safeParse({ title: "New title" });
    expect(result.success).toBe(true);
  });

  it("accepts description alone", () => {
    const result = FeatureRequestUpdateSchema.safeParse({ description: "New description" });
    expect(result.success).toBe(true);
  });

  it("accepts both together", () => {
    const result = FeatureRequestUpdateSchema.safeParse({
      title: "New title",
      description: "New description",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an empty body — at least one field is required", () => {
    const result = FeatureRequestUpdateSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects an empty-string title", () => {
    const result = FeatureRequestUpdateSchema.safeParse({ title: "" });
    expect(result.success).toBe(false);
  });
});

describe("FeatureRequestStatusUpdateSchema", () => {
  it("accepts each admin-settable status", () => {
    for (const status of ["planned", "in_progress", "shipped", "declined"]) {
      const result = FeatureRequestStatusUpdateSchema.safeParse({ status });
      expect(result.success).toBe(true);
    }
  });

  it("rejects 'open' — never a valid target to transition back to", () => {
    const result = FeatureRequestStatusUpdateSchema.safeParse({ status: "open" });
    expect(result.success).toBe(false);
  });

  it("rejects 'withdrawn' — self-service only, not admin-settable", () => {
    const result = FeatureRequestStatusUpdateSchema.safeParse({ status: "withdrawn" });
    expect(result.success).toBe(false);
  });

  it("rejects an unknown status value", () => {
    const result = FeatureRequestStatusUpdateSchema.safeParse({ status: "archived" });
    expect(result.success).toBe(false);
  });
});

describe("FeatureRequestRetrySchema", () => {
  it("accepts an omitted limit", () => {
    const result = FeatureRequestRetrySchema.safeParse({});
    expect(result.success).toBe(true);
    expect(result.data.limit).toBeUndefined();
  });

  it("coerces a numeric-string limit", () => {
    const result = FeatureRequestRetrySchema.safeParse({ limit: "50" });
    expect(result.success).toBe(true);
    expect(result.data.limit).toBe(50);
  });

  it("rejects a non-positive limit", () => {
    const result = FeatureRequestRetrySchema.safeParse({ limit: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects a limit over 1000", () => {
    const result = FeatureRequestRetrySchema.safeParse({ limit: 1001 });
    expect(result.success).toBe(false);
  });
});