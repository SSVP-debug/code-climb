import { describe, expect, it, beforeAll, beforeEach, afterEach, afterAll } from "vitest";
import { startTestMongo, clearTestMongo, stopTestMongo } from "../test/mongoMemoryServer.js";

// ── Feature Requests workflow (Phase 5, batch 3) ────────────────────────────
//
// Covers, all against real Mongo (no mocked models/services — same "not a
// mock, that's the whole point" posture
// contribution.workflow.integration.test.js and
// referralQualification.workflow.integration.test.js both already take):
//
//   1. Basic create/vote/edit/withdraw/status workflow — real persistence,
//      real Counter.js-backed ccId allocation, real reward issuance on
//      reaching "shipped".
//   2. The vote race — this phase's genuinely new concurrency-sensitive
//      piece, not present in Contribution's own integration tier at all.
//      Three distinct races, per services/featureRequests.js's own
//      header-comment breakdown of what toggleVote() does and does not
//      fully close:
//        a) two different users voting concurrently — both must land,
//           voteCount must land at exactly +2, not +1 (a naive
//           non-atomic increment could lose one under real concurrency).
//        b) the SAME user attempting to vote twice concurrently (no
//           existing vote) — exactly one vote must persist, never two,
//           proven against FeatureRequestVote's real unique index (a
//           mock can't enforce this at all).
//        c) the SAME user's vote/unvote racing against itself (the
//           documented, accepted limitation from toggleVote()'s own
//           comment) — proves the failure mode stays benign
//           (voteCount always matches the real row count, never goes
//           negative, no duplicate rows) even though the specific
//           outcome is non-deterministic.
//   3. Reward failure recovery — retryPendingFeatureRequestRewards()
//      picks up a shipped request whose reward was skipped_unconfigured
//      or failed, without double-issuing anything already issued.

const { default: mongoose } = await import("mongoose");
const {
  createFeatureRequest,
  toggleVote,
  editFeatureRequest,
  withdrawFeatureRequest,
  updateFeatureRequestStatus,
  retryPendingFeatureRequestRewards,
} = await import("./featureRequests.js");
const { default: FeatureRequest } = await import("../models/FeatureRequest.js");
const { default: FeatureRequestVote } = await import("../models/FeatureRequestVote.js");
const { default: User } = await import("../models/User.js");
const { default: RewardLedger } = await import("../models/RewardLedger.js");

const REWARD_ENV_KEY = "REWARD_AMOUNT_FEATURE_REQUEST_SHIPPED";

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

async function seedOpenRequest(submitter) {
  return createFeatureRequest({
    submittedBy: submitter._id,
    title: "Dark mode for the editor",
    description: "Add a dark theme option.",
  });
}

