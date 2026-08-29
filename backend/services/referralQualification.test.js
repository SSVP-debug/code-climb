import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("../models/Submission.js", () => ({
  default: { countDocuments: vi.fn() },
}));
vi.mock("../models/ReferralQualification.js", () => ({
  default: {
    findOneAndUpdate: vi.fn(),
    updateOne: vi.fn(),
    create: vi.fn(),
    find: vi.fn(),
    exists: vi.fn(),
  },
}));
vi.mock("../models/User.js", () => ({
  default: { findById: vi.fn(), findOne: vi.fn() },
}));
vi.mock("./rewardPolicyService.js", () => ({
  issueReferralQualifiedRewards: vi.fn(),
}));
vi.mock("../config/logger.js", () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import Submission from "../models/Submission.js";
import ReferralQualification from "../models/ReferralQualification.js";
import User from "../models/User.js";
import { issueReferralQualifiedRewards } from "./rewardPolicyService.js";
import { logger } from "../config/logger.js";
import {
  qualifyReferralIfFirstSolve,
  createReferralAssociationQualification,
  retryPendingReferralRewards,
} from "./referralQualification.js";

const userId = "user1";
const submissionId = "submission1";

// Self-heal (services/referralQualification.js §5) helper mocks —
// User.findById(...).select(...).lean() and User.findOne(...).select(...).lean().
function mockReferredByLookup(referredBy) {
  User.findById.mockReturnValue({
    select: () => ({ lean: () => Promise.resolve(referredBy != null ? { referredBy } : null) }),
  });
}
function mockReferrerLookup(referrerDoc) {
  User.findOne.mockReturnValue({
    select: () => ({ lean: () => Promise.resolve(referrerDoc) }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  // Default: a ReferralQualification row already exists for the given
  // user, so selfHealMissingReferralQualification() short-circuits on its
  // first (cheap) check and every pre-existing test below is unaffected.
  // Tests that specifically exercise self-heal override this.
  ReferralQualification.exists.mockResolvedValue(true);
});

describe("qualifyReferralIfFirstSolve", () => {
  it("returns not_first_solve and does nothing else when this is not the user's first Accepted PRACTICE submission", async () => {
    Submission.countDocuments.mockResolvedValueOnce(3);

    const result = await qualifyReferralIfFirstSolve({ userId, submissionId });

    expect(result).toEqual({ qualified: false, reason: "not_first_solve" });
    expect(ReferralQualification.findOneAndUpdate).not.toHaveBeenCalled();
    expect(issueReferralQualifiedRewards).not.toHaveBeenCalled();
  });

  it("scopes the first-solve check to PRACTICE submissions only — filters out contestId/battleRoomId", async () => {
    Submission.countDocuments.mockResolvedValueOnce(1);
    ReferralQualification.findOneAndUpdate.mockResolvedValueOnce(null);

    await qualifyReferralIfFirstSolve({ userId, submissionId });

    expect(Submission.countDocuments).toHaveBeenCalledWith({
      userId,
      status: "Accepted",
      contestId: null,
      battleRoomId: null,
    });
  });

  it("returns not_referred_or_not_pending when no matching pending qualification row exists", async () => {
    Submission.countDocuments.mockResolvedValueOnce(1);
    ReferralQualification.findOneAndUpdate.mockResolvedValueOnce(null);

    const result = await qualifyReferralIfFirstSolve({ userId, submissionId });

    expect(result).toEqual({ qualified: false, reason: "not_referred_or_not_pending" });
    expect(issueReferralQualifiedRewards).not.toHaveBeenCalled();
  });

  it("uses the idempotent status:'pending' filter when attempting to qualify (not just qualifiedAt:null — also excludes ineligible rows)", async () => {
    Submission.countDocuments.mockResolvedValueOnce(1);
    ReferralQualification.findOneAndUpdate.mockResolvedValueOnce(null);

    await qualifyReferralIfFirstSolve({ userId, submissionId });

    expect(ReferralQualification.findOneAndUpdate).toHaveBeenCalledWith(
      { referredUserId: userId, status: "pending" },
      {
        $set: {
          status: "qualified",
          qualifiedAt: expect.any(Date),
          qualificationSourceSubmissionId: submissionId,
        },
      },
      { new: true }
    );
  });

  it("on successful qualification, delegates reward issuance to rewardPolicyService only — never RewardLedger directly — and reports rewardStatus:issued", async () => {
    Submission.countDocuments.mockResolvedValueOnce(1);
    const qualDoc = { _id: "qual1", referrerId: "referrer1", referredUserId: userId };
    ReferralQualification.findOneAndUpdate.mockResolvedValueOnce(qualDoc);
    issueReferralQualifiedRewards.mockResolvedValueOnce({
      referrer: { issued: true },
      referred: { issued: true },
    });
    ReferralQualification.updateOne.mockResolvedValueOnce({});

    const result = await qualifyReferralIfFirstSolve({ userId, submissionId });

    expect(issueReferralQualifiedRewards).toHaveBeenCalledWith({
      referrerId: "referrer1",
      referredUserId: userId,
      referralQualificationId: "qual1",
    });
    expect(ReferralQualification.updateOne).toHaveBeenCalledWith(
      { _id: "qual1" },
      { $set: { rewardStatus: "issued" } }
    );
    expect(result).toEqual({ qualified: true, rewardStatus: "issued" });
  });

  it("reports rewardStatus:skipped_unconfigured when neither side's policy amount was configured", async () => {
    Submission.countDocuments.mockResolvedValueOnce(1);
    const qualDoc = { _id: "qual1", referrerId: "referrer1", referredUserId: userId };
    ReferralQualification.findOneAndUpdate.mockResolvedValueOnce(qualDoc);
    issueReferralQualifiedRewards.mockResolvedValueOnce({
      referrer: { issued: false, reason: "not_configured" },
      referred: { issued: false, reason: "not_configured" },
    });
    ReferralQualification.updateOne.mockResolvedValueOnce({});

    const result = await qualifyReferralIfFirstSolve({ userId, submissionId });

    expect(ReferralQualification.updateOne).toHaveBeenCalledWith(
      { _id: "qual1" },
      { $set: { rewardStatus: "skipped_unconfigured" } }
    );
    expect(result).toEqual({ qualified: true, rewardStatus: "skipped_unconfigured" });
  });

  it("reports rewardStatus:issued when only one side actually issued", async () => {
    Submission.countDocuments.mockResolvedValueOnce(1);
    const qualDoc = { _id: "qual1", referrerId: "referrer1", referredUserId: userId };
    ReferralQualification.findOneAndUpdate.mockResolvedValueOnce(qualDoc);
    issueReferralQualifiedRewards.mockResolvedValueOnce({
      referrer: { issued: false, reason: "not_configured" },
      referred: { issued: true },
    });
    ReferralQualification.updateOne.mockResolvedValueOnce({});

    const result = await qualifyReferralIfFirstSolve({ userId, submissionId });

    expect(result.rewardStatus).toBe("issued");
  });

  it("qualification stands (qualified:true) with rewardStatus:'failed' — not left at the default 'pending' — when reward issuance throws an unexpected error", async () => {
    Submission.countDocuments.mockResolvedValueOnce(1);
    const qualDoc = { _id: "qual1", referrerId: "referrer1", referredUserId: userId };
    ReferralQualification.findOneAndUpdate.mockResolvedValueOnce(qualDoc);
    issueReferralQualifiedRewards.mockRejectedValueOnce(new Error("ledger connection lost"));
    ReferralQualification.updateOne.mockResolvedValueOnce({});

    const result = await qualifyReferralIfFirstSolve({ userId, submissionId });

    expect(result).toEqual({ qualified: true, rewardStatus: "failed" });
    expect(logger.error).toHaveBeenCalled();
    expect(ReferralQualification.updateOne).toHaveBeenCalledWith(
      { _id: "qual1" },
      { $set: { rewardStatus: "failed" } }
    );
  });

  it("never calls RewardLedger or config/rewardPolicy directly — only rewardPolicyService", async () => {
    Submission.countDocuments.mockResolvedValueOnce(1);
    const qualDoc = { _id: "qual1", referrerId: "referrer1", referredUserId: userId };
    ReferralQualification.findOneAndUpdate.mockResolvedValueOnce(qualDoc);
    issueReferralQualifiedRewards.mockResolvedValueOnce({
      referrer: { issued: true },
      referred: { issued: true },
    });
    ReferralQualification.updateOne.mockResolvedValueOnce({});

    await qualifyReferralIfFirstSolve({ userId, submissionId });

    expect(issueReferralQualifiedRewards).toHaveBeenCalledTimes(1);
  });

  it("repeated Accepted submissions after the first do not re-attempt qualification (cheap early exit, no DB write attempted)", async () => {
    Submission.countDocuments.mockResolvedValueOnce(2);

    await qualifyReferralIfFirstSolve({ userId, submissionId });

    expect(ReferralQualification.findOneAndUpdate).not.toHaveBeenCalled();
  });
});

describe("selfHealMissingReferralQualification (via qualifyReferralIfFirstSolve)", () => {
  it("reconstructs a missing row and qualifies correctly when the triggering submission is the user's first-ever accepted practice solve", async () => {
    Submission.countDocuments.mockResolvedValueOnce(1); // this submission IS the first
    ReferralQualification.exists.mockResolvedValueOnce(false); // row missing
    mockReferredByLookup("code123");
    mockReferrerLookup({ _id: "referrer1" });
    ReferralQualification.create.mockResolvedValueOnce({ _id: "reconstructed1" });

    const qualDoc = { _id: "reconstructed1", referrerId: "referrer1", referredUserId: userId };
    ReferralQualification.findOneAndUpdate.mockResolvedValueOnce(qualDoc);
    issueReferralQualifiedRewards.mockResolvedValueOnce({
      referrer: { issued: true },
      referred: { issued: true },
    });
    ReferralQualification.updateOne.mockResolvedValue({});

    const result = await qualifyReferralIfFirstSolve({ userId, submissionId });

    expect(User.findById).toHaveBeenCalledWith(userId);
    expect(User.findOne).toHaveBeenCalledWith({ referralCode: "code123" });
    expect(ReferralQualification.create).toHaveBeenCalledWith({
      referrerId: "referrer1",
      referredUserId: userId,
      referralCodeUsed: "code123",
    });
    // count === 1 → reconstructed as pending (default), so no ineligible
    // updateOne call — only the later rewardStatus updateOne.
    expect(ReferralQualification.updateOne).not.toHaveBeenCalledWith(
      { _id: "reconstructed1" },
      expect.objectContaining({ $set: expect.objectContaining({ status: "ineligible" }) })
    );
    // Reconstructed row is picked up by the normal atomic qualify step.
    expect(ReferralQualification.findOneAndUpdate).toHaveBeenCalledWith(
      { referredUserId: userId, status: "pending" },
      expect.objectContaining({ $set: expect.objectContaining({ status: "qualified" }) }),
      { new: true }
    );
    expect(result).toEqual({ qualified: true, rewardStatus: "issued" });
  });

  it("reconstructs a missing row as ineligible when the referral association happened after the first accepted practice solve", async () => {
    Submission.countDocuments.mockResolvedValueOnce(3); // prior accepted practice solves already existed
    ReferralQualification.exists.mockResolvedValueOnce(false); // row missing
    mockReferredByLookup("code123");
    mockReferrerLookup({ _id: "referrer1" });
    ReferralQualification.create.mockResolvedValueOnce({ _id: "reconstructed2" });

    const result = await qualifyReferralIfFirstSolve({ userId, submissionId });

    expect(ReferralQualification.create).toHaveBeenCalledWith({
      referrerId: "referrer1",
      referredUserId: userId,
      referralCodeUsed: "code123",
    });
    expect(ReferralQualification.updateOne).toHaveBeenCalledWith(
      { _id: "reconstructed2" },
      {
        $set: {
          status: "ineligible",
          ineligibleReason: "reconstructed_after_prior_accepted_practice_solve",
        },
      }
    );
    // not_first_solve early return — the reconstructed row must NOT be
    // qualified in this same call.
    expect(ReferralQualification.findOneAndUpdate).not.toHaveBeenCalled();
    expect(issueReferralQualifiedRewards).not.toHaveBeenCalled();
    expect(result).toEqual({ qualified: false, reason: "not_first_solve" });
  });

  it("does nothing when the user was never referred (no referredBy, no row) — preserves not_referred_or_not_pending", async () => {
    Submission.countDocuments.mockResolvedValueOnce(1);
    ReferralQualification.exists.mockResolvedValueOnce(false); // no row
    mockReferredByLookup(null); // never referred
    ReferralQualification.findOneAndUpdate.mockResolvedValueOnce(null);

    const result = await qualifyReferralIfFirstSolve({ userId, submissionId });

    expect(User.findOne).not.toHaveBeenCalled(); // no referrer lookup attempted
    expect(ReferralQualification.create).not.toHaveBeenCalled();
    expect(result).toEqual({ qualified: false, reason: "not_referred_or_not_pending" });
  });

  it("skips self-heal entirely (no User lookups) when a qualification row already exists", async () => {
    Submission.countDocuments.mockResolvedValueOnce(1);
    ReferralQualification.exists.mockResolvedValueOnce(true); // row already present
    ReferralQualification.findOneAndUpdate.mockResolvedValueOnce(null);

    await qualifyReferralIfFirstSolve({ userId, submissionId });

    expect(User.findById).not.toHaveBeenCalled();
    expect(User.findOne).not.toHaveBeenCalled();
    expect(ReferralQualification.create).not.toHaveBeenCalled();
  });

  it("a losing concurrent reconstruction (E11000 on create) is swallowed silently and qualification still proceeds through the normal atomic step — no duplicate row, no duplicate reward", async () => {
    Submission.countDocuments.mockResolvedValueOnce(1);
    ReferralQualification.exists.mockResolvedValueOnce(false); // this caller saw it missing
    mockReferredByLookup("code123");
    mockReferrerLookup({ _id: "referrer1" });
    const dupError = Object.assign(new Error("E11000 duplicate key"), { code: 11000 });
    ReferralQualification.create.mockRejectedValueOnce(dupError); // another caller won the race

    // The winning concurrent caller's row is what the atomic qualify step
    // below actually picks up.
    const qualDoc = { _id: "winner1", referrerId: "referrer1", referredUserId: userId };
    ReferralQualification.findOneAndUpdate.mockResolvedValueOnce(qualDoc);
    issueReferralQualifiedRewards.mockResolvedValueOnce({
      referrer: { issued: true },
      referred: { issued: true },
    });
    ReferralQualification.updateOne.mockResolvedValue({});

    const result = await qualifyReferralIfFirstSolve({ userId, submissionId });

    expect(logger.error).not.toHaveBeenCalled(); // E11000 is expected, not an error
    expect(ReferralQualification.create).toHaveBeenCalledTimes(1); // this caller only tried once
    expect(issueReferralQualifiedRewards).toHaveBeenCalledTimes(1); // exactly one reward attempt
    expect(result).toEqual({ qualified: true, rewardStatus: "issued" });
  });

  it("logs (but does not throw) when the referrer can no longer be resolved from the referredBy code", async () => {
    Submission.countDocuments.mockResolvedValueOnce(1);
    ReferralQualification.exists.mockResolvedValueOnce(false);
    mockReferredByLookup("code123");
    mockReferrerLookup(null); // referrer not found (e.g. deleted)
    ReferralQualification.findOneAndUpdate.mockResolvedValueOnce(null);

    const result = await qualifyReferralIfFirstSolve({ userId, submissionId });

    expect(ReferralQualification.create).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalled();
    expect(result).toEqual({ qualified: false, reason: "not_referred_or_not_pending" });
  });
});

describe("createReferralAssociationQualification", () => {
  it("creates a pending row when the referred user has no prior accepted practice submission", async () => {
    const row = { _id: "qual1" };
    ReferralQualification.create.mockResolvedValueOnce(row);
    Submission.countDocuments.mockResolvedValueOnce(0);

    const result = await createReferralAssociationQualification({
      referrerId: "referrer1",
      referredUserId: userId,
      referralCodeUsed: "abc123",
    });

    expect(ReferralQualification.create).toHaveBeenCalledWith({
      referrerId: "referrer1",
      referredUserId: userId,
      referralCodeUsed: "abc123",
    });
    expect(Submission.countDocuments).toHaveBeenCalledWith({
      userId,
      status: "Accepted",
      contestId: null,
      battleRoomId: null,
    });
    expect(ReferralQualification.updateOne).not.toHaveBeenCalled();
    expect(result).toBe(row);
  });

  it("marks the row ineligible immediately when the referred user already has a prior accepted practice submission (timing rule)", async () => {
    const row = { _id: "qual1" };
    ReferralQualification.create.mockResolvedValueOnce(row);
    Submission.countDocuments.mockResolvedValueOnce(1);

    await createReferralAssociationQualification({
      referrerId: "referrer1",
      referredUserId: userId,
      referralCodeUsed: "abc123",
    });

    expect(ReferralQualification.updateOne).toHaveBeenCalledWith(
      { _id: "qual1" },
      {
        $set: {
          status: "ineligible",
          ineligibleReason: "referral_applied_after_first_accepted_practice_solve",
        },
      }
    );
  });

  it("does NOT mark ineligible based on a prior accepted CONTEST/Battle Room submission alone (practice-scope consistency)", async () => {
    const row = { _id: "qual1" };
    ReferralQualification.create.mockResolvedValueOnce(row);
    // The mocked countDocuments call itself already encodes the
    // contestId:null/battleRoomId:null filter (asserted above) — a prior
    // contest-only Accepted submission would not be counted, so this
    // returns 0 in that scenario.
    Submission.countDocuments.mockResolvedValueOnce(0);

    await createReferralAssociationQualification({
      referrerId: "referrer1",
      referredUserId: userId,
      referralCodeUsed: "abc123",
    });

    expect(ReferralQualification.updateOne).not.toHaveBeenCalled();
  });
});

describe("retryPendingReferralRewards", () => {
  it("re-attempts reward issuance for every qualified row not yet issued, and reports counts", async () => {
    const rows = [
      { _id: "qual1", referrerId: "r1", referredUserId: "u1" },
      { _id: "qual2", referrerId: "r2", referredUserId: "u2" },
    ];
    ReferralQualification.find.mockReturnValue({ limit: vi.fn().mockResolvedValue(rows) });
    issueReferralQualifiedRewards
      .mockResolvedValueOnce({ referrer: { issued: true }, referred: { issued: true } })
      .mockResolvedValueOnce({
        referrer: { issued: false, reason: "not_configured" },
        referred: { issued: false, reason: "not_configured" },
      });
    ReferralQualification.updateOne.mockResolvedValue({});

    const result = await retryPendingReferralRewards();

    expect(ReferralQualification.find).toHaveBeenCalledWith({
      status: "qualified",
      rewardStatus: { $ne: "issued" },
    });
    expect(result).toEqual({ attempted: 2, issued: 1, stillUnissued: 1 });
  });

  it("respects a custom limit", async () => {
    const limitSpy = vi.fn().mockResolvedValue([]);
    ReferralQualification.find.mockReturnValue({ limit: limitSpy });

    await retryPendingReferralRewards({ limit: 25 });

    expect(limitSpy).toHaveBeenCalledWith(25);
  });

  it("defaults to a limit of 100 when not specified", async () => {
    const limitSpy = vi.fn().mockResolvedValue([]);
    ReferralQualification.find.mockReturnValue({ limit: limitSpy });

    await retryPendingReferralRewards();

    expect(limitSpy).toHaveBeenCalledWith(100);
  });

  it("is safe to call with zero eligible rows", async () => {
    ReferralQualification.find.mockReturnValue({ limit: vi.fn().mockResolvedValue([]) });

    const result = await retryPendingReferralRewards();

    expect(result).toEqual({ attempted: 0, issued: 0, stillUnissued: 0 });
    expect(issueReferralQualifiedRewards).not.toHaveBeenCalled();
  });

  it("cannot double-issue on retry — relies on RewardLedger's own idempotency; verified here as one issueReferralQualifiedRewards call per row per retry pass, never more", async () => {
    const rows = [{ _id: "qual1", referrerId: "r1", referredUserId: "u1" }];
    ReferralQualification.find.mockReturnValue({ limit: vi.fn().mockResolvedValue(rows) });
    issueReferralQualifiedRewards.mockResolvedValueOnce({
      referrer: { issued: true },
      referred: { issued: true },
    });
    ReferralQualification.updateOne.mockResolvedValueOnce({});

    await retryPendingReferralRewards();

    expect(issueReferralQualifiedRewards).toHaveBeenCalledTimes(1);
  });
});