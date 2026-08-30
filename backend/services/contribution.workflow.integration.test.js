import { describe, expect, it, beforeAll, beforeEach, afterEach, afterAll } from "vitest";
import { startTestMongo, clearTestMongo, stopTestMongo } from "../test/mongoMemoryServer.js";

// ── Contribution Infrastructure workflow (Phase 2F, batch 3) ───────────────
//
// Covers, all against real Mongo (no mocked models/services — the same
// "not a mock, that's the whole point" posture
// services/referralQualification.workflow.integration.test.js already
// takes, and for the identical reason: mock-based unit tests can't
// protect against MongoDB's own index enforcement or a genuine
// findOneAndUpdate race, only a real database can).
//
//   1. approveContribution() / rejectContribution() — basic real-Mongo
//      persistence and reward issuance on approval.
//   2. Approve race — two simultaneous approve attempts on the SAME
//      pending contribution, only one can win (atomic
//      status: "pending" guard).
//   3. Approve/reject race — an approve and a reject racing on the same
//      row, only one transition wins, never both.
//   4. Reward failure recovery — retryPendingContributionRewards() picks
//      up and successfully issues a reward that was skipped_unconfigured
//      or failed earlier, without double-issuing anything already issued.

const { default: mongoose } = await import("mongoose");
const {
  createContribution,
  approveContribution,
  rejectContribution,
  retryPendingContributionRewards,
} = await import("./contribution.js");
const { default: Contribution } = await import("../models/Contribution.js");
const { default: User } = await import("../models/User.js");
const { default: RewardLedger } = await import("../models/RewardLedger.js");

const REWARD_ENV_KEY = "REWARD_AMOUNT_CONTRIBUTION_APPROVED";

function clearRewardEnv() {
  delete process.env[REWARD_ENV_KEY];
}

async function seedUser(overrides = {}) {
  return User.create({
    firebaseUid: `fb-${Math.random().toString(36).slice(2)}`,
    email: `user-${Math.random().toString(36).slice(2)}@test.com`,
    ...overrides,
  });
}

describe("Contribution approve/reject: basic workflow (real Mongo)", () => {
  beforeAll(async () => {
    await startTestMongo();
  }, 60_000);

  beforeEach(() => {
    clearRewardEnv();
  });

  afterEach(async () => {
    await clearTestMongo();
    clearRewardEnv();
  });

  afterAll(async () => {
    await stopTestMongo();
  });

  it("approves a pending contribution and issues a configured reward", async () => {
    process.env[REWARD_ENV_KEY] = "75";

    const contributor = await seedUser({ email: "contributor@test.com" });
    const reviewer = await seedUser({ email: "reviewer@test.com" });
    const contribution = await createContribution({
      contributorId: contributor._id,
      kind: "new_problem",
      payload: { title: "Two Sum Variant" },
    });

    const result = await approveContribution({
      contributionId: contribution._id,
      reviewerId: reviewer._id,
    });

    expect(result).toEqual({ approved: true, rewardStatus: "issued" });

    const reloaded = await Contribution.findById(contribution._id);
    expect(reloaded.status).toBe("approved");
    expect(reloaded.rewardStatus).toBe("issued");
    expect(reloaded.reviewedBy.toString()).toBe(reviewer._id.toString());
    expect(reloaded.reviewedAt).toBeInstanceOf(Date);

    expect(await RewardLedger.countDocuments({ userId: contributor._id })).toBe(1);
    const entry = await RewardLedger.findOne({ userId: contributor._id });
    expect(entry.sourceType).toBe("CONTRIBUTION");
    expect(entry.sourceId.toString()).toBe(contribution._id.toString());
    expect(entry.amount).toBe(75);
  });

  it("qualifies (approves) even when the reward amount is unconfigured — approval and reward are decoupled", async () => {
    const contributor = await seedUser({ email: "contributor2@test.com" });
    const reviewer = await seedUser({ email: "reviewer2@test.com" });
    const contribution = await createContribution({
      contributorId: contributor._id,
      kind: "testcase_improvement",
      payload: {},
    });

    const result = await approveContribution({
      contributionId: contribution._id,
      reviewerId: reviewer._id,
    });

    expect(result).toEqual({ approved: true, rewardStatus: "skipped_unconfigured" });
    expect(await RewardLedger.countDocuments({})).toBe(0);

    const reloaded = await Contribution.findById(contribution._id);
    expect(reloaded.status).toBe("approved");
    expect(reloaded.rewardStatus).toBe("skipped_unconfigured");
  });

  it("rejects a pending contribution, stamps rejectionReason, and never issues a reward", async () => {
    process.env[REWARD_ENV_KEY] = "75";

    const contributor = await seedUser({ email: "contributor3@test.com" });
    const reviewer = await seedUser({ email: "reviewer3@test.com" });
    const contribution = await createContribution({
      contributorId: contributor._id,
      kind: "new_problem",
      payload: {},
    });

    const result = await rejectContribution({
      contributionId: contribution._id,
      reviewerId: reviewer._id,
      reason: "Duplicate of an existing problem.",
    });

    expect(result).toEqual({ rejected: true });

    const reloaded = await Contribution.findById(contribution._id);
    expect(reloaded.status).toBe("rejected");
    expect(reloaded.rejectionReason).toBe("Duplicate of an existing problem.");
    expect(reloaded.rewardStatus).toBe("pending"); // never attempted
    expect(await RewardLedger.countDocuments({})).toBe(0);
  });

  it("cannot approve a contribution that is already rejected (terminal state)", async () => {
    const contributor = await seedUser({ email: "contributor4@test.com" });
    const reviewer = await seedUser({ email: "reviewer4@test.com" });
    const contribution = await createContribution({
      contributorId: contributor._id,
      kind: "new_problem",
      payload: {},
    });

    await rejectContribution({ contributionId: contribution._id, reviewerId: reviewer._id });
    const result = await approveContribution({
      contributionId: contribution._id,
      reviewerId: reviewer._id,
    });

    expect(result).toEqual({ approved: false, reason: "not_found_or_not_pending" });
    const reloaded = await Contribution.findById(contribution._id);
    expect(reloaded.status).toBe("rejected"); // unchanged
  });
});

