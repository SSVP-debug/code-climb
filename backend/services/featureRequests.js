import FeatureRequest from "../models/FeatureRequest.js";
import FeatureRequestVote from "../models/FeatureRequestVote.js";
import { nextSequence } from "../models/Counter.js";
import { issueFeatureRequestShippedReward } from "./rewardPolicyService.js";
import { logger } from "../config/logger.js";

/**
 * services/featureRequests.js — Phase 5 (Feature Requests).
 *
 * See plans/005-feature-requests-scoping.md for the full scoping
 * writeup this file implements against. Same three-part shape
 * services/contribution.js and services/referralQualification.js both
 * already use for "user action -> admin/system decision -> RewardLedger"
 * flows, plus the vote toggle, which is this phase's genuinely new
 * concurrency-sensitive piece (see toggleVote() below).
 *
 * Sole intended callers (batch 2, not yet built — routes/controllers are
 * explicitly out of scope for this pass, same posture Contribution's
 * batch 1 took): a student/recruiter/TPO-facing submission + vote +
 * edit/withdraw endpoint calls createFeatureRequest() / toggleVote() /
 * editFeatureRequest() / withdrawFeatureRequest(); an admin-only status
 * endpoint calls updateFeatureRequestStatus(); an admin-only retry
 * endpoint (mirroring POST /api/admin/referral/retry-rewards) calls
 * retryPendingFeatureRequestRewards().
 */

const TERMINAL_STATUSES = Object.freeze(["shipped", "declined", "withdrawn"]);
const ALL_STATUSES = Object.freeze([
  "open",
  "planned",
  "in_progress",
  "shipped",
  "declined",
  "withdrawn",
]);

function ccPrefix(ccNumber) {
  return `FR/${String(ccNumber).padStart(3, "0")}`;
}

/**
 * createFeatureRequest — allocates a human-readable ccId/ccNumber (same
 * Counter.js-backed atomic allocation Opportunity.js uses), persists a
 * new "open" FeatureRequest, and casts the submitter's own vote for it.
 *
 * Auto-voting the submitter for their own request (voteCount starts at
 * 1, not 0) is a small implementation-detail decision made here, not a
 * product decision Bunny was asked about — matches the common
 * public-roadmap-board convention that a submitter implicitly backs
 * their own idea, and keeps voteCount an honest count of real votes
 * cast rather than needing a "+1 for the author, always" display-layer
 * adjustment on every future read.
 *
 * @param {Object} params
 * @param {string|import("mongoose").Types.ObjectId} params.submittedBy
 * @param {string} params.title
 * @param {string} params.description
 * @returns {Promise<import("mongoose").Document>}
 */
export async function createFeatureRequest({ submittedBy, title, description }) {
  const ccNumber = await nextSequence("featureRequest");
  const ccId = ccPrefix(ccNumber);

  const featureRequest = await FeatureRequest.create({
    ccId,
    ccNumber,
    submittedBy,
    title,
    description,
  });

  // Cast the submitter's own vote via the same create-path castVote()
  // helper toggleVote() uses — not toggleVote() itself, since this
  // caller already knows for certain no vote exists yet (the request
  // was just created) and doesn't need toggleVote()'s
  // find-then-branch logic.
  await castVote(featureRequest._id, submittedBy);
  featureRequest.voteCount = 1;
  return featureRequest;
}

/**
 * castVote — the shared "add one vote" primitive. Idempotent under a
 * race via FeatureRequestVote's own (featureRequestId, userId) unique
 * index: a losing concurrent call hits E11000 and is treated as a
 * no-op, same idiom selfHealMissingReferralQualification() already uses
 * for its own unique-index race.
 *
 * Not exported — createFeatureRequest() and toggleVote() are the only
 * two callers, both in this file.
 */
async function castVote(featureRequestId, userId) {
  try {
    await FeatureRequestVote.create({ featureRequestId, userId });
  } catch (err) {
    if (err?.code === 11000) {
      return { created: false };
    }
    throw err;
  }

  await FeatureRequest.updateOne({ _id: featureRequestId }, { $inc: { voteCount: 1 } });
  return { created: true };
}

/**
 * toggleVote — the entire "vote / unvote" write path. A toggle, not a
 * one-way action: if the calling user has already voted, this removes
 * their vote; otherwise it casts one.
 *
 * Race-safety has two independently-necessary pieces, not one:
 *
 *   1. The vote row itself — findOneAndDelete() is a single atomic
 *      Mongo operation, so two concurrent "unvote" calls can't both
 *      believe they were the one that removed the row (only the winner
 *      gets a non-null result back; the loser gets null and does
 *      nothing further). On the "vote" side, castVote()'s unique-index
 *      E11000 handling closes the equivalent race for two concurrent
 *      "vote" calls.
 *   2. voteCount staying in sync — done in the same call as the vote
 *      row write, guarded (`voteCount: { $gt: 0 }` on the decrement) so
 *      it can never go negative even if this function is somehow
 *      called against a row whose counter has already drifted to 0.
 *
 * What this does NOT fully close: the same user double-clicking "vote"
 * and "unvote" fast enough to interleave (read-then-branch across the
 * two calls, not just within one). This is a vote toggle, not a
 * financial transaction — genuinely low-stakes if a double-click briefly
 * disagrees with itself — and the scoping doc's proposed
 * reconcileVoteCount() self-heal (a real countDocuments() against
 * FeatureRequestVote) is the cheap fix for that class of drift, same
 * "derived value can drift; detect and repair cheaply" posture
 * reconcileCreditsBalance() already established for Phase 4. Not built
 * in this batch — infrastructure-only, same as that function's own
 * first-ship state.
 *
 * @param {Object} params
 * @param {string|import("mongoose").Types.ObjectId} params.featureRequestId
 * @param {string|import("mongoose").Types.ObjectId} params.userId
 * @returns {Promise<{ voted: boolean }>} voted=true means the user now
 *   has a vote on this request; voted=false means they don't.
 */
