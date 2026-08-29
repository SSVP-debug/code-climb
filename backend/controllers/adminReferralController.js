import { retryPendingReferralRewards } from "../services/referralQualification.js";
import { recordAdminAction } from "../services/adminAuditLog.js";

/**
 * controllers/adminReferralController.js — admin-triggered reward-retry
 * reconciliation (Plan 2 refinement, issue #4: reward failure recovery).
 *
 * A qualified referral whose reward issuance genuinely failed (or whose
 * policy amount wasn't configured yet at qualification time) previously
 * had no path back to being issued. This is that path: an idempotent,
 * on-demand reconciliation an admin can trigger. Not wired to any
 * scheduler — see services/referralQualification.js's module comment,
 * section 4, for why that's a deliberate, separate decision.
 */

// ── POST /api/admin/referral/retry-rewards ──────────────────────────────────
export async function retryReferralRewards(req, res) {
  try {
    const limit = Number.parseInt(req.body?.limit, 10) || undefined;
    const result = await retryPendingReferralRewards(limit ? { limit } : {});

    recordAdminAction({
      adminDoc: req.userDoc,
      action: "referral.retry_rewards",
      targetType: "ReferralQualification",
      targetId: null,
      details: result,
    });

    return res.json(result);
  } catch (err) {
    req.log.error({ err }, "[AdminReferral] retryReferralRewards failed");
    return res.status(500).json({ error: "Failed to retry referral rewards." });
  }
}
