/**
 * config/rewardPolicy.js — Code Club's reward-amount policy boundary.
 *
 * Phase 2 architecture refinement (post Reward Ledger core approval).
 * This file exists so that NOTHING outside of it ever writes a literal
 * token amount into a reward-granting call. Compare:
 *
 *   issueReward({ amount: 100, ... })          ← what this is meant to prevent
 *   issueReward({ amount: resolveRewardAmount("REFERRAL_QUALIFIED_REFERRER"), ... })
 *
 * The second form is what services/rewardPolicyService.js does — this
 * file is the ONLY place a "REFERRAL_QUALIFIED_REFERRER" policy key
 * maps to an actual number, and that number lives in an env var, not in
 * code. This mirrors the existing MONETIZATION_ENABLED / PRICING
 * convention in this same file's directory (config/featureFlags.js):
 * "the team ships the code now, and turns it on/tunes it later with zero
 * additional deploys — just an env var change."
 *
 * ── Why amounts are NOT defaulted to a placeholder number ────────────────
 * Code Club's token economy has not been finalized (token name, symbol,
 * contribution/referral values — see Phase 2 architecture report §24).
 * A tempting shortcut would be `Number(process.env.X) || 100` — but a
 * silent fallback to an arbitrary number is exactly the kind of
 * un-auditable, accidentally-real "placeholder that ships to production"
 * this layer exists to prevent. Instead, resolveRewardAmount() THROWS
 * when a policy key's env var isn't set. This means: until someone
 * deliberately configures a real amount, any code path that reaches a
 * reward-issuing policy call fails loudly (and is caught + logged by the
 * caller — see services/rewardPolicyService.js), never silently issues a
 * wrong or made-up amount. The qualification/approval EVENT can still be
 * recorded even when this throws (see Plan 2's architecture report on
 * qualification timing) — only the reward issuance itself is gated.
 *
 * ── Policy keys are deliberately more granular than reward "type" ────────
 * A referral qualification produces TWO reward events (referrer +
 * referred user), which may reasonably be different amounts. Rather than
 * one "REFERRAL_QUALIFIED" amount applied to both, each side gets its
 * own policy key. Same reasoning extends cleanly to future contribution
 * sub-types (e.g. a different amount for "new_problem" vs
 * "testcase_improvement") without changing this file's shape — just
 * add another key/env-var pair.
 */

const POLICY_ENV_KEYS = Object.freeze({
  CONTRIBUTION_APPROVED: "REWARD_AMOUNT_CONTRIBUTION_APPROVED",
  REFERRAL_QUALIFIED_REFERRER: "REWARD_AMOUNT_REFERRAL_QUALIFIED_REFERRER",
  REFERRAL_QUALIFIED_REFERRED: "REWARD_AMOUNT_REFERRAL_QUALIFIED_REFERRED",
});

export const REWARD_POLICY_KEYS = Object.freeze(
  Object.fromEntries(Object.keys(POLICY_ENV_KEYS).map((k) => [k, k]))
);

/** Thrown by resolveRewardAmount() when a policy key has no configured amount yet. */
export class RewardPolicyNotConfiguredError extends Error {
  constructor(policyKey) {
    super(
      `Reward policy "${policyKey}" has no configured amount (env var ` +
        `${POLICY_ENV_KEYS[policyKey] ?? "<unknown>"} is unset). The token ` +
        `economy has not been finalized for this reward type yet.`
    );
    this.name = "RewardPolicyNotConfiguredError";
    this.policyKey = policyKey;
  }
}

/**
 * resolveRewardAmount — the only function in the codebase that should
 * ever produce a reward amount. Reads a non-negative integer from the
 * env var mapped to `policyKey`.
 *
 * @param {keyof typeof REWARD_POLICY_KEYS} policyKey
 * @returns {number}
 * @throws {RewardPolicyNotConfiguredError} if unset
 * @throws {Error} if the configured value isn't a valid non-negative number
 */
export function resolveRewardAmount(policyKey) {
  const envKey = POLICY_ENV_KEYS[policyKey];
  if (!envKey) {
    throw new Error(`resolveRewardAmount: unknown reward policy key "${policyKey}".`);
  }

  const raw = process.env[envKey];
  if (raw === undefined || raw.trim() === "") {
    throw new RewardPolicyNotConfiguredError(policyKey);
  }

  const amount = Number(raw);
  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error(
      `resolveRewardAmount: ${envKey}="${raw}" is not a valid non-negative number.`
    );
  }
  return amount;
}

/**
 * isRewardPolicyConfigured — non-throwing check, for callers that want
 * to branch (e.g. skip attempting a reward, or surface a status in an
 * admin view) rather than catch an exception.
 */
export function isRewardPolicyConfigured(policyKey) {
  try {
    resolveRewardAmount(policyKey);
    return true;
  } catch {
    return false;
  }
}
