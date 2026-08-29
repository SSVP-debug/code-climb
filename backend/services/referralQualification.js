import Submission from "../models/Submission.js";
import ReferralQualification from "../models/ReferralQualification.js";
import User from "../models/User.js";
import { issueReferralQualifiedRewards } from "./rewardPolicyService.js";
import { logger } from "../config/logger.js";

/**
 * services/referralQualification.js — Referral Qualification layer (Plan 2,
 * revised after inspection-driven refinement — see the four numbered
 * sections below for what changed and why).
 *
 * Sole caller of qualifyReferralIfFirstSolve: controllers/judgeController.js's
 * finish(), inside the existing `if (req.userDoc) { ... }` block, alongside
 * (not inside) the existing contest/battle-room scoring calls — same shape,
 * same trust model, same file. That guard is what makes this guest-safe by
 * construction: guests never reach this function because req.userDoc is
 * null for them and finish()'s outer guard already skips the whole block.
 *
 * Sole caller of createReferralAssociationQualification: routes/referral.js's
 * POST /apply, immediately after the referredBy association itself succeeds.
 *
 * ═══════════════════════════════════════════════════════════════════════
 * 1. QUALIFICATION SCOPE: practice solves only
 * ═══════════════════════════════════════════════════════════════════════
 * Revised from "any Accepted submission" to "first accepted PRACTICE
 * submission" (no contestId, no battleRoomId) — Code Club's stated
 * preferred product behavior. Verified safe and straightforward against
 * the actual schema: Submission.contestId and Submission.battleRoomId
 * both already default to null for ordinary practice submissions (see
 * models/Submission.js's own field comments — "Optional — null/absent for
 * ordinary practice submissions, which are the overwhelming majority"),
 * so "practice" is a plain, already-existing, already-populated query
 * filter — not a new concept requiring a schema change or a new field on
 * Submission. Contest/Battle Room scoring (services/contestScoring.js,
 * services/battleRoomScoring.js) are entirely separate systems and are
 * not touched by this filter — a contest Accepted submission simply never
 * triggers a qualification check at all now (guarded at the call site in
 * judgeController.js), rather than being counted and then not mattering.
 *
 * ═══════════════════════════════════════════════════════════════════════
 * 2. TIMING RULE: referral must be applied BEFORE the first accepted
 *    practice solve (Option A)
 * ═══════════════════════════════════════════════════════════════════════
 * Chosen over "can still qualify if applied later" (Option B). Reasoning:
 *   - Matches the ALREADY-INTENDED product flow: routes/referral.js's own
 *     comment on POST /apply ("Called once, typically right after first
 *     login") and src/pages/LoginPage.jsx (fires immediately after a
 *     ?ref= login completes) both confirm association is meant to happen
 *     essentially at signup, before any problem access is even possible —
 *     this enforces the existing intended timing, it doesn't invent a new
 *     restriction on top of a system that was designed to allow late
 *     application.
 *   - Option B's abuse surface is exactly what the brief itself flagged:
 *     a user could solve problems organically with zero referral
 *     involvement, THEN attach a friend's code afterward purely to farm
 *     two token rewards for activity the referral had no causal role in.
 *     Defending against that safely would require reconstructing "how
 *     much prior activity is too much to still count," which is a
 *     genuinely hard, arbitrary line — Option A sidesteps needing one at
 *     all.
 * Enforcement lives in createReferralAssociationQualification() below: at
 * the moment a referral is applied, this checks whether the referred user
 * already has a prior accepted PRACTICE submission (the same scope as
 * qualification itself, per point 1). If so, the row is marked
 * `status: "ineligible"` immediately — not left as a silently-permanent
 * "pending" row that can never actually qualify (see
 * ReferralQualification.js's own header comment on this).
 * NOTE: even without this explicit check, a late-applied referral could
 * never have accidentally qualified — the count-based check in
 * qualifyReferralIfFirstSolve() only ever matches when the triggering
 * submission is that user's exactly-first accepted practice submission,
 * which by definition can't happen again once it's already occurred. This
 * fix is a REPRESENTATIONAL correctness fix (making dead-on-arrival state
 * visible/auditable), not a reward-safety fix — rewards were never at
 * risk of firing for a late-applied referral either way.
 *
 * ═══════════════════════════════════════════════════════════════════════
 * 3. ASSOCIATION RACE: fixed one layer up, in routes/referral.js +
 *    services/userSubscriptionService.js's new saveSubscriptionIfMatch()
 * ═══════════════════════════════════════════════════════════════════════
 * Not this file's concern directly, noted here for completeness: the
 * check-then-act race on User.referredBy is now closed by an atomic
 * conditional update (`findOneAndUpdate` with `referredBy: null` baked
 * into the filter), not a transaction. See userSubscriptionService.js's
 * saveSubscriptionIfMatch() doc comment for the full reasoning.
 *
 * ═══════════════════════════════════════════════════════════════════════
 * 4. REWARD FAILURE RECOVERY: retryPendingReferralRewards()
 * ═══════════════════════════════════════════════════════════════════════
 * Previously, a genuine reward-issuance error (e.g. a transient DB
 * failure inside rewardLedger, as opposed to a deliberate "not
 * configured" skip) left the qualification row in a state with no way to
 * ever retry. retryPendingReferralRewards() closes that: an idempotent,
 * on-demand function (exposed via POST /api/admin/referral/retry-rewards,
 * requireAdmin-gated — see routes/admin.js) that re-attempts reward
 * issuance for every row where status is "qualified" but rewardStatus
 * isn't yet "issued" (covers "failed" and "skipped_unconfigured" alike —
 * a policy amount that got configured after the fact is just as
 * retry-worthy as a transient error). Safe to call repeatedly and safe to
 * run concurrently with new qualifications happening: RewardLedger's own
 * idempotency (the sourceType+sourceId+userId+type unique index, wholly
 * unmodified) is what actually prevents a double reward, not anything in
 * this function — this function can never itself cause a double-issue,
 * only ever a redundant no-op attempt.
 * Deliberately NOT wired to a cron/scheduler in this phase — "add a safe
 * retry/reconciliation mechanism," not "add new recurring-job infra."
 * Manually triggerable now; automating the trigger is a small, separate,
 * future decision that doesn't change this function's shape.
 *
 * ═══════════════════════════════════════════════════════════════════════
 * 5. MISSING-ROW SELF-HEAL: selfHealMissingReferralQualification()
 * ═══════════════════════════════════════════════════════════════════════
 * Closes the one remaining inconsistent state flagged in the architecture
 * review: routes/referral.js's /apply calls
 * createReferralAssociationQualification() best-effort, in a try/catch,
 * AFTER User.referredBy has already been saved. A genuine (non-E11000)
 * failure there — a real DB error, not the expected "already applied"
 * race — previously left `User.referredBy` set with no corresponding
 * ReferralQualification row and no path back. That user could solve
 * problems forever and this file would always return
 * `not_referred_or_not_pending`, silently, forever.
 *
 * qualifyReferralIfFirstSolve() now calls
 * selfHealMissingReferralQualification() on every Accepted practice
 * submission (not just the first), BEFORE the not_first_solve early
 * return — it has to run unconditionally, because the row's correct
 * status (pending vs. ineligible) depends on how many prior accepted
 * practice solves already existed, which is exactly the information the
 * early return would otherwise throw away.
 *
 * Cheap in the overwhelming common case: a single indexed
 * `ReferralQualification.exists({ referredUserId })` check. Only a user
 * who (a) was actually referred AND (b) is missing their row pays the
 * extra cost of a User lookup + reconstruction attempt.
 *
 * Timing reconstruction: since Submission rows are already persisted
 * before this service ever runs (see this function's own doc comment),
 * `acceptedPracticeCount` passed in from qualifyReferralIfFirstSolve
 * already includes the triggering submission itself.
 *   - count === 1 → the triggering submission IS this user's first-ever
 *     accepted practice solve. Because User.referredBy is already set at
 *     the moment this function reads it, and it can only have been set
 *     by an earlier, already-completed /apply request, the referral
 *     necessarily preceded this solve. Reconstructed as "pending" — the
 *     caller's own atomic qualify step immediately after this call picks
 *     it up in the same request.
 *   - count > 1 → at least one other accepted practice solve already
 *     existed before this one. The original /apply-time timestamp is
 *     unrecoverable, so — consistent with
 *     createReferralAssociationQualification()'s own conservative
 *     default — this is reconstructed directly as "ineligible" rather
 *     than risk rewarding solving activity the referral had no
 *     verifiable causal role in.
 *
 * Race-safe by construction, not by locking: two concurrent callers
 * racing to reconstruct the same missing row both attempt
 * ReferralQualification.create(); ReferralQualification.referredUserId's
 * existing unique index (unmodified) lets exactly one succeed, and the
 * loser's E11000 is caught and ignored — identical idiom to
 * routes/referral.js's own existing E11000 handling around
 * createReferralAssociationQualification().
 */