export async function toggleVote({ featureRequestId, userId }) {
  const removed = await FeatureRequestVote.findOneAndDelete({ featureRequestId, userId });

  if (removed) {
    await FeatureRequest.updateOne(
      { _id: featureRequestId, voteCount: { $gt: 0 } },
      { $inc: { voteCount: -1 } }
    );
    return { voted: false };
  }

  await castVote(featureRequestId, userId);
  return { voted: true };
}

/**
 * editFeatureRequest — updates title/description, but only while the
 * request is still "open" AND only for its own submitter. Both
 * conditions are enforced atomically at the DB-query level (not "check
 * then act" in application code) — same idiom
 * services/rewardStore.js's cancelRedemption() already uses for its own
 * "can't cancel someone else's redemption even with a guessed valid
 * :id" guarantee, applied here to ownership + status instead of
 * ownership alone.
 *
 * Edit-while-open (locked once an admin moves it off "open") is a
 * judgment call flagged in the scoping doc, decided there rather than
 * left open — Contribution has no edit path at all, but a public
 * roadmap board more commonly allows a submitter to fix a typo or
 * clarify their own still-under-consideration idea.
 *
 * @param {Object} params
 * @param {string|import("mongoose").Types.ObjectId} params.featureRequestId
 * @param {string|import("mongoose").Types.ObjectId} params.requesterId
 * @param {string} [params.title]
 * @param {string} [params.description]
 * @returns {Promise<{ updated: boolean, reason?: string }>}
 */
export async function editFeatureRequest({ featureRequestId, requesterId, title, description }) {
  const set = {};
  if (title !== undefined) set.title = title;
  if (description !== undefined) set.description = description;

  if (Object.keys(set).length === 0) {
    return { updated: false, reason: "no_fields_provided" };
  }

  const result = await FeatureRequest.updateOne(
    { _id: featureRequestId, submittedBy: requesterId, status: "open" },
    { $set: set }
  );

  if (result.matchedCount === 0) {
    return { updated: false, reason: "not_found_not_owner_or_not_open" };
  }
  return { updated: true };
}

/**
 * withdrawFeatureRequest — the submitter pulls their own request while
 * it's still "open". Same atomic ownership+status guard as
 * editFeatureRequest() above. Never issues a reward (mirrors
 * rejectContribution()'s identical "no reward on this branch" posture).
 *
 * @param {Object} params
 * @param {string|import("mongoose").Types.ObjectId} params.featureRequestId
 * @param {string|import("mongoose").Types.ObjectId} params.requesterId
 * @returns {Promise<{ withdrawn: boolean, reason?: string }>}
 */
export async function withdrawFeatureRequest({ featureRequestId, requesterId }) {
  const result = await FeatureRequest.updateOne(
    { _id: featureRequestId, submittedBy: requesterId, status: "open" },
    { $set: { status: "withdrawn" } }
  );

  if (result.matchedCount === 0) {
    return { withdrawn: false, reason: "not_found_not_owner_or_not_open" };
  }
  return { withdrawn: true };
}

/**
 * updateFeatureRequestStatus — the admin-only status-transition entry
 * point. Guarded so a request already in a terminal status
 * (shipped/declined/withdrawn) can never be transitioned again — same
 * "no re-review path" posture Contribution.js's approve/reject already
 * takes, generalized from two terminal states to three.
 *
 * Reaching "shipped" triggers a reward-issuance attempt for the
 * submitter, same attemptRewardIssuance() shape
 * services/contribution.js's approveContribution() already uses.
 *
 * @param {Object} params
 * @param {string|import("mongoose").Types.ObjectId} params.featureRequestId
 * @param {string} params.status - one of ALL_STATUSES
 * @param {string|import("mongoose").Types.ObjectId} params.reviewerId
 * @returns {Promise<{ updated: boolean, reason?: string, rewardStatus?: string }>}
 */
export async function updateFeatureRequestStatus({ featureRequestId, status, reviewerId }) {
  if (!ALL_STATUSES.includes(status)) {
    throw new Error(`updateFeatureRequestStatus: unknown status "${status}".`);
  }

  const featureRequest = await FeatureRequest.findOneAndUpdate(
    { _id: featureRequestId, status: { $nin: TERMINAL_STATUSES } },
    { $set: { status, reviewedBy: reviewerId, reviewedAt: new Date() } },
    { new: true }
  );

  if (!featureRequest) {
    return { updated: false, reason: "not_found_or_already_terminal" };
  }

  if (status === "shipped") {
    const { rewardStatus } = await attemptRewardIssuance(featureRequest);
    return { updated: true, rewardStatus };
  }

  return { updated: true };
}

