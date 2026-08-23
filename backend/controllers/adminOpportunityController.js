/**
 * adminOpportunityController.js — Opportunity Radar admin console.
 *
 * Status workflow (see backend/models/Opportunity.js's header comment for
 * the full diagram):
 *   draft → pending_review → approved → published
 *                          ↘ rejected
 *   published → expired (deadline passed) | archived (manual)
 *
 * Every mutating action records an AdminAuditLog entry via
 * recordAdminAction(), same convention as adminController.js /
 * adminProblemController.js — the approval queue, user role changes, and
 * problem edits all leave the same kind of trail; opportunities do too.
 */
import Opportunity from "../models/Opportunity.js";
import { nextSequence } from "../models/Counter.js";
import { recordAdminAction } from "../services/adminAuditLog.js";
import { logger } from "../config/logger.js";

// ── Slug + CC-ID allocation ──────────────────────────────────────────────
function slugify(title) {
  return (title || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80) || "opportunity";
}

async function allocateIdentity(title) {
  // nextSequence() is atomic (see Counter.js) — safe under concurrent
  // creates, unlike a "find highest, add 1" approach.
  const ccNumber = await nextSequence("opportunity");
  const ccId = `CC/${String(ccNumber).padStart(3, "0")}`;

  const base = slugify(title);
  let slug = `${base}-${String(ccNumber).padStart(3, "0")}`;
  // Extremely unlikely (slug already embeds the unique ccNumber), but
  // guard anyway rather than trust uniqueness by construction alone.
  let attempts = 0;
  while ((await Opportunity.exists({ slug })) && attempts < 5) {
    attempts++;
    slug = `${base}-${String(ccNumber).padStart(3, "0")}-${attempts}`;
  }

  return { ccId, ccNumber, slug };
}

// Applies the lazy-expiry check (see Opportunity.js's isExpiredByDeadline
// header comment) and persists the flip if it just happened, so admin
// list/detail views never show a stale "published" badge on something
// past its deadline.
async function reconcileExpiry(doc) {
  if (doc.status === "published" && doc.isExpiredByDeadline()) {
    doc.status = "expired";
    doc.expiredAt = new Date();
    await doc.save();
  }
  return doc;
}

// ── GET /api/admin/opportunities ─────────────────────────────────────────
export async function listOpportunitiesAdmin(req, res) {
  try {
    const { status, type, category, location, organization, search, sort } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (type) filter.type = type;
    if (category) filter.category = new RegExp(category, "i");
    if (location) filter.location = new RegExp(location, "i");
    if (organization) filter.organization = new RegExp(organization, "i");
    if (search) {
      filter.$or = [
        { title: new RegExp(search, "i") },
        { organization: new RegExp(search, "i") },
        { ccId: new RegExp(search, "i") },
      ];
    }

    const sortMap = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      deadline: { applicationDeadline: 1 },
      ccId: { ccNumber: -1 },
    };

    const opportunities = await Opportunity.find(filter)
      .sort(sortMap[sort] || sortMap.newest)
      .limit(500)
      .lean();

    return res.json({ opportunities });
  } catch (err) {
    logger.error({ err }, "[AdminOpportunity] list failed");
    return res.status(500).json({ error: "Failed to load opportunities." });
  }
}

// ── GET /api/admin/opportunities/:id ─────────────────────────────────────
export async function getOpportunityAdmin(req, res) {
  try {
    const opp = await Opportunity.findById(req.params.id);
    if (!opp) return res.status(404).json({ error: "Opportunity not found." });
    await reconcileExpiry(opp);
    return res.json({ opportunity: opp });
  } catch (err) {
    logger.error({ err }, "[AdminOpportunity] get failed");
    return res.status(500).json({ error: "Failed to load opportunity." });
  }
}

// ── POST /api/admin/opportunities ────────────────────────────────────────
// Creates a DRAFT. req.body is already validated + defaulted by
// validateBody(OpportunityCreateSchema).
export async function createOpportunity(req, res) {
  try {
    if (!req.userDoc) return res.status(503).json({ error: "Database unavailable." });

    const { ccId, ccNumber, slug } = await allocateIdentity(req.body.title);

    const opp = await Opportunity.create({
      ...req.body,
      ccId,
      ccNumber,
      slug,
      status: "draft",
      createdBy: req.userDoc._id,
      updatedBy: req.userDoc._id,
    });

    recordAdminAction({
      adminDoc: req.userDoc,
      action: "opportunity.create",
      targetType: "Opportunity",
      targetId: opp._id.toString(),
      details: { ccId: opp.ccId, title: opp.title },
    });

    return res.status(201).json({ opportunity: opp });
  } catch (err) {
    logger.error({ err }, "[AdminOpportunity] create failed");
    return res.status(500).json({ error: "Failed to create opportunity." });
  }
}

// ── PATCH /api/admin/opportunities/:id ───────────────────────────────────
export async function updateOpportunity(req, res) {
  try {
    if (!req.userDoc) return res.status(503).json({ error: "Database unavailable." });

    const opp = await Opportunity.findById(req.params.id);
    if (!opp) return res.status(404).json({ error: "Opportunity not found." });

    Object.assign(opp, req.body, { updatedBy: req.userDoc._id });
    await opp.save();

    recordAdminAction({
      adminDoc: req.userDoc,
      action: "opportunity.update",
      targetType: "Opportunity",
      targetId: opp._id.toString(),
      details: { ccId: opp.ccId, fields: Object.keys(req.body) },
    });

    return res.json({ opportunity: opp });
  } catch (err) {
    logger.error({ err }, "[AdminOpportunity] update failed");
    return res.status(500).json({ error: "Failed to update opportunity." });
  }
}

// ── Status transitions ───────────────────────────────────────────────────
// Each transition is intentionally its own small handler (rather than one
// generic "PATCH status") so illegal jumps (e.g. draft → published
// directly, skipping review) are rejected explicitly instead of silently
// allowed by a permissive status enum PATCH.

const VALID_TRANSITIONS = {
  submit_review: { from: ["draft"], to: "pending_review" },
  approve: { from: ["pending_review"], to: "approved" },
  publish: { from: ["approved"], to: "published" },
  reject: { from: ["pending_review", "approved"], to: "rejected" },
  archive: { from: ["draft", "pending_review", "approved", "rejected", "expired"], to: "archived" },
  mark_expired: { from: ["published"], to: "expired" },
};

async function applyTransition(req, res, transitionKey, extra = {}) {
  try {
    if (!req.userDoc) return res.status(503).json({ error: "Database unavailable." });

    const opp = await Opportunity.findById(req.params.id);
    if (!opp) return res.status(404).json({ error: "Opportunity not found." });

    const transition = VALID_TRANSITIONS[transitionKey];
    if (!transition.from.includes(opp.status)) {
      return res.status(409).json({
        error: `Cannot ${transitionKey.replace("_", " ")} an opportunity in "${opp.status}" status.`,
        currentStatus: opp.status,
      });
    }

    opp.status = transition.to;
    opp.updatedBy = req.userDoc._id;

    if (transitionKey === "approve") opp.reviewedAt = new Date();
    if (transitionKey === "publish") opp.publishedAt = new Date();
    if (transitionKey === "reject") opp.rejectionReason = extra.reason || "";
    if (transitionKey === "mark_expired") opp.expiredAt = new Date();

    await opp.save();

    recordAdminAction({
      adminDoc: req.userDoc,
      action: `opportunity.${transitionKey}`,
      targetType: "Opportunity",
      targetId: opp._id.toString(),
      details: { ccId: opp.ccId, ...extra },
    });

    return res.json({ opportunity: opp });
  } catch (err) {
    logger.error({ err, transitionKey }, "[AdminOpportunity] transition failed");
    return res.status(500).json({ error: "Failed to update opportunity status." });
  }
}

export const submitForReview = (req, res) => applyTransition(req, res, "submit_review");
export const approveOpportunity = (req, res) => applyTransition(req, res, "approve");
export const publishOpportunity = (req, res) => applyTransition(req, res, "publish");
export const archiveOpportunity = (req, res) => applyTransition(req, res, "archive");
export const markExpiredOpportunity = (req, res) => applyTransition(req, res, "mark_expired");
export const rejectOpportunity = (req, res) =>
  applyTransition(req, res, "reject", { reason: req.body.reason });

// ── POST /api/admin/opportunities/:id/duplicate ──────────────────────────
export async function duplicateOpportunity(req, res) {
  try {
    if (!req.userDoc) return res.status(503).json({ error: "Database unavailable." });

    const source = await Opportunity.findById(req.params.id).lean();
    if (!source) return res.status(404).json({ error: "Opportunity not found." });

    const { ccId, ccNumber, slug } = await allocateIdentity(`${source.title} copy`);

    // Strip identity/workflow/analytics fields — everything else carries over.
    const {
      _id, ccId: _oldCcId, ccNumber: _oldCcNumber, slug: _oldSlug,
      status: _status, viewCount, applyClickCount, sourceBreakdown,
      publishedAt, reviewedAt, expiredAt, rejectionReason,
      createdAt, updatedAt, __v,
      ...rest
    } = source;

    const opp = await Opportunity.create({
      ...rest,
      ccId,
      ccNumber,
      slug,
      status: "draft",
      createdBy: req.userDoc._id,
      updatedBy: req.userDoc._id,
    });

    recordAdminAction({
      adminDoc: req.userDoc,
      action: "opportunity.duplicate",
      targetType: "Opportunity",
      targetId: opp._id.toString(),
      details: { ccId: opp.ccId, sourceCcId: source.ccId },
    });

    return res.status(201).json({ opportunity: opp });
  } catch (err) {
    logger.error({ err }, "[AdminOpportunity] duplicate failed");
    return res.status(500).json({ error: "Failed to duplicate opportunity." });
  }
}

// ── GET /api/admin/opportunities/:id/analytics ───────────────────────────
// Only ever surfaces counters that are actually tracked on the doc — no
// derived/fabricated metrics beyond a simple click-through-rate ratio of
// two real numbers (PART 13/19: never invent share counts etc).
export async function getOpportunityAnalytics(req, res) {
  try {
    const opp = await Opportunity.findById(req.params.id).lean();
    if (!opp) return res.status(404).json({ error: "Opportunity not found." });

    const views = opp.viewCount || 0;
    const clicks = opp.applyClickCount || 0;

    return res.json({
      ccId: opp.ccId,
      title: opp.title,
      viewCount: views,
      applyClickCount: clicks,
      clickThroughRate: views > 0 ? Number(((clicks / views) * 100).toFixed(1)) : null,
      sourceBreakdown: opp.sourceBreakdown || {},
    });
  } catch (err) {
    logger.error({ err }, "[AdminOpportunity] analytics failed");
    return res.status(500).json({ error: "Failed to load analytics." });
  }
}