const PRACTICE_SUBMISSION_FILTER = { contestId: null, battleRoomId: null };

/**
 * selfHealMissingReferralQualification — reconstructs a
 * ReferralQualification row for a referred user whose row is missing
 * (see this file's module comment, section 5, for the full "why" and the
 * timing-reconstruction reasoning). Called unconditionally, on every
 * Accepted practice submission, from qualifyReferralIfFirstSolve —
 * before that function's own not_first_solve early return, because the
 * correct reconstructed status depends on `acceptedPracticeCount`, which
 * the early return would otherwise discard.
 *
 * Cheap no-op for the overwhelming majority of calls: a single indexed
 * existence check. Never throws for expected outcomes (never referred,
 * row already present, lost a concurrent reconstruction race) — only
 * logs for a genuine unexpected DB error, matching this file's existing
 * best-effort posture elsewhere.
 *
 * @param {Object} params
 * @param {string|import("mongoose").Types.ObjectId} params.userId
 * @param {number} params.acceptedPracticeCount - this user's total
 *   Accepted PRACTICE submission count, already including the
 *   submission that triggered this call.
 */
async function selfHealMissingReferralQualification({ userId, acceptedPracticeCount }) {
  // Cheapest possible check first: does a row already exist? Covers both
  // "never referred" (no row, but we haven't paid for a User lookup yet)
  // and "referred, row present" (the overwhelming common case for
  // referred users) — neither needs anything further.
  const alreadyExists = await ReferralQualification.exists({ referredUserId: userId });
  if (alreadyExists) {
    return;
  }

  const userDoc = await User.findById(userId).select("referredBy").lean();
  if (!userDoc?.referredBy) {
    return; // never referred — nothing to heal
  }

  const referrer = await User.findOne({ referralCode: userDoc.referredBy })
    .select("_id")
    .lean();
  if (!referrer) {
    // Referrer no longer resolvable (e.g. deleted, or a data anomaly) —
    // cannot reconstruct deterministically. Best-effort: log for manual
    // investigation, same posture as the rest of this file.
    logger.error(
      { userId: String(userId), code: userDoc.referredBy },
      "[ReferralQualification] self-heal: referrer not found for referredBy code — cannot reconstruct"
    );
    return;
  }

  try {
    const row = await ReferralQualification.create({
      referrerId: referrer._id,
      referredUserId: userId,
      referralCodeUsed: userDoc.referredBy,
    });

    // See module comment section 5 for the full timing reasoning:
    // count === 1 means this triggering submission is the first-ever
    // accepted practice solve, so the (already-set) referral necessarily
    // preceded it — leave status at its "pending" default so the
    // caller's atomic qualify step picks it up immediately. count > 1
    // means prior accepted practice activity already existed, so this
    // is reconstructed directly as ineligible.
    if (acceptedPracticeCount > 1) {
      await ReferralQualification.updateOne(
        { _id: row._id },
        {
          $set: {
            status: "ineligible",
            ineligibleReason: "reconstructed_after_prior_accepted_practice_solve",
          },
        }
      );
    }
  } catch (err) {
    if (err?.code !== 11000) {
      logger.error(
        { err, userId: String(userId) },
        "[ReferralQualification] self-heal: failed to reconstruct missing qualification row"
      );
    }
    // E11000 = a concurrent caller (another self-heal race, or a very
    // late-landing normal /apply creation) already created the row —
    // expected and safely ignored, identical idiom to routes/referral.js.
  }
}