describe("FeatureRequest create/vote/edit/withdraw/status: basic workflow (real Mongo)", () => {
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

  it("allocates a sequential ccId via Counter.js and auto-votes the submitter", async () => {
    const submitter = await seedUser({ email: "submitter@test.com" });
    const featureRequest = await seedOpenRequest(submitter);

    expect(featureRequest.ccId).toBe("FR/001");
    expect(featureRequest.voteCount).toBe(1);

    const reloaded = await FeatureRequest.findById(featureRequest._id);
    expect(reloaded.voteCount).toBe(1);
    expect(
      await FeatureRequestVote.countDocuments({
        featureRequestId: featureRequest._id,
        userId: submitter._id,
      })
    ).toBe(1);
  });

  it("increments ccNumber sequentially across multiple requests", async () => {
    const submitter = await seedUser({ email: "submitter2@test.com" });
    const first = await seedOpenRequest(submitter);
    const second = await seedOpenRequest(submitter);

    expect(first.ccId).toBe("FR/001");
    expect(second.ccId).toBe("FR/002");
  });

  it("a second user's vote persists a real FeatureRequestVote row and increments voteCount", async () => {
    const submitter = await seedUser({ email: "submitter3@test.com" });
    const voter = await seedUser({ email: "voter3@test.com" });
    const featureRequest = await seedOpenRequest(submitter);

    const result = await toggleVote({ featureRequestId: featureRequest._id, userId: voter._id });

    expect(result).toEqual({ voted: true });
    const reloaded = await FeatureRequest.findById(featureRequest._id);
    expect(reloaded.voteCount).toBe(2);
    expect(
      await FeatureRequestVote.countDocuments({ featureRequestId: featureRequest._id })
    ).toBe(2);
  });

  it("toggling again removes the vote and decrements voteCount, deleting the real row", async () => {
    const submitter = await seedUser({ email: "submitter4@test.com" });
    const voter = await seedUser({ email: "voter4@test.com" });
    const featureRequest = await seedOpenRequest(submitter);
    await toggleVote({ featureRequestId: featureRequest._id, userId: voter._id });

    const result = await toggleVote({ featureRequestId: featureRequest._id, userId: voter._id });

    expect(result).toEqual({ voted: false });
    const reloaded = await FeatureRequest.findById(featureRequest._id);
    expect(reloaded.voteCount).toBe(1); // back to just the submitter's own vote
    expect(
      await FeatureRequestVote.countDocuments({
        featureRequestId: featureRequest._id,
        userId: voter._id,
      })
    ).toBe(0);
  });

  it("edits title/description only while open and only for the request's own submitter", async () => {
    const submitter = await seedUser({ email: "submitter5@test.com" });
    const stranger = await seedUser({ email: "stranger5@test.com" });
    const featureRequest = await seedOpenRequest(submitter);

    const strangerAttempt = await editFeatureRequest({
      featureRequestId: featureRequest._id,
      requesterId: stranger._id,
      title: "Hijacked title",
    });
    expect(strangerAttempt).toEqual({
      updated: false,
      reason: "not_found_not_owner_or_not_open",
    });

    const ownerAttempt = await editFeatureRequest({
      featureRequestId: featureRequest._id,
      requesterId: submitter._id,
      title: "Dark mode, refined",
    });
    expect(ownerAttempt).toEqual({ updated: true });

    const reloaded = await FeatureRequest.findById(featureRequest._id);
    expect(reloaded.title).toBe("Dark mode, refined");
  });

  it("locks editing once the request is no longer open", async () => {
    const submitter = await seedUser({ email: "submitter6@test.com" });
    const reviewer = await seedUser({ email: "reviewer6@test.com" });
    const featureRequest = await seedOpenRequest(submitter);
    await updateFeatureRequestStatus({
      featureRequestId: featureRequest._id,
      status: "planned",
      reviewerId: reviewer._id,
    });

    const result = await editFeatureRequest({
      featureRequestId: featureRequest._id,
      requesterId: submitter._id,
      title: "Too late",
    });

    expect(result).toEqual({ updated: false, reason: "not_found_not_owner_or_not_open" });
    const reloaded = await FeatureRequest.findById(featureRequest._id);
    expect(reloaded.title).not.toBe("Too late");
  });

  it("withdraws only while open and only for the submitter, setting status to withdrawn", async () => {
    const submitter = await seedUser({ email: "submitter7@test.com" });
    const stranger = await seedUser({ email: "stranger7@test.com" });
    const featureRequest = await seedOpenRequest(submitter);

    const strangerAttempt = await withdrawFeatureRequest({
      featureRequestId: featureRequest._id,
      requesterId: stranger._id,
    });
    expect(strangerAttempt.withdrawn).toBe(false);

    const ownerAttempt = await withdrawFeatureRequest({
      featureRequestId: featureRequest._id,
      requesterId: submitter._id,
    });
    expect(ownerAttempt).toEqual({ withdrawn: true });

    const reloaded = await FeatureRequest.findById(featureRequest._id);
    expect(reloaded.status).toBe("withdrawn");
  });

  it("transitions open -> planned -> in_progress -> shipped, issuing a configured reward on shipping", async () => {
    process.env[REWARD_ENV_KEY] = "40";
    const submitter = await seedUser({ email: "submitter8@test.com" });
    const reviewer = await seedUser({ email: "reviewer8@test.com" });
    const featureRequest = await seedOpenRequest(submitter);

    await updateFeatureRequestStatus({
      featureRequestId: featureRequest._id,
      status: "planned",
      reviewerId: reviewer._id,
    });
    await updateFeatureRequestStatus({
      featureRequestId: featureRequest._id,
      status: "in_progress",
      reviewerId: reviewer._id,
    });
    const shipResult = await updateFeatureRequestStatus({
      featureRequestId: featureRequest._id,
      status: "shipped",
      reviewerId: reviewer._id,
    });

    expect(shipResult).toEqual({ updated: true, rewardStatus: "issued" });
    const reloaded = await FeatureRequest.findById(featureRequest._id);
    expect(reloaded.status).toBe("shipped");
    expect(reloaded.rewardStatus).toBe("issued");

    expect(await RewardLedger.countDocuments({ userId: submitter._id })).toBe(1);
    const entry = await RewardLedger.findOne({ userId: submitter._id });
    expect(entry.sourceType).toBe("FEATURE_REQUEST");
    expect(entry.sourceId.toString()).toBe(featureRequest._id.toString());
    expect(entry.amount).toBe(40);
  });

  it("declining never issues a reward, and a terminal request can never be re-transitioned", async () => {
    const submitter = await seedUser({ email: "submitter9@test.com" });
    const reviewer = await seedUser({ email: "reviewer9@test.com" });
    const featureRequest = await seedOpenRequest(submitter);

    const declineResult = await updateFeatureRequestStatus({
      featureRequestId: featureRequest._id,
      status: "declined",
      reviewerId: reviewer._id,
    });
    expect(declineResult).toEqual({ updated: true });
    expect(await RewardLedger.countDocuments({})).toBe(0);

    const secondAttempt = await updateFeatureRequestStatus({
      featureRequestId: featureRequest._id,
      status: "planned",
      reviewerId: reviewer._id,
    });
    expect(secondAttempt).toEqual({ updated: false, reason: "not_found_or_already_terminal" });

    const reloaded = await FeatureRequest.findById(featureRequest._id);
    expect(reloaded.status).toBe("declined"); // unchanged
  });
});

