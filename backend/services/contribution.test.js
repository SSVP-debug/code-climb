import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("../models/Contribution.js", () => ({
  default: {
    create: vi.fn(),
    findOneAndUpdate: vi.fn(),
    updateOne: vi.fn(),
    find: vi.fn(),
  },
}));
vi.mock("./rewardPolicyService.js", () => ({
  issueContributionApprovedReward: vi.fn(),
}));
vi.mock("../config/logger.js", () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import Contribution from "../models/Contribution.js";
import { issueContributionApprovedReward } from "./rewardPolicyService.js";
import { logger } from "../config/logger.js";
import {
  createContribution,
  approveContribution,
  rejectContribution,
  retryPendingContributionRewards,
} from "./contribution.js";

const contributorId = "user1";
const reviewerId = "admin1";
const contributionId = "contribution1";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("createContribution", () => {
  it("persists a pending Contribution with the given kind and payload", async () => {
    Contribution.create.mockResolvedValueOnce({ _id: contributionId });

    const result = await createContribution({
      contributorId,
      kind: "new_problem",
      payload: { title: "Two Sum Variant" },
    });

    expect(Contribution.create).toHaveBeenCalledWith({
      contributorId,
      kind: "new_problem",
      payload: { title: "Two Sum Variant" },
    });
    expect(result).toEqual({ _id: contributionId });
  });

  it("defaults payload to an empty object when omitted", async () => {
    Contribution.create.mockResolvedValueOnce({ _id: contributionId });

    await createContribution({ contributorId, kind: "testcase_improvement" });

    expect(Contribution.create).toHaveBeenCalledWith({
      contributorId,
      kind: "testcase_improvement",
      payload: {},
    });
  });
});

describe("approveContribution", () => {
  it("returns not_found_or_not_pending and issues no reward when there is no matching pending row", async () => {
    Contribution.findOneAndUpdate.mockResolvedValueOnce(null);

    const result = await approveContribution({ contributionId, reviewerId });

    expect(result).toEqual({ approved: false, reason: "not_found_or_not_pending" });
    expect(issueContributionApprovedReward).not.toHaveBeenCalled();
  });

  it("atomically transitions pending -> approved, stamping reviewedBy/reviewedAt", async () => {
    Contribution.findOneAndUpdate.mockResolvedValueOnce({
      _id: contributionId,
      contributorId,
    });
    issueContributionApprovedReward.mockResolvedValueOnce({ issued: true });

    await approveContribution({ contributionId, reviewerId });

    expect(Contribution.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: contributionId, status: "pending" },
      {
        $set: expect.objectContaining({ status: "approved", reviewedBy: reviewerId }),
      },
      { new: true }
    );
  });

  it("attempts reward issuance for the contributor and marks rewardStatus issued on success", async () => {
    Contribution.findOneAndUpdate.mockResolvedValueOnce({
      _id: contributionId,
      contributorId,
    });
    issueContributionApprovedReward.mockResolvedValueOnce({ issued: true });

    const result = await approveContribution({ contributionId, reviewerId });

    expect(issueContributionApprovedReward).toHaveBeenCalledWith({
      contributorId,
      contributionId,
    });
    expect(Contribution.updateOne).toHaveBeenCalledWith(
      { _id: contributionId },
      { $set: { rewardStatus: "issued" } }
    );
    expect(result).toEqual({ approved: true, rewardStatus: "issued" });
  });

  it("marks rewardStatus skipped_unconfigured when the policy layer reports issued: false", async () => {
    Contribution.findOneAndUpdate.mockResolvedValueOnce({
      _id: contributionId,
      contributorId,
    });
    issueContributionApprovedReward.mockResolvedValueOnce({ issued: false, reason: "not_configured" });

    const result = await approveContribution({ contributionId, reviewerId });

    expect(Contribution.updateOne).toHaveBeenCalledWith(
      { _id: contributionId },
      { $set: { rewardStatus: "skipped_unconfigured" } }
    );
    expect(result).toEqual({ approved: true, rewardStatus: "skipped_unconfigured" });
  });

  it("marks rewardStatus failed, logs, and does not throw when reward issuance errors", async () => {
    Contribution.findOneAndUpdate.mockResolvedValueOnce({
      _id: contributionId,
      contributorId,
    });
    issueContributionApprovedReward.mockRejectedValueOnce(new Error("ledger down"));

    const result = await approveContribution({ contributionId, reviewerId });

    expect(logger.error).toHaveBeenCalled();
    expect(Contribution.updateOne).toHaveBeenCalledWith(
      { _id: contributionId },
      { $set: { rewardStatus: "failed" } }
    );
    expect(result).toEqual({ approved: true, rewardStatus: "failed" });
  });
});