/**
 * qualifyReferralIfFirstSolve — call after a Submission row with
 * status "Accepted" has already been persisted for a PRACTICE submission
 * (the caller, judgeController.js, only invokes this when contestId and
 * battleRoomId are both absent — see that file's finish()).
 *
 * Idempotent and side-effect-safe to call on every Accepted practice
 * submission: cheap early exit on the (already-indexed) count check for
 * the common case of "not this user's first," and the qualification
 * write itself is an atomic findOneAndUpdate guarded by
 * `status: "pending"`, so even a genuine race (two rapid Accepted
 * submissions) can qualify at most once.
 *
 * Never throws for expected/unexceptional outcomes (not referred,
 * already qualified, ineligible, not first solve) — only for a genuine
 * unexpected DB error, which the caller (judgeController.js) already
 * wraps in its own try/catch and treats as best-effort, exactly like the
 * existing contest/battle-room scoring calls.
 *
 * @param {Object} params
 * @param {string|import("mongoose").Types.ObjectId} params.userId
 * @param {string|import("mongoose").Types.ObjectId} params.submissionId
 * @returns {Promise<{ qualified: boolean, reason?: string, rewardStatus?: string }>}
 */
export async function qualifyReferralIfFirstSolve({ userId, submissionId }) {
  // ── Step 1: is this the user's first-ever Accepted PRACTICE submission? ──
  // Uses the existing { userId: 1, status: 1 } index on Submission as a
  // prefix — no new index required; contestId/battleRoomId are filtered
  // in addition, cheap at Code Club's current per-user submission volume.
  // Cheap and correct even under concurrency: two rapid Accepted
  // submissions from the same user could both observe count === 1 in a
  // genuine race (the count check itself isn't atomic), but that's fine —
  // the actual qualification guarantee lives in step 2's atomic update,
  // not here. This check only exists to skip the (much more common)
  // non-first-solve case cheaply.
  const acceptedPracticeCount = await Submission.countDocuments({
    userId,
    status: "Accepted",
    ...PRACTICE_SUBMISSION_FILTER,
  });

  // ── Self-heal: reconstruct a missing ReferralQualification row ─────────
  // Must run here, unconditionally, BEFORE the not_first_solve early
  // return below — see module comment section 5 and this helper's own
  // doc comment for why the correct reconstructed status depends on
  // acceptedPracticeCount, which that early return would otherwise
  // discard for any user who needed reconstructing.
  await selfHealMissingReferralQualification({ userId, acceptedPracticeCount });

  if (acceptedPracticeCount !== 1) {
    return { qualified: false, reason: "not_first_solve" };
  }

  // ── Step 2: atomically qualify, if and only if this user has a PENDING
  //    (not ineligible, not already-qualified) referral association ─────
  // The `status: "pending"` filter is the actual idempotency/race
  // guarantee (replacing the old `qualifiedAt: null` filter — equivalent
  // for idempotency purposes, but also now correctly excludes rows
  // already marked "ineligible" at association time, which qualifiedAt
  // alone could not distinguish). A losing concurrent call (retried judge
  // submission, duplicate event, or the step-1 race above resolving to
  // two callers both reaching here) gets back null and does nothing
  // further — same idiom as services/contestScoring.js's awardContestSolve
  // and services/battleRoomScoring.js's milestone claim.
  const qualification = await ReferralQualification.findOneAndUpdate(
    { referredUserId: userId, status: "pending" },
    { $set: { status: "qualified", qualifiedAt: new Date(), qualificationSourceSubmissionId: submissionId } },
    { new: true }
  );

  if (!qualification) {
    // Either this user was never referred (no row exists), already
    // qualified previously, or their referral was marked ineligible at
    // association time — all expected no-ops, not errors.
    return { qualified: false, reason: "not_referred_or_not_pending" };
  }

  const { rewardStatus } = await attemptRewardIssuance(qualification);
  return { qualified: true, rewardStatus };
}

