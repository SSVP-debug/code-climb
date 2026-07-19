import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("../models/User.js", () => ({
  default: { exists: vi.fn(), findOne: vi.fn(), countDocuments: vi.fn() },
}));
vi.mock("../services/userSubscriptionService.js", () => ({
  saveSubscription: vi.fn().mockResolvedValue({ acknowledged: true }),
}));
vi.mock("../config/featureFlags.js", () => ({ REFERRAL_REWARD_DAYS: 7 }));
vi.mock("../config/site.js", () => ({ SITE_URL: "https://example.test" }));

import User from "../models/User.js";
import { saveSubscription } from "../services/userSubscriptionService.js";
import { getOrCreateReferralCode } from "./referral.js";

describe("getOrCreateReferralCode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the existing code without writing anything if already set", async () => {
    const userDoc = { _id: "u1", referralCode: "already-set" };

    const code = await getOrCreateReferralCode(userDoc);

    expect(code).toBe("already-set");
    expect(saveSubscription).not.toHaveBeenCalled();
  });

  it("generates a code, dual-writes it via saveSubscription, and syncs it onto the in-memory doc", async () => {
    User.exists.mockResolvedValueOnce(false); // first generated code is unique
    const userDoc = { _id: "u1", displayName: "Ada Lovelace", referralCode: null };

    const code = await getOrCreateReferralCode(userDoc);

    expect(code).toBeTruthy();
    expect(saveSubscription).toHaveBeenCalledWith("u1", { referralCode: code });
    // Local doc must reflect the write immediately — this is the object the
    // short-TTL requireAuth cache (utils/userAuthCache.js) hands back to
    // subsequent requests on this instance, so it can't be left stale.
    expect(userDoc.referralCode).toBe(code);
  });

  it("retries code generation on collision, up to 5 attempts", async () => {
    User.exists
      .mockResolvedValueOnce(true) // collision
      .mockResolvedValueOnce(true) // collision
      .mockResolvedValueOnce(false); // unique
    const userDoc = { _id: "u1", displayName: "Grace Hopper", referralCode: null };

    await getOrCreateReferralCode(userDoc);

    expect(User.exists).toHaveBeenCalledTimes(3);
    expect(saveSubscription).toHaveBeenCalledOnce();
  });
});
