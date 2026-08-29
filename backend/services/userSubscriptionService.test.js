import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("../models/User.js", () => ({
  default: { updateOne: vi.fn(), findOneAndUpdate: vi.fn() },
}));

import User from "../models/User.js";
import { saveSubscription, saveSubscriptionIfMatch } from "./userSubscriptionService.js";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("saveSubscription", () => {
  it("performs a plain $set update, unchanged", async () => {
    User.updateOne.mockResolvedValueOnce({ acknowledged: true });

    await saveSubscription("user1", { referralCode: "abc123" });

    expect(User.updateOne).toHaveBeenCalledWith(
      { _id: "user1" },
      { $set: { referralCode: "abc123" } }
    );
  });
});

describe("saveSubscriptionIfMatch", () => {
  it("merges the match condition into the filter alongside _id", async () => {
    User.findOneAndUpdate.mockResolvedValueOnce({ _id: "user1", referredBy: "abc123" });

    await saveSubscriptionIfMatch("user1", { referredBy: null }, { referredBy: "abc123" });

    expect(User.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: "user1", referredBy: null },
      { $set: { referredBy: "abc123" } },
      { new: true }
    );
  });

  it("returns the updated document when the match succeeds", async () => {
    const updated = { _id: "user1", referredBy: "abc123" };
    User.findOneAndUpdate.mockResolvedValueOnce(updated);

    const result = await saveSubscriptionIfMatch("user1", { referredBy: null }, { referredBy: "abc123" });

    expect(result).toBe(updated);
  });

  it("returns null when the match fails (a concurrent write already changed the matched field — the caller's 'lost the race' case)", async () => {
    User.findOneAndUpdate.mockResolvedValueOnce(null);

    const result = await saveSubscriptionIfMatch("user1", { referredBy: null }, { referredBy: "abc123" });

    expect(result).toBeNull();
  });
});