describe("Contribution review race (atomic status:pending guard, real Mongo)", () => {
  beforeAll(async () => {
    await startTestMongo();
  }, 60_000);

  beforeEach(() => {
    clearRewardEnv();
  });

  afterEach(async () => {
    await clearTestMongo();
    clearRewardEnv();
  });

  afterAll(async () => {
    await stopTestMongo();
  });

  it("under real concurrency, only one of two simultaneous approve attempts on the same contribution succeeds, and the reward is issued exactly once", async () => {
    process.env[REWARD_ENV_KEY] = "75";

    const contributor = await seedUser({ email: "raceContributor@test.com" });
    const reviewerA = await seedUser({ email: "raceReviewerA@test.com" });
    const reviewerB = await seedUser({ email: "raceReviewerB@test.com" });
    const contribution = await createContribution({
      contributorId: contributor._id,
      kind: "new_problem",
      payload: {},
    });

    const [resultA, resultB] = await Promise.all([
      approveContribution({ contributionId: contribution._id, reviewerId: reviewerA._id }),
      approveContribution({ contributionId: contribution._id, reviewerId: reviewerB._id }),
    ]);

    const outcomes = [resultA, resultB];
    const wins = outcomes.filter((r) => r.approved);
    const losses = outcomes.filter((r) => !r.approved);
    expect(wins).toHaveLength(1);
    expect(losses).toHaveLength(1);
    expect(losses[0].reason).toBe("not_found_or_not_pending");

    const reloaded = await Contribution.findById(contribution._id);
    expect(reloaded.status).toBe("approved");
    // Whichever reviewer won, the reviewedBy field reflects exactly one
    // of them — never overwritten by the loser (the loser's
    // findOneAndUpdate never matched a document at all).
    expect([reviewerA._id.toString(), reviewerB._id.toString()]).toContain(
      reloaded.reviewedBy.toString()
    );

    // Reward issued exactly once, not twice, despite two concurrent
    // approve() calls racing on the same row.
    expect(await RewardLedger.countDocuments({ userId: contributor._id })).toBe(1);
  });

  it("under real concurrency, an approve and a reject racing on the same contribution — exactly one transition wins, never both", async () => {
    const contributor = await seedUser({ email: "raceContributor2@test.com" });
    const reviewer = await seedUser({ email: "raceReviewer2@test.com" });
    const contribution = await createContribution({
      contributorId: contributor._id,
      kind: "new_problem",
      payload: {},
    });

    const [approveResult, rejectResult] = await Promise.all([
      approveContribution({ contributionId: contribution._id, reviewerId: reviewer._id }),
      rejectContribution({
        contributionId: contribution._id,
        reviewerId: reviewer._id,
        reason: "racing reject",
      }),
    ]);

    // Exactly one of the two atomic transitions can have matched
    // status:"pending" — the loser gets back a no-op result, never a
    // document in some hybrid/inconsistent state.
    const approveWon = approveResult.approved === true;
    const rejectWon = rejectResult.rejected === true;
    expect(approveWon !== rejectWon).toBe(true); // exactly one, not both, not neither

    const reloaded = await Contribution.findById(contribution._id);
    expect(["approved", "rejected"]).toContain(reloaded.status);
    if (approveWon) {
      expect(reloaded.status).toBe("approved");
    } else {
      expect(reloaded.status).toBe("rejected");
      expect(reloaded.rejectionReason).toBe("racing reject");
    }
  });

  it("enforces status transitions at the database level, not just in application code — a second approve after the first always no-ops even without a race", async () => {
    const contributor = await seedUser({ email: "sequentialContributor@test.com" });
    const reviewer = await seedUser({ email: "sequentialReviewer@test.com" });
    const contribution = await createContribution({
      contributorId: contributor._id,
      kind: "new_problem",
      payload: {},
    });

    const first = await approveContribution({ contributionId: contribution._id, reviewerId: reviewer._id });
    const second = await approveContribution({ contributionId: contribution._id, reviewerId: reviewer._id });

    expect(first.approved).toBe(true);
    expect(second).toEqual({ approved: false, reason: "not_found_or_not_pending" });
    expect(await RewardLedger.countDocuments({ userId: contributor._id })).toBe(1);
  });
});

describe("Reward failure recovery: retryPendingContributionRewards (real Mongo)", () => {
  beforeAll(async () => {
    await startTestMongo();
  }, 60_000);

  beforeEach(() => {
    clearRewardEnv();
  });

  afterEach(async () => {
    await clearTestMongo();
    clearRewardEnv();
  });

  afterAll(async () => {
    await stopTestMongo();
  });

  it("successfully issues a reward on retry that was skipped_unconfigured at approval time", async () => {
    const contributor = await seedUser({ email: "retryContributor@test.com" });
    const reviewer = await seedUser({ email: "retryReviewer@test.com" });
    const contribution = await createContribution({
      contributorId: contributor._id,
      kind: "new_problem",
      payload: {},
    });

    const firstAttempt = await approveContribution({
      contributionId: contribution._id,
      reviewerId: reviewer._id,
    });
    expect(firstAttempt).toEqual({ approved: true, rewardStatus: "skipped_unconfigured" });
    expect(await RewardLedger.countDocuments({})).toBe(0);

    process.env[REWARD_ENV_KEY] = "75";

    const retryResult = await retryPendingContributionRewards();
    expect(retryResult).toEqual({ attempted: 1, issued: 1, stillUnissued: 0 });

    const reloaded = await Contribution.findById(contribution._id);
    expect(reloaded.rewardStatus).toBe("issued");
    expect(await RewardLedger.countDocuments({ userId: contributor._id })).toBe(1);
  });

  it("does not double-issue on a second retry call after a reward has already been issued", async () => {
    process.env[REWARD_ENV_KEY] = "75";

    const contributor = await seedUser({ email: "retryContributor2@test.com" });
    const reviewer = await seedUser({ email: "retryReviewer2@test.com" });
    const contribution = await createContribution({
      contributorId: contributor._id,
      kind: "new_problem",
      payload: {},
    });

    await approveContribution({ contributionId: contribution._id, reviewerId: reviewer._id });
    expect(await RewardLedger.countDocuments({})).toBe(1);

    // retryPendingContributionRewards only selects rows where
    // rewardStatus != "issued", so an already-issued row isn't even
    // picked up — but call it anyway to prove it's a safe no-op
    // regardless.
    const retryResult = await retryPendingContributionRewards();
    expect(retryResult).toEqual({ attempted: 0, issued: 0, stillUnissued: 0 });
    expect(await RewardLedger.countDocuments({})).toBe(1);
  });

  it("retrying twice in a row (simulating a repeated manual admin trigger) never produces more than one reward, even for a genuinely failed row", async () => {
    const contributor = await seedUser({ email: "retryContributor3@test.com" });
    const contribution = await Contribution.create({
      contributorId: contributor._id,
      kind: "new_problem",
      payload: {},
      status: "approved",
      reviewedAt: new Date(),
      rewardStatus: "failed",
    });

    process.env[REWARD_ENV_KEY] = "75";

    await retryPendingContributionRewards();
    await retryPendingContributionRewards();

    const reloaded = await Contribution.findById(contribution._id);
    expect(reloaded.rewardStatus).toBe("issued");
    expect(await RewardLedger.countDocuments({ userId: contributor._id })).toBe(1);
  });

  it("respects the limit option, leaving excess rows for a subsequent call", async () => {
    const reviewer = await seedUser({ email: "retryReviewerLimit@test.com" });
    const contributors = await Promise.all(
      [1, 2, 3].map((n) => seedUser({ email: `retryLimit${n}@test.com` }))
    );
    for (const contributor of contributors) {
      const contribution = await createContribution({
        contributorId: contributor._id,
        kind: "new_problem",
        payload: {},
      });
      await approveContribution({ contributionId: contribution._id, reviewerId: reviewer._id });
    }
    // All three approved with no amount configured -> all skipped_unconfigured.
    expect(await Contribution.countDocuments({ rewardStatus: "skipped_unconfigured" })).toBe(3);

    process.env[REWARD_ENV_KEY] = "75";

    const firstRetry = await retryPendingContributionRewards({ limit: 2 });
    expect(firstRetry).toEqual({ attempted: 2, issued: 2, stillUnissued: 0 });
    expect(await Contribution.countDocuments({ rewardStatus: "issued" })).toBe(2);
    expect(await Contribution.countDocuments({ rewardStatus: "skipped_unconfigured" })).toBe(1);

    const secondRetry = await retryPendingContributionRewards({ limit: 2 });
    expect(secondRetry).toEqual({ attempted: 1, issued: 1, stillUnissued: 0 });
    expect(await Contribution.countDocuments({ rewardStatus: "issued" })).toBe(3);
  });
});