describe("rejectContribution", () => {
  it("returns rejected: false when there is no matching pending row", async () => {
    Contribution.findOneAndUpdate.mockResolvedValueOnce(null);

    const result = await rejectContribution({ contributionId, reviewerId, reason: "duplicate" });

    expect(result).toEqual({ rejected: false, reason: "not_found_or_not_pending" });
  });

  it("atomically transitions pending -> rejected, stamping reviewedBy/reviewedAt/rejectionReason, and never issues a reward", async () => {
    Contribution.findOneAndUpdate.mockResolvedValueOnce({ _id: contributionId });

    const result = await rejectContribution({ contributionId, reviewerId, reason: "duplicate" });

    expect(Contribution.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: contributionId, status: "pending" },
      {
        $set: expect.objectContaining({
          status: "rejected",
          reviewedBy: reviewerId,
          rejectionReason: "duplicate",
        }),
      },
      { new: true }
    );
    expect(result).toEqual({ rejected: true });
    expect(issueContributionApprovedReward).not.toHaveBeenCalled();
  });

  it("defaults rejectionReason to null when omitted", async () => {
    Contribution.findOneAndUpdate.mockResolvedValueOnce({ _id: contributionId });

    await rejectContribution({ contributionId, reviewerId });

    expect(Contribution.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: contributionId, status: "pending" },
      { $set: expect.objectContaining({ rejectionReason: null }) },
      { new: true }
    );
  });
});

describe("retryPendingContributionRewards", () => {
  it("queries approved rows whose rewardStatus is not issued, capped at the given limit", async () => {
    const limitFn = vi.fn().mockResolvedValue([]);
    Contribution.find.mockReturnValueOnce({ limit: limitFn });

    await retryPendingContributionRewards({ limit: 50 });

    expect(Contribution.find).toHaveBeenCalledWith({
      status: "approved",
      rewardStatus: { $ne: "issued" },
    });
    expect(limitFn).toHaveBeenCalledWith(50);
  });

  it("defaults limit to 100 when not provided", async () => {
    const limitFn = vi.fn().mockResolvedValue([]);
    Contribution.find.mockReturnValueOnce({ limit: limitFn });

    await retryPendingContributionRewards();

    expect(limitFn).toHaveBeenCalledWith(100);
  });

  it("re-attempts issuance for every row and tallies attempted/issued/stillUnissued correctly", async () => {
    const rows = [
      { _id: "c1", contributorId: "u1" },
      { _id: "c2", contributorId: "u2" },
      { _id: "c3", contributorId: "u3" },
    ];
    Contribution.find.mockReturnValueOnce({ limit: vi.fn().mockResolvedValue(rows) });
    issueContributionApprovedReward
      .mockResolvedValueOnce({ issued: true })
      .mockResolvedValueOnce({ issued: false, reason: "not_configured" })
      .mockRejectedValueOnce(new Error("transient"));

    const result = await retryPendingContributionRewards();

    expect(issueContributionApprovedReward).toHaveBeenCalledTimes(3);
    expect(result).toEqual({ attempted: 3, issued: 1, stillUnissued: 2 });
  });

  it("returns zeroed counts when there is nothing to retry", async () => {
    Contribution.find.mockReturnValueOnce({ limit: vi.fn().mockResolvedValue([]) });

    const result = await retryPendingContributionRewards();

    expect(result).toEqual({ attempted: 0, issued: 0, stillUnissued: 0 });
    expect(issueContributionApprovedReward).not.toHaveBeenCalled();
  });
});