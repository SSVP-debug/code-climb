import { describe, expect, it } from "vitest";
import User from "./User.js";

describe("User.referredAt (Referral Qualification timing anchor)", () => {
  it("defaults to null", () => {
    const user = new User({ firebaseUid: "fb1", email: "test@example.com" });
    expect(user.referredAt).toBeNull();
  });

  it("accepts a Date value", () => {
    const date = new Date("2026-01-01");
    const user = new User({ firebaseUid: "fb1", email: "test@example.com", referredAt: date });
    expect(user.referredAt).toEqual(date);
  });

  it("is independent of referredBy — setting one does not implicitly set the other", () => {
    const user = new User({ firebaseUid: "fb1", email: "test@example.com", referredBy: "abc123" });
    expect(user.referredAt).toBeNull();
  });
});
