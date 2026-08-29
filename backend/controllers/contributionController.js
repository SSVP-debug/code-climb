import Contribution from "../models/Contribution.js";
import { createContribution } from "../services/contribution.js";

/**
 * controllers/contributionController.js — student-facing endpoints for
 * Contribution Infrastructure (Phase 2F). Mirrors routes/rewards.js's
 * split: self-service endpoints here, admin-facing review/approval
 * endpoints in controllers/adminContributionController.js + routes/admin.js
 * (that file's existing flat-router-with-per-route-requireAdmin
 * convention), not a second admin-mounting pattern for one feature.
 */

// ── POST /api/contributions ─────────────────────────────────────────────────
// Body already validated + defaulted by validateBody(ContributionCreateSchema)
// (routes/contributions.js) before this handler runs.
export async function submitContribution(req, res) {
  try {
    if (!req.userDoc) return res.status(503).json({ error: "Database unavailable." });

    const { kind, payload } = req.body;
    const contribution = await createContribution({
      contributorId: req.userDoc._id,
      kind,
      payload,
    });

    return res.status(201).json({ contribution });
  } catch (err) {
    req.log.error({ err }, "[Contribution] submitContribution failed");
    return res.status(500).json({ error: "Failed to submit contribution." });
  }
}

// ── GET /api/contributions/mine ─────────────────────────────────────────────
// Always scoped to req.userDoc — never accepts a contributorId query
// param, same reasoning routes/rewards.js's getMyLedger uses: this stays
// simple and can never be tricked into returning someone else's
// contributions. The admin-facing "any/all contributions" queue view is
// the separate, requireAdmin-gated endpoint in
// controllers/adminContributionController.js.
export async function getMyContributions(req, res) {
  try {
    if (!req.userDoc) return res.status(503).json({ error: "Database unavailable." });

    const page = Number.parseInt(req.query.page, 10) || 1;
    const limit = Math.min(Number.parseInt(req.query.limit, 10) || 20, 100);

    const [contributions, total] = await Promise.all([
      Contribution.find({ contributorId: req.userDoc._id })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Contribution.countDocuments({ contributorId: req.userDoc._id }),
    ]);

    return res.json({ contributions, page, limit, total });
  } catch (err) {
    req.log.error({ err }, "[Contribution] getMyContributions failed");
    return res.status(500).json({ error: "Failed to load your contributions." });
  }
}