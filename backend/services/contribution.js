import Contribution from "../models/Contribution.js";
import { issueContributionApprovedReward } from "./rewardPolicyService.js";
import { logger } from "../config/logger.js";

/**
 * services/contribution.js — Contribution Infrastructure (Phase 2F).
 *
 * See models/Contribution.js's header for the full scoping note on what
 * a Contribution generically is (and deliberately isn't yet decided to
 * be) on this platform. This file is the service layer over that model:
 * creation, admin approve/reject, and the reward-retry reconciliation
 * pass — same three-part shape services/referralQualification.js already
 * uses for its own "user action -> admin/system decision -> RewardLedger"
 * flow, since there's no reason for a second, different shape here.
 *
 * Sole intended callers (Plan/batch 2, not yet built — routes/controllers
 * are explicitly out of scope for this pass, see PROGRESS.md): a
 * student-facing submission endpoint calls createContribution(); an
 * admin-only review endpoint calls approveContribution() or
 * rejectContribution(); an admin-only retry endpoint (mirroring
 * POST /api/admin/referral/retry-rewards) calls
 * retryPendingContributionRewards().
 */

/**
 * createContribution — records a new pending Contribution. No approval
 * logic, no reward logic — this only persists the submission itself.
 *
 * Deliberately does not validate `payload`'s shape against `kind` — see
 * models/Contribution.js's scoping note for why that's this function's
 * (future, kind-specific) caller's responsibility, not this model/service
 * layer's.
 *
 * @param {Object} params
 * @param {string|import("mongoose").Types.ObjectId} params.contributorId
 * @param {string} params.kind
 * @param {Object} [params.payload]
 * @returns {Promise<import("mongoose").Document>}
 */
export async function createContribution({ contributorId, kind, payload = {} }) {
  return Contribution.create({ contributorId, kind, payload });
}

/**
 * approveContribution — atomically transitions a pending Contribution to
 * "approved", then attempts reward issuance for the contributor.
 *
 * The status transition uses the same `findOneAndUpdate` guarded by
 * `status: "pending"` idiom services/referralQualification.js's
 * qualifyReferralIfFirstSolve() and services/contestScoring.js /
 * services/battleRoomScoring.js all already use for their own
 * exactly-once transitions — a double admin click, a retried request, or
 * two concurrent review actions on the same row all resolve to "exactly
 * one winner," with every loser getting back null and doing nothing
 * further, rather than a check-then-act race.
 *
 * @param {Object} params
 * @param {string|import("mongoose").Types.ObjectId} params.contributionId
 * @param {string|import("mongoose").Types.ObjectId} params.reviewerId - the reviewing admin's userId
 * @returns {Promise<{ approved: boolean, reason?: string, rewardStatus?: string }>}
 */
export async function approveContribution({ contributionId, reviewerId }) {
  const contribution = await Contribution.findOneAndUpdate(
    { _id: contributionId, status: "pending" },
    { $set: { status: "approved", reviewedBy: reviewerId, reviewedAt: new Date() } },
    { new: true }
  );

  if (!contribution) {
    // Either it doesn't exist, or it's already approved/rejected — both
    // expected no-ops, not errors, same posture as
    // qualifyReferralIfFirstSolve()'s "not_referred_or_not_pending".
    return { approved: false, reason: "not_found_or_not_pending" };
  }

  const { rewardStatus } = await attemptRewardIssuance(contribution);
  return { approved: true, rewardStatus };
}

/**
 * rejectContribution — atomically transitions a pending Contribution to
 * "rejected". Never issues a reward. Same atomic-transition idiom as
 * approveContribution() above, so an admin can't accidentally both
 * approve and reject the same row via a race.
 *
 * @param {Object} params
 * @param {string|import("mongoose").Types.ObjectId} params.contributionId
 * @param {string|import("mongoose").Types.ObjectId} params.reviewerId
 * @param {string} [params.reason]
 * @returns {Promise<{ rejected: boolean, reason?: string }>}
 */
export async function rejectContribution({ contributionId, reviewerId, reason = null }) {
  const contribution = await Contribution.findOneAndUpdate(
    { _id: contributionId, status: "pending" },
    {
      $set: {
        status: "rejected",
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
        rejectionReason: reason,
      },
    },
    { new: true }
  );

  if (!contribution) {
    return { rejected: false, reason: "not_found_or_not_pending" };
  }

  return { rejected: true };
}

/**
 * attemptRewardIssuance — the ONLY place this file calls into the Reward
 * Policy layer. Shared by approveContribution() (first attempt) and
 * retryPendingContributionRewards() (later re-attempts) so both go
 * through identical logic and status-setting — mirrors
 * services/referralQualification.js's identically-named, identically-shaped
 * private helper exactly.
 */
async function attemptRewardIssuance(contribution) {
  let rewardStatus;
  try {
    const { issued } = await issueContributionApprovedReward({
      contributorId: contribution.contributorId,
      contributionId: contribution._id,
    });
    rewardStatus = issued ? "issued" : "skipped_unconfigured";
  } catch (err) {
    // A genuine failure resolving/issuing the reward (e.g. a real DB
    // error inside rewardLedger) must not undo the approval itself — the
    // contribution being approved is real and already recorded.
    // Explicitly "failed" (not left at the default "pending") so this is
    // auditable and picked up by retryPendingContributionRewards() below.
    logger.error(
      { err, contributionId: String(contribution._id) },
      "[Contribution] reward issuance failed"
    );
    rewardStatus = "failed";
  }

  await Contribution.updateOne({ _id: contribution._id }, { $set: { rewardStatus } });
  return { rewardStatus };
}

/**
 * retryPendingContributionRewards — idempotent reconciliation pass.
 * Finds every approved contribution whose reward hasn't successfully
 * issued yet (rewardStatus "failed", "skipped_unconfigured", or the
 * extremely transient default "pending") and re-attempts issuance via
 * the exact same attemptRewardIssuance() path a fresh approval uses.
 * Safe to call repeatedly, safe to run concurrently with live traffic —
 * identical reasoning to services/referralQualification.js's
 * retryPendingReferralRewards(): RewardLedger's own idempotency (the
 * sourceType+sourceId+userId+type unique index) is what actually
 * prevents a double reward, not anything in this function.
 *
 * Not wired to any scheduler or route in this phase — infrastructure
 * only, same "batch 1" scope as the rest of this file. A future admin
 * endpoint (mirroring POST /api/admin/referral/retry-rewards) can call
 * this directly without any further change here.
 *
 * @param {Object} [options]
 * @param {number} [options.limit=100] - cap on rows processed per call,
 *   so a very large backlog can't turn one request into an unbounded scan.
 * @returns {Promise<{ attempted: number, issued: number, stillUnissued: number }>}
 */
export async function retryPendingContributionRewards({ limit = 100 } = {}) {
  const rows = await Contribution.find({
    status: "approved",
    rewardStatus: { $ne: "issued" },
  }).limit(limit);

  let issued = 0;
  for (const row of rows) {
    const { rewardStatus } = await attemptRewardIssuance(row);
    if (rewardStatus === "issued") issued += 1;
  }

  return { attempted: rows.length, issued, stillUnissued: rows.length - issued };
}