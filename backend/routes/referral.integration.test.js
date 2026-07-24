import { describe, expect, it, beforeAll, afterEach, afterAll } from "vitest";
import { startTestMongo, clearTestMongo, stopTestMongo } from "../test/mongoMemoryServer.js";
import User from "../models/User.js";
import { getOrCreateReferralCode } from "./referral.js";

describe("getOrCreateReferralCode — real Mongo persistence", () => {
  beforeAll(async () => {
    await startTestMongo();
  }, 60_000);

  afterEach(async () => {
    await clearTestMongo();
  });

  afterAll(async () => {
    await stopTestMongo();
  });

  it("generates a referral code only when requested, and persists it", async () => {
    const user = await User.create({ firebaseUid: "fb-d", displayName: "Dana", email: "d@test.com" });
    expect(user.referralCode).toBeUndefined();

    const code = await getOrCreateReferralCode(user);

    expect(code).toBeTruthy();

    const reloaded = await User.findById(user._id);
    expect(reloaded.referralCode).toBe(code);
  });

  it("generates different referral codes for different users", async () => {
    const userA = await User.create({ firebaseUid: "fb-e", displayName: "Eve", email: "e@test.com" });
    const userB = await User.create({ firebaseUid: "fb-f", displayName: "Frank", email: "f@test.com" });

    const codeA = await getOrCreateReferralCode(userA);
    const codeB = await getOrCreateReferralCode(userB);

    expect(codeA).toBeTruthy();
    expect(codeB).toBeTruthy();
    expect(codeA).not.toBe(codeB);
  });
});