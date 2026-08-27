import { describe, expect, it, beforeEach, afterEach } from "vitest";
import {
  resolveRewardAmount,
  isRewardPolicyConfigured,
  RewardPolicyNotConfiguredError,
  REWARD_POLICY_KEYS,
} from "./rewardPolicy.js";

const ENV_KEYS = {
  CONTRIBUTION_APPROVED: "REWARD_AMOUNT_CONTRIBUTION_APPROVED",
  REFERRAL_QUALIFIED_REFERRER: "REWARD_AMOUNT_REFERRAL_QUALIFIED_REFERRER",
  REFERRAL_QUALIFIED_REFERRED: "REWARD_AMOUNT_REFERRAL_QUALIFIED_REFERRED",
};

function clearEnv() {
  for (const key of Object.values(ENV_KEYS)) delete process.env[key];
}

beforeEach(clearEnv);
afterEach(clearEnv);

describe("REWARD_POLICY_KEYS", () => {
  it("exposes exactly the known policy keys", () => {
    expect(Object.keys(REWARD_POLICY_KEYS).sort()).toEqual(
      [
        "CONTRIBUTION_APPROVED",
        "REFERRAL_QUALIFIED_REFERRER",
        "REFERRAL_QUALIFIED_REFERRED",
      ].sort()
    );
  });
});

describe("resolveRewardAmount", () => {
  it("throws RewardPolicyNotConfiguredError when the env var is unset", () => {
    expect(() => resolveRewardAmount("REFERRAL_QUALIFIED_REFERRER")).toThrow(
      RewardPolicyNotConfiguredError
    );
  });

  it("throws RewardPolicyNotConfiguredError when the env var is an empty string", () => {
    process.env[ENV_KEYS.REFERRAL_QUALIFIED_REFERRER] = "  ";
    expect(() => resolveRewardAmount("REFERRAL_QUALIFIED_REFERRER")).toThrow(
      RewardPolicyNotConfiguredError
    );
  });

  it("returns the configured amount as a number", () => {
    process.env[ENV_KEYS.REFERRAL_QUALIFIED_REFERRER] = "150";
    expect(resolveRewardAmount("REFERRAL_QUALIFIED_REFERRER")).toBe(150);
  });

  it("throws on a negative configured amount", () => {
    process.env[ENV_KEYS.CONTRIBUTION_APPROVED] = "-5";
    expect(() => resolveRewardAmount("CONTRIBUTION_APPROVED")).toThrow(/not a valid non-negative number/);
  });

  it("throws on a non-numeric configured amount", () => {
    process.env[ENV_KEYS.CONTRIBUTION_APPROVED] = "lots";
    expect(() => resolveRewardAmount("CONTRIBUTION_APPROVED")).toThrow(/not a valid non-negative number/);
  });

  it("throws a plain Error (not RewardPolicyNotConfiguredError) for an unknown policy key", () => {
    expect(() => resolveRewardAmount("NOT_A_REAL_KEY")).toThrow(/unknown reward policy key/i);
  });

  it("resolves each policy key independently — configuring one does not configure the others", () => {
    process.env[ENV_KEYS.CONTRIBUTION_APPROVED] = "500";
    expect(resolveRewardAmount("CONTRIBUTION_APPROVED")).toBe(500);
    expect(() => resolveRewardAmount("REFERRAL_QUALIFIED_REFERRER")).toThrow(
      RewardPolicyNotConfiguredError
    );
  });
});

describe("isRewardPolicyConfigured", () => {
  it("returns false when unset", () => {
    expect(isRewardPolicyConfigured("REFERRAL_QUALIFIED_REFERRED")).toBe(false);
  });

  it("returns true when a valid amount is configured", () => {
    process.env[ENV_KEYS.REFERRAL_QUALIFIED_REFERRED] = "75";
    expect(isRewardPolicyConfigured("REFERRAL_QUALIFIED_REFERRED")).toBe(true);
  });

  it("returns false (does not throw) for an invalid configured value", () => {
    process.env[ENV_KEYS.REFERRAL_QUALIFIED_REFERRED] = "not-a-number";
    expect(isRewardPolicyConfigured("REFERRAL_QUALIFIED_REFERRED")).toBe(false);
  });
});