/**
 * attemptRewardIssuance — the ONLY place this file calls into the
 * Reward Policy layer. Shared by updateFeatureRequestStatus() (first
 * attempt, on reaching "shipped") and
 * retryPendingFeatureRequestRewards() (later re-attempts), mirroring
 * services/contribution.js's identically-named, identically-shaped
 * private helper exactly.
 */
async function attemptRewardIssuance(featureRequest) {
  let rewardStatus;
  try {
    const { issued } = await issueFeatureRequestShippedReward({
      submitterId: featureRequest.submittedBy,
      featureRequestId: featureRequest._id,
    });
    rewardStatus = issued ? "issued" : "skipped_unconfigured";
  } catch (err) {
    logger.error(
      { err, featureRequestId: String(featureRequest._id) },
      "[FeatureRequests] reward issuance failed"
    );
    rewardStatus = "failed";
  }

  await FeatureRequest.updateOne({ _id: featureRequest._id }, { $set: { rewardStatus } });
  return { rewardStatus };
}

/**
 * retryPendingFeatureRequestRewards — idempotent reconciliation pass.
 * Finds every shipped feature request whose reward hasn't successfully
 * issued yet and re-attempts issuance via the exact same
 * attemptRewardIssuance() path a fresh "shipped" transition uses. Safe
 * to call repeatedly, safe to run concurrently with live traffic —
 * identical reasoning to retryPendingContributionRewards():
 * RewardLedger's own idempotency (the sourceType+sourceId+userId+type
 * unique index) is what actually prevents a double reward, not
 * anything in this function.
 *
 * Not wired to any scheduler or route in this batch — infrastructure
 * only, same posture retryPendingContributionRewards() had at first
 * ship. A future admin endpoint can call this directly without any
 * further change here.
 *
 * @param {Object} [options]
 * @param {number} [options.limit=100]
 * @returns {Promise<{ attempted: number, issued: number, stillUnissued: number }>}
 */
export async function retryPendingFeatureRequestRewards({ limit = 100 } = {}) {
  const rows = await FeatureRequest.find({
    status: "shipped",
    rewardStatus: { $ne: "issued" },
  }).limit(limit);

  let issued = 0;
  for (const row of rows) {
    const { rewardStatus } = await attemptRewardIssuance(row);
    if (rewardStatus === "issued") issued += 1;
  }

  return { attempted: rows.length, issued, stillUnissued: rows.length - issued };
}

/**
 * listFeatureRequests — the public board query. Sorts by voteCount
 * (default) or recency; filters by status when given, returns every
 * non-withdrawn status otherwise (a withdrawn request is never shown on
 * the public board — its submitter pulled it — but IS still returned
 * by getMyFeatureRequests() below, since a submitter should still see
 * their own withdrawal in their own history).
 *
 * @param {Object} [params]
 * @param {string} [params.status]
 * @param {"votes"|"recent"} [params.sort="votes"]
 * @param {number} [params.page=1]
 * @param {number} [params.limit=20]
 */
export async function listFeatureRequests({ status, sort = "votes", page = 1, limit = 20 } = {}) {
  const filter = status ? { status } : { status: { $ne: "withdrawn" } };
  const sortSpec = sort === "recent" ? { createdAt: -1 } : { voteCount: -1, createdAt: -1 };
  const skip = (page - 1) * limit;

  const [entries, total] = await Promise.all([
    FeatureRequest.find(filter).sort(sortSpec).skip(skip).limit(limit),
    FeatureRequest.countDocuments(filter),
  ]);

  return { entries, total, page, limit };
}

/**
 * getMyFeatureRequests — a submitter's own history, every status
 * included (unlike listFeatureRequests(), which hides "withdrawn" from
 * the public board).
 */
export async function getMyFeatureRequests({ submittedBy, page = 1, limit = 20 }) {
  const filter = { submittedBy };
  const skip = (page - 1) * limit;

  const [entries, total] = await Promise.all([
    FeatureRequest.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    FeatureRequest.countDocuments(filter),
  ]);

  return { entries, total, page, limit };
}

/**
 * getVotedRequestIds — for hydrating "did I vote on this" state across a
 * list-page's worth of requests in one query, rather than N.
 *
 * @param {string|import("mongoose").Types.ObjectId} userId
 * @param {Array<string|import("mongoose").Types.ObjectId>} featureRequestIds
 * @returns {Promise<Set<string>>}
 */
export async function getVotedRequestIds(userId, featureRequestIds) {
  if (!featureRequestIds?.length) return new Set();
  const votes = await FeatureRequestVote.find({
    userId,
    featureRequestId: { $in: featureRequestIds },
  }).select("featureRequestId");
  return new Set(votes.map((v) => String(v.featureRequestId)));
}