describe("FeatureRequest vote race (real Mongo)", () => {
  beforeAll(async () => {
    await startTestMongo();
  }, 60_000);

  afterEach(async () => {
    await clearTestMongo();
  });

  afterAll(async () => {
    await stopTestMongo();
  });

  it("two different users voting concurrently both land — voteCount increments by exactly 2, not 1", async () => {
    const submitter = await seedUser({ email: "raceSubmitter@test.com" });
    const voterA = await seedUser({ email: "raceVoterA@test.com" });
    const voterB = await seedUser({ email: "raceVoterB@test.com" });
    const featureRequest = await seedOpenRequest(submitter); // voteCount starts at 1

    const [resultA, resultB] = await Promise.all([
      toggleVote({ featureRequestId: featureRequest._id, userId: voterA._id }),
      toggleVote({ featureRequestId: featureRequest._id, userId: voterB._id }),
    ]);

    expect(resultA).toEqual({ voted: true });
    expect(resultB).toEqual({ voted: true });

    const reloaded = await FeatureRequest.findById(featureRequest._id);
    expect(reloaded.voteCount).toBe(3); // 1 (submitter) + A + B
    expect(
      await FeatureRequestVote.countDocuments({ featureRequestId: featureRequest._id })
    ).toBe(3);
  });

  it("the same user attempting to vote twice concurrently: exactly one vote persists, enforced by FeatureRequestVote's real unique index", async () => {
    const submitter = await seedUser({ email: "raceSubmitter2@test.com" });
    const voter = await seedUser({ email: "raceVoter2@test.com" });
    const featureRequest = await seedOpenRequest(submitter); // voteCount starts at 1

    const [resultA, resultB] = await Promise.all([
      toggleVote({ featureRequestId: featureRequest._id, userId: voter._id }),
      toggleVote({ featureRequestId: featureRequest._id, userId: voter._id }),
    ]);

    // Both calls report voted:true from this caller's point of view
    // (one genuinely created the row, the other lost the race on the
    // unique index and treated that as "already voted" — see
    // castVote()'s own E11000 handling) — but only ONE row and ONE
    // increment can have actually happened.
    expect(resultA).toEqual({ voted: true });
    expect(resultB).toEqual({ voted: true });

    const reloaded = await FeatureRequest.findById(featureRequest._id);
    expect(reloaded.voteCount).toBe(2); // 1 (submitter) + exactly 1 (voter), never 3
    expect(
      await FeatureRequestVote.countDocuments({
        featureRequestId: featureRequest._id,
        userId: voter._id,
      })
    ).toBe(1); // the unique index made a second row impossible
  });

  it("the same user's vote/unvote racing against itself: stays a benign, self-consistent outcome even though the specific result is non-deterministic (documented limitation)", async () => {
    const submitter = await seedUser({ email: "raceSubmitter3@test.com" });
    const voter = await seedUser({ email: "raceVoter3@test.com" });
    const featureRequest = await seedOpenRequest(submitter);
    // Give voter an existing vote first, so both concurrent calls below
    // are racing over the SAME (existing) vote row — this is the
    // "double-click unvote" scenario toggleVote()'s own header comment
    // flags as not fully closed.
    await toggleVote({ featureRequestId: featureRequest._id, userId: voter._id });

    await Promise.all([
      toggleVote({ featureRequestId: featureRequest._id, userId: voter._id }),
      toggleVote({ featureRequestId: featureRequest._id, userId: voter._id }),
    ]);

    // The specific end state (voted or not) is genuinely
    // non-deterministic under this race — what matters is that it never
    // corrupts: voteCount must always equal the real number of
    // FeatureRequestVote rows for this request (no drift), it must
    // never go negative, and there must never be more than one vote
    // row for this (featureRequestId, userId) pair (the unique index
    // holding even under this adversarial interleaving).
    const reloaded = await FeatureRequest.findById(featureRequest._id);
    const actualVoteCount = await FeatureRequestVote.countDocuments({
      featureRequestId: featureRequest._id,
    });
    const voterRowCount = await FeatureRequestVote.countDocuments({
      featureRequestId: featureRequest._id,
      userId: voter._id,
    });

    expect(reloaded.voteCount).toBeGreaterThanOrEqual(0);
    expect(reloaded.voteCount).toBe(actualVoteCount);
    expect(voterRowCount).toBeLessThanOrEqual(1);
  });

  it("an admin status transition racing against a vote on the same request: the vote and the status change are independent and both land correctly", async () => {
    const submitter = await seedUser({ email: "raceSubmitter4@test.com" });
    const voter = await seedUser({ email: "raceVoter4@test.com" });
    const reviewer = await seedUser({ email: "raceReviewer4@test.com" });
    const featureRequest = await seedOpenRequest(submitter);

    const [voteResult, statusResult] = await Promise.all([
      toggleVote({ featureRequestId: featureRequest._id, userId: voter._id }),
      updateFeatureRequestStatus({
        featureRequestId: featureRequest._id,
        status: "planned",
        reviewerId: reviewer._id,
      }),
    ]);

    expect(voteResult).toEqual({ voted: true });
    expect(statusResult).toEqual({ updated: true });

    const reloaded = await FeatureRequest.findById(featureRequest._id);
    expect(reloaded.status).toBe("planned");
    expect(reloaded.voteCount).toBe(2);
  });
});

