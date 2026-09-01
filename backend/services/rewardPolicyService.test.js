import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("./rewardLedger.js", () => ({
  issueReward: vi.fn(),
}));
vi.mock("../config/logger.js", () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { issueReward } from "./rewardLedger.js";
import { logger } from "../config/logger.js";
import {
  issueContributionApprovedReward,
  issueReferralQualifiedRewards,
  issueFeatureRequestShippedReward,
} from "./rewardPolicyService.js";

const ENV_KEYS = {
  CONTRIBUTION_APPROVED: "REWARD_AMOUNT_CONTRIBUTION_APPROVED",
  REFERRAL_QUALIFIED_REFERRER: "REWARD_AMOUNT_REFERRAL_QUALIFIED_REFERRER",
  REFERRAL_QUALIFIED_REFERRED: "REWARD_AMOUNT_REFERRAL_QUALIFIED_REFERRED",
  FEATURE_REQUEST_SHIPPED: "REWARD_AMOUNT_FEATURE_REQUEST_SHIPPED",
};

function clearEnv() {
  for (const key of Object.values(ENV_KEYS)) delete process.env[key];
}

beforeEach(() => {
  vi.clearAllMocks();
  clearEnv();
});

describe("issueContributionApprovedReward", () => {
  it("resolves the amount from policy and delegates to issueReward", async () => {
    process.env[ENV_KEYS.CONTRIBUTION_APPROVED] = "500";
    issueReward.mockResolvedValueOnce({ entry: { _id: "e1" }, created: true });

    const result = await issueContributionApprovedReward({
      contributorId: "user1",
      contributionId: "contrib1",
      metadata: { type: "hidden_testcase" },
    });

    expect(issueReward).toHaveBeenCalledWith({
      recipientId: "user1",
      type: "CONTRIBUTION_APPROVED",
      amount: 500,
      sourceType: "CONTRIBUTION",
      sourceId: "contrib1",
      metadata: { type: "hidden_testcase" },
    });
    expect(result).toEqual({ issued: true, created: true, entry: { _id: "e1" } });
  });

  it("does not throw and returns issued:false when the policy amount isn't configured", async () => {
    // deliberately not setting REWARD_AMOUNT_CONTRIBUTION_APPROVED
    const result = await issueContributionApprovedReward({
      contributorId: "user1",
      contributionId: "contrib1",
    });

    expect(result).toEqual({ issued: false, reason: "not_configured" });
    expect(issueReward).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalled();
  });

  it("propagates non-policy errors from issueReward (e.g. a real DB failure)", async () => {
    process.env[ENV_KEYS.CONTRIBUTION_APPROVED] = "500";
    issueReward.mockRejectedValueOnce(new Error("connection lost"));

    await expect(
      issueContributionApprovedReward({ contributorId: "user1", contributionId: "contrib1" })
    ).rejects.toThrow("connection lost");
  });
});

describe("issueFeatureRequestShippedReward", () => {
  it("resolves the amount from policy and delegates to issueReward — same shape as issueContributionApprovedReward", async () => {
    process.env[ENV_KEYS.FEATURE_REQUEST_SHIPPED] = "40";
    issueReward.mockResolvedValueOnce({ entry: { _id: "e1" }, created: true });

    const result = await issueFeatureRequestShippedReward({
      submitterId: "user1",
      featureRequestId: "fr1",
    });

    expect(issueReward).toHaveBeenCalledWith({
      recipientId: "user1",
      type: "FEATURE_REQUEST_SHIPPED",
      amount: 40,
      sourceType: "FEATURE_REQUEST",
      sourceId: "fr1",
      metadata: {},
    });
    expect(result).toEqual({ issued: true, created: true, entry: { _id: "e1" } });
  });

  it("does not throw and returns issued:false when the policy amount isn't configured", async () => {
    const result = await issueFeatureRequestShippedReward({
      submitterId: "user1",
      featureRequestId: "fr1",
    });

    expect(result).toEqual({ issued: false, reason: "not_configured" });
    expect(issueReward).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalled();
  });
});

describe("issueReferralQualifiedRewards", () => {
  it("issues two independent ledger entries, one per role, each tagged with role metadata", async () => {
    process.env[ENV_KEYS.REFERRAL_QUALIFIED_REFERRER] = "100";
    process.env[ENV_KEYS.REFERRAL_QUALIFIED_REFERRED] = "50";
    issueReward
      .mockResolvedValueOnce({ entry: { _id: "referrerEntry" }, created: true })
      .mockResolvedValueOnce({ entry: { _id: "referredEntry" }, created: true });

    const result = await issueReferralQualifiedRewards({
      referrerId: "referrer1",
      referredUserId: "referred1",
      referralQualificationId: "qual1",
    });

    expect(issueReward).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientId: "referrer1",
        type: "REFERRAL_QUALIFIED_REFERRER",
        amount: 100,
        sourceType: "REFERRAL",
        sourceId: "qual1",
        metadata: expect.objectContaining({ role: "referrer" }),
      })
    );
    expect(issueReward).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientId: "referred1",
        type: "REFERRAL_QUALIFIED_REFERRED",
        amount: 50,
        sourceType: "REFERRAL",
        sourceId: "qual1",
        metadata: expect.objectContaining({ role: "referred" }),
      })
    );
    expect(result.referrer.issued).toBe(true);
    expect(result.referred.issued).toBe(true);
  });

  it("issues the referred-user reward even when the referrer's policy amount is unconfigured", async () => {
    process.env[ENV_KEYS.REFERRAL_QUALIFIED_REFERRED] = "50";
    // REFERRAL_QUALIFIED_REFERRER deliberately left unset
    issueReward.mockResolvedValueOnce({ entry: { _id: "referredEntry" }, created: true });

    const result = await issueReferralQualifiedRewards({
      referrerId: "referrer1",
      referredUserId: "referred1",
      referralQualificationId: "qual1",
    });

    expect(result.referrer).toEqual({ issued: false, reason: "not_configured" });
    expect(result.referred.issued).toBe(true);
    expect(issueReward).toHaveBeenCalledTimes(1);
    expect(issueReward).toHaveBeenCalledWith(
      expect.objectContaining({ recipientId: "referred1", type: "REFERRAL_QUALIFIED_REFERRED" })
    );
  });

  it("returns not_configured for both sides when neither policy amount is set", async () => {
    const result = await issueReferralQualifiedRewards({
      referrerId: "referrer1",
      referredUserId: "referred1",
      referralQualificationId: "qual1",
    });

    expect(result).toEqual({
      referrer: { issued: false, reason: "not_configured" },
      referred: { issued: false, reason: "not_configured" },
    });
    expect(issueReward).not.toHaveBeenCalled();
  });
});