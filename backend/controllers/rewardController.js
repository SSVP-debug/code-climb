import { getBalance, getLedger } from "../services/rewardLedger.js";

/**
 * rewardController.js — read-only endpoints over the Reward Ledger.
 * Phase 2 architecture report §18-19. No mutation lives here — rewards
 * are only ever written by services/rewardLedger.js's issueReward(),
 * called from the referral-qualification and contribution-approval
 * flows, never from a client-facing endpoint.
 */

// ── GET /api/rewards/balance ────────────────────────────────────────────────
export async function getMyBalance(req, res) {
  try {
    if (!req.userDoc) return res.status(503).json({ error: "Database unavailable." });

    const balance = await getBalance(req.userDoc._id);
    return res.json({ balance });
  } catch (err) {
    req.log.error({ err }, "[Rewards] getMyBalance failed");
    return res.status(500).json({ error: "Failed to load reward balance." });
  }
}

// ── GET /api/rewards/ledger ─────────────────────────────────────────────────
// Always scoped to req.userDoc — never accepts a userId query param. The
// admin-facing "any user's ledger" view is a separate, requireAdmin-gated
// route (see routes/rewards.js) so this one can stay simple and can never
// be tricked into returning someone else's ledger.
export async function getMyLedger(req, res) {
  try {
    if (!req.userDoc) return res.status(503).json({ error: "Database unavailable." });

    const page = Number.parseInt(req.query.page, 10) || 1;
    const limit = Number.parseInt(req.query.limit, 10) || 20;

    const result = await getLedger(req.userDoc._id, { page, limit });
    return res.json(result);
  } catch (err) {
    req.log.error({ err }, "[Rewards] getMyLedger failed");
    return res.status(500).json({ error: "Failed to load reward ledger." });
  }
}

// ── GET /api/admin/rewards/ledger?userId=... ────────────────────────────────
export async function getUserLedgerAdmin(req, res) {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: "userId is required." });

    const page = Number.parseInt(req.query.page, 10) || 1;
    const limit = Number.parseInt(req.query.limit, 10) || 20;

    const [result, balance] = await Promise.all([
      getLedger(userId, { page, limit }),
      getBalance(userId),
    ]);

    return res.json({ ...result, balance });
  } catch (err) {
    req.log.error({ err }, "[Rewards] getUserLedgerAdmin failed");
    return res.status(500).json({ error: "Failed to load user reward ledger." });
  }
}