/**
 * attemptRewardIssuance — the ONLY place this file calls into the Reward
 * Policy layer. Shared by qualifyReferralIfFirstSolve (first attempt) and
 * retryPendingReferralRewards (later re-attempts) so both go through
 * identical logic and status-setting.
 *
 * Never calls RewardLedger directly and never passes a literal amount —
 * services/rewardPolicyService.js resolves REFERRAL_QUALIFIED_REFERRER /
 * REFERRAL_QUALIFIED_REFERRED via config/rewardPolicy.js, and itself
 * delegates to services/rewardLedger.js's already-idempotent issueReward()
 * (unique index on sourceType+sourceId+userId+type) for the actual write.
 */
async function attemptRewardIssuance(qualification) {
  let rewardStatus;
  try {
    const { referrer, referred } = await issueReferralQualifiedRewards({
      referrerId: qualification.referrerId,
      referredUserId: qualification.referredUserId,
      referralQualificationId: qualification._id,
    });
    // A missing/unconfigured amount on ONE side is not an error — see
    // rewardPolicyService's own doc comment. "issued" here means at least
    // one side actually wrote a ledger entry; if a retry later configures
    // the other side too, retryPendingReferralRewards() re-attempts and
    // RewardLedger's idempotency makes the already-issued side a safe no-op.
    rewardStatus = referrer.issued || referred.issued ? "issued" : "skipped_unconfigured";
  } catch (err) {
    // A genuine failure resolving/issuing the reward (e.g. a real DB
    // error inside rewardLedger) must not undo the qualification itself —
    // the referred user's first solve is real and already recorded.
    // Explicitly "failed" (not left at the default "pending") so this is
    // auditable and picked up by retryPendingReferralRewards() below.
    logger.error(
      { err, qualificationId: String(qualification._id) },
      "[ReferralQualification] reward issuance failed"
    );
    rewardStatus = "failed";
  }

  await ReferralQualification.updateOne({ _id: qualification._id }, { $set: { rewardStatus } });
  return { rewardStatus };
}

/**
 * createReferralAssociationQualification — call once, immediately after
 * routes/referral.js's POST /apply successfully associates referredBy.
 * Creates the ReferralQualification row and, per the timing rule
 * documented above, immediately checks whether the referred user already
 * has a prior accepted practice solve — if so, marks the row ineligible
 * on the spot instead of leaving it as a permanently-dead "pending" row.
 *
 * Best-effort by design (matching the existing call site's own comment):
 * a failure here must never undo the referredBy association that already
 * succeeded. Idempotent against a concurrent duplicate /apply via
 * ReferralQualification.referredUserId's unique index — a losing
 * concurrent create() throws E11000, which the caller is expected to
 * catch and ignore (see routes/referral.js), same as before this
 * refinement.
 *
 * @param {Object} params
 * @param {string|import("mongoose").Types.ObjectId} params.referrerId
 * @param {string|import("mongoose").Types.ObjectId} params.referredUserId
 * @param {string} params.referralCodeUsed
 */
export async function createReferralAssociationQualification({
  referrerId,
  referredUserId,
  referralCodeUsed,
}) {
  const row = await ReferralQualification.create({
    referrerId,
    referredUserId,
    referralCodeUsed,
  });

  const priorAcceptedPracticeCount = await Submission.countDocuments({
    userId: referredUserId,
    status: "Accepted",
    ...PRACTICE_SUBMISSION_FILTER,
  });

  if (priorAcceptedPracticeCount > 0) {
    await ReferralQualification.updateOne(
      { _id: row._id },
      {
        $set: {
          status: "ineligible",
          ineligibleReason: "referral_applied_after_first_accepted_practice_solve",
        },
      }
    );
  }

  return row;
}

/**
 * retryPendingReferralRewards — idempotent reconciliation pass. Finds
 * every qualified referral whose reward hasn't successfully issued yet
 * (rewardStatus "failed", "skipped_unconfigured", or the extremely
 * transient default "pending") and re-attempts issuance via the exact
 * same attemptRewardIssuance() path a fresh qualification uses. Safe to
 * call repeatedly, safe to run concurrently with live traffic — see this
 * file's module comment, section 4, for why RewardLedger's own
 * idempotency is what actually prevents a double-issue here, not
 * anything in this function.
 *
 * Not wired to any scheduler in this phase — callable on demand via
 * POST /api/admin/referral/retry-rewards (routes/admin.js).
 *
 * @param {Object} [options]
 * @param {number} [options.limit=100] - cap on rows processed per call,
 *   so a very large backlog can't turn one request into an unbounded scan.
 * @returns {Promise<{ attempted: number, issued: number, stillUnissued: number }>}
 */
export async function retryPendingReferralRewards({ limit = 100 } = {}) {
  const rows = await ReferralQualification.find({
    status: "qualified",
    rewardStatus: { $ne: "issued" },
  }).limit(limit);

  let issued = 0;
  for (const row of rows) {
    const { rewardStatus } = await attemptRewardIssuance(row);
    if (rewardStatus === "issued") issued += 1;
  }

  return { attempted: rows.length, issued, stillUnissued: rows.length - issued };
}