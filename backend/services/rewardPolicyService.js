import { issueReward } from "./rewardLedger.js";
import { resolveRewardAmount, RewardPolicyNotConfiguredError, REWARD_POLICY_KEYS } from "../config/rewardPolicy.js";
import { logger } from "../config/logger.js";

/**
 * services/rewardPolicyService.js — the boundary between "something
 * reward-worthy happened" and the Reward Ledger.
 *
 * This does NOT replace or modify services/rewardLedger.js — issueReward(),
 * getBalance(), getLedger(), and the idempotency index all stay exactly
 * as approved. This module sits in FRONT of issueReward() so that future
 * callers (Plan 2's referral qualification hook, and later the
 * contribution-approval controller) never write a literal amount
 * themselves — they describe the event, this module resolves the amount
 * via config/rewardPolicy.js, and then delegates to issueReward() for
 * the actual (already-idempotent) write.
 *
 *   BAD  (what this exists to prevent):
 *     issueReward({ amount: 100, type: "REFERRAL_QUALIFIED", ... })
 *
 *   GOOD (what Plan 2+ should call instead):
 *     issueReferralQualifiedRewards({ referrerId, referredUserId, sourceId })
 *
 * ── Not-yet-configured amounts are non-fatal to the caller ───────────────
 * Every function here catches RewardPolicyNotConfiguredError, logs it,
 * and returns a { issued: false, reason: "not_configured" } result
 * instead of throwing. Rationale: the event that triggered the call
 * (a contribution being approved, a referral qualifying) is real and
 * already happened / was already persisted by the caller — a missing
 * token amount shouldn't be able to fail that transition or leave it in
 * an inconsistent state. It just means no reward is issued *yet*. Once
 * the relevant env var is configured, the same idempotent call can be
 * safely retried (e.g. via an admin "reprocess pending rewards" action
 * in a later phase) and will issue correctly then — nothing about this
 * design requires that retry path to exist on day one, it just doesn't
 * foreclose it.
 */

async function tryIssue({ recipientId, policyKey, ledgerType, sourceType, sourceId, metadata }) {
  let amount;
  try {
    amount = resolveRewardAmount(policyKey);
  } catch (err) {
    if (err instanceof RewardPolicyNotConfiguredError) {
      logger.warn(
        { policyKey, recipientId: String(recipientId), sourceType, sourceId: String(sourceId) },
        "[RewardPolicy] reward not issued — policy not yet configured"
      );
      return { issued: false, reason: "not_configured" };
    }
    throw err;
  }

  const { entry, created } = await issueReward({
    recipientId,
    type: ledgerType,
    amount,
    sourceType,
    sourceId,
    metadata,
  });
  return { issued: true, created, entry };
}

/**
 * issueContributionApprovedReward — called by the (future, Plan 3)
 * contribution-approval controller once a Contribution transitions to
 * "approved". Not implemented/wired yet — this is the entry point that
 * will be called then.
 */
export async function issueContributionApprovedReward({ contributorId, contributionId, metadata = {} }) {
  return tryIssue({
    recipientId: contributorId,
    policyKey: REWARD_POLICY_KEYS.CONTRIBUTION_APPROVED,
    ledgerType: "CONTRIBUTION_APPROVED",
    sourceType: "CONTRIBUTION",
    sourceId: contributionId,
    metadata,
  });
}

/**
 * issueReferralQualifiedRewards — called by the (Plan 2) referral
 * qualification hook once a ReferralQualification's qualifiedAt is set.
 * Issues up to two independent ledger entries (referrer + referred),
 * each resolved and gated by its own policy key — a missing/unset
 * amount for one side does not block the other.
 *
 * sourceId should be the ReferralQualification document's _id (shared
 * by both entries; disambiguated by userId + type per the ledger's
 * unique index, so this is safe).
 */
export async function issueReferralQualifiedRewards({
  referrerId,
  referredUserId,
  referralQualificationId,
  metadata = {},
}) {
  const [referrerResult, referredResult] = await Promise.all([
    tryIssue({
      recipientId: referrerId,
      policyKey: REWARD_POLICY_KEYS.REFERRAL_QUALIFIED_REFERRER,
      ledgerType: "REFERRAL_QUALIFIED_REFERRER",
      sourceType: "REFERRAL",
      sourceId: referralQualificationId,
      metadata: { ...metadata, role: "referrer" },
    }),
    tryIssue({
      recipientId: referredUserId,
      policyKey: REWARD_POLICY_KEYS.REFERRAL_QUALIFIED_REFERRED,
      ledgerType: "REFERRAL_QUALIFIED_REFERRED",
      sourceType: "REFERRAL",
      sourceId: referralQualificationId,
      metadata: { ...metadata, role: "referred" },
    }),
  ]);

  return { referrer: referrerResult, referred: referredResult };
}