describe("Reward failure recovery: retryPendingFeatureRequestRewards (real Mongo)", () => {
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

  async function shipRequest(submitter, reviewer) {
    const featureRequest = await seedOpenRequest(submitter);
    await updateFeatureRequestStatus({
      featureRequestId: featureRequest._id,
      status: "planned",
      reviewerId: reviewer._id,
    });
    await updateFeatureRequestStatus({
      featureRequestId: featureRequest._id,
      status: "shipped",
      reviewerId: reviewer._id,
    });
    return featureRequest;
  }

  it("successfully issues a reward on retry that was skipped_unconfigured when the request shipped", async () => {
    const submitter = await seedUser({ email: "retrySubmitter@test.com" });
    const reviewer = await seedUser({ email: "retryReviewer@test.com" });
    const featureRequest = await shipRequest(submitter, reviewer);

    const reloadedBefore = await FeatureRequest.findById(featureRequest._id);
    expect(reloadedBefore.rewardStatus).toBe("skipped_unconfigured");
    expect(await RewardLedger.countDocuments({})).toBe(0);

    process.env[REWARD_ENV_KEY] = "40";

    const retryResult = await retryPendingFeatureRequestRewards();
    expect(retryResult).toEqual({ attempted: 1, issued: 1, stillUnissued: 0 });

    const reloadedAfter = await FeatureRequest.findById(featureRequest._id);
    expect(reloadedAfter.rewardStatus).toBe("issued");
    expect(await RewardLedger.countDocuments({ userId: submitter._id })).toBe(1);
  });

  it("does not double-issue on a second retry call after a reward has already been issued", async () => {
    process.env[REWARD_ENV_KEY] = "40";
    const submitter = await seedUser({ email: "retrySubmitter2@test.com" });
    const reviewer = await seedUser({ email: "retryReviewer2@test.com" });
    await shipRequest(submitter, reviewer);
    expect(await RewardLedger.countDocuments({})).toBe(1);

    const retryResult = await retryPendingFeatureRequestRewards();
    expect(retryResult).toEqual({ attempted: 0, issued: 0, stillUnissued: 0 });
    expect(await RewardLedger.countDocuments({})).toBe(1);
  });

  it("respects the limit option, leaving excess rows for a subsequent call", async () => {
    const reviewer = await seedUser({ email: "retryReviewerLimit@test.com" });
    const submitters = await Promise.all(
      [1, 2, 3].map((n) => seedUser({ email: `retryLimit${n}@test.com` }))
    );
    for (const submitter of submitters) {
      await shipRequest(submitter, reviewer);
    }
    expect(await FeatureRequest.countDocuments({ rewardStatus: "skipped_unconfigured" })).toBe(3);

    process.env[REWARD_ENV_KEY] = "40";

    const firstRetry = await retryPendingFeatureRequestRewards({ limit: 2 });
    expect(firstRetry).toEqual({ attempted: 2, issued: 2, stillUnissued: 0 });
    expect(await FeatureRequest.countDocuments({ rewardStatus: "issued" })).toBe(2);
    expect(await FeatureRequest.countDocuments({ rewardStatus: "skipped_unconfigured" })).toBe(1);

    const secondRetry = await retryPendingFeatureRequestRewards({ limit: 2 });
    expect(secondRetry).toEqual({ attempted: 1, issued: 1, stillUnissued: 0 });
    expect(await FeatureRequest.countDocuments({ rewardStatus: "issued" })).toBe(3);
  });

  it("never retries a declined request — decline never enters the reward-retry queue at all", async () => {
    const submitter = await seedUser({ email: "retrySubmitter5@test.com" });
    const reviewer = await seedUser({ email: "retryReviewer5@test.com" });
    const featureRequest = await seedOpenRequest(submitter);
    await updateFeatureRequestStatus({
      featureRequestId: featureRequest._id,
      status: "declined",
      reviewerId: reviewer._id,
    });

    process.env[REWARD_ENV_KEY] = "40";
    const retryResult = await retryPendingFeatureRequestRewards();

    expect(retryResult).toEqual({ attempted: 0, issued: 0, stillUnissued: 0 });
    expect(await RewardLedger.countDocuments({})).toBe(0);
  });
});