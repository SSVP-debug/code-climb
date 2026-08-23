/**
 * opportunityController.js — public-facing Opportunity Radar endpoints.
 * No auth required (see routes/opportunities.js) — every handler here
 * must only ever return/mutate PUBLISHED, non-expired opportunities, and
 * must never expose verificationNotes (admin-only per PART 17).
 */
import Opportunity from "../models/Opportunity.js";
import { logger } from "../config/logger.js";

// Fields safe to expose publicly — explicitly excludes verificationNotes,
// createdBy/updatedBy, rejectionReason, and raw analytics counters beyond
// what the page itself needs to render.
const PUBLIC_PROJECTION =
  "ccId ccNumber slug title organization organizationLogoUrl type category " +
  "shortSummary description eligibility eligibleDegrees eligibleBranches " +
  "eligibleGraduationYears minYear maxYear location workMode country " +
  "stipend prize compensationNotes duration applicationDeadline startDate " +
  "officialApplicationUrl officialSourceUrl verificationStatus lastVerifiedAt " +
  "status publishedAt createdAt";

async function reconcileExpiry(doc) {
  if (doc.status === "published" && doc.isExpiredByDeadline()) {
    doc.status = "expired";
    doc.expiredAt = new Date();
    await doc.save();
  }
  return doc;
}

// ── GET /api/opportunities ────────────────────────────────────────────────
export async function listOpportunities(req, res) {
  try {
    const { type, category, location, closingSoon } = req.query;

    const filter = { status: "published" };
    if (type) filter.type = type;
    if (category) filter.category = new RegExp(category, "i");
    if (location) filter.location = new RegExp(location, "i");

    // "Closing soon" = deadline within the next 7 days (and not yet past —
    // already-past ones will self-correct to "expired" on next touch, but
    // filtering out clearly stale ones here too costs nothing).
    if (closingSoon === "true") {
      const now = new Date();
      const soon = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      filter.applicationDeadline = { $gte: now, $lte: soon };
    }

    const opportunities = await Opportunity.find(filter)
      .select(PUBLIC_PROJECTION)
      .sort({ publishedAt: -1 })
      .limit(200)
      .lean();

    // Lazy-filter anything whose deadline has passed since it was last
    // written (see Opportunity.js's isExpiredByDeadline header comment) —
    // the listing must never show an expired opportunity as active even
    // if its stored `status` hasn't been touched yet.
    const now = Date.now();
    const active = opportunities.filter(
      (o) => !o.applicationDeadline || new Date(o.applicationDeadline).getTime() >= now
    );

    return res.json({ opportunities: active });
  } catch (err) {
    logger.error({ err }, "[Opportunity] list failed");
    return res.status(500).json({ error: "Failed to load opportunities." });
  }
}

// ── GET /api/opportunities/:ccId ─────────────────────────────────────────
// :ccId accepts either "CC/027", "cc-027", or the bare slug — normalized
// below — so the QR/share-card URL and a manually typed link both work.
export async function getOpportunity(req, res) {
  try {
    const raw = decodeURIComponent(req.params.ccId || "");
    const digits = raw.match(/(\d+)/)?.[1];
    const ccNumber = digits ? parseInt(digits, 10) : null;

    const query = ccNumber
      ? { ccNumber }
      : { slug: raw.toLowerCase() };

    const opp = await Opportunity.findOne(query).select(PUBLIC_PROJECTION + " applicationDeadline");
    if (!opp) return res.status(404).json({ error: "Opportunity not found." });

    await reconcileExpiry(opp);

    if (opp.status !== "published" && opp.status !== "expired") {
      // Not yet published (draft/pending/approved/rejected/archived) —
      // never visible on the public site regardless of how it's requested.
      return res.status(404).json({ error: "Opportunity not found." });
    }

    return res.json({ opportunity: opp });
  } catch (err) {
    logger.error({ err }, "[Opportunity] get failed");
    return res.status(500).json({ error: "Failed to load opportunity." });
  }
}

// ── POST /api/opportunities/:ccId/view ───────────────────────────────────
export async function trackView(req, res) {
  try {
    const raw = decodeURIComponent(req.params.ccId || "");
    const digits = raw.match(/(\d+)/)?.[1];
    if (!digits) return res.status(400).json({ error: "Invalid opportunity id." });

    await Opportunity.updateOne(
      { ccNumber: parseInt(digits, 10), status: { $in: ["published", "expired"] } },
      { $inc: { viewCount: 1 } }
    );

    return res.status(204).end();
  } catch (err) {
    logger.error({ err }, "[Opportunity] view tracking failed");
    // Never fail the page load over a metrics write.
    return res.status(204).end();
  }
}

// ── POST /api/opportunities/:ccId/apply-click ────────────────────────────
export async function trackApplyClick(req, res) {
  try {
    const raw = decodeURIComponent(req.params.ccId || "");
    const digits = raw.match(/(\d+)/)?.[1];
    if (!digits) return res.status(400).json({ error: "Invalid opportunity id." });

    const source = req.body?.source || "direct";
    const sourceKey = ["whatsapp", "discord", "linkedin", "direct", "other"].includes(source)
      ? source
      : "other";

    await Opportunity.updateOne(
      { ccNumber: parseInt(digits, 10), status: { $in: ["published", "expired"] } },
      { $inc: { applyClickCount: 1, [`sourceBreakdown.${sourceKey}`]: 1 } }
    );

    return res.status(204).end();
  } catch (err) {
    logger.error({ err }, "[Opportunity] apply-click tracking failed");
    return res.status(204).end();
  }
}
