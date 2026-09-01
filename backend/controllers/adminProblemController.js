/**
 * adminProblemController.js — admin console problem-management endpoints
 * (plan 006). Split into its own file for the same reason
 * collegeController.js was (plan 005): adminController.js had grown to 898
 * lines by this point, already the largest controller in the codebase.
 *
 * ── Two-tier write model — read this before changing anything here ────────
 * Problems have a real content pipeline that predates this admin UI:
 * src/data/problems.js is the canonical source, seeded into MongoDB via
 * `npm run seed` (backend/scripts/seedProblems.js), which upserts by slug
 * with a raw `$set` on every run. A web UI that lets an admin freely edit
 * an EXISTING catalog problem's fields would have those edits silently
 * reverted by the next seed run, with no warning and no audit trail
 * explaining why. See admin-console-plans/plans/006-problem-management-ui.md
 * for the full writeup.
 *
 * The `adminSource` field (backend/models/Problem.js) distinguishes the two
 * tiers this controller enforces:
 *   - "catalog" (default — anything from the JS/folder pipeline): read-only
 *     here except for `topic`/`pattern`/`sourceType` (the "safelisted"
 *     fields — presentational/operational, not content-correctness-
 *     affecting, and genuinely fine to touch from an admin panel even
 *     though they'll still get reverted on the next seed run same as any
 *     other catalog field. That tension is surfaced in the UI, not solved
 *     here — see the Maintenance note in the plan doc for the real fix).
 *   - "admin" (created directly through this UI): full CRUD, never touched
 *     by seedProblems.js/importProblems.js by construction (they only ever
 *     touch slugs present in problems.js).
 */
import { z } from "zod";
import Problem from "../models/Problem.js";
import { invalidateProblemsCache } from "./problemController.js";
import { recordAdminAction } from "../services/adminAuditLog.js";
import { AdminProblemCreateSchema, MetaSchema } from "../schemas/problemSchema.js";
import { logger } from "../config/logger.js";

// ── Availability field (Content & Execution Architecture, Phase 1) ────────
// `enabled` deliberately does NOT live in schemas/problemSchema.js's
// MetaSchema/AdminProblemCreateSchema — those are shared with the folder/JS
// content-authoring pipeline (src/data/problems.js, importProblems.js,
// ProblemFolderSchema), which this phase explicitly does not touch.
// Extended locally, admin-console-only, so the authoring-pipeline schemas
// stay exactly as they were.
const EnabledFieldSchema = z.boolean();

// ── Hidden-testcase-set toggle (audit follow-up) ───────────────────────────
// Same reasoning/safety as EnabledFieldSchema above, extended to the
// second real gap the Content & Execution Architecture cross-check found:
// this was previously only reachable for "admin"-sourced problems (via
// the full AdminProblemCreateSchema update branch below), not for any of
// the 250 "catalog" problems — meaning the vast majority of the catalog
// had no way to pause grading for a single problem without either
// disabling the whole problem (`enabled: false`, too broad — Run mode
// and the problem page both go dark too, not just Submit) or editing
// src/data/problems.js and redeploying. Safe to add to the catalog
// safelist because both writers of this field for catalog problems
// (seedProblems.js, importProblems.js) already explicitly carry forward
// `existing?.hiddenTestcaseSet?.enabled` rather than overwriting it on
// every reseed — verified by reading both scripts, not assumed — so a
// toggle made here survives future reseeds exactly the way `enabled`
// already does.
const HiddenTestcaseSetEnabledFieldSchema = z.boolean();

const CATALOG_SAFELISTED_FIELDS = ["topic", "pattern", "sourceType", "enabled", "hiddenTestcaseSetEnabled"];
// Reuses MetaSchema's own field-level rules for the three original
// safelisted fields, rather than re-declaring "topic must be a non-empty
// string" etc. a second time — same reuse rationale as
// AdminProblemCreateSchema itself. `enabled` and `hiddenTestcaseSetEnabled`
// are appended via `.extend()` since neither is part of MetaSchema.
const CatalogSafelistSchema = MetaSchema.pick({
  topic: true,
  pattern: true,
  sourceType: true,
})
  .partial()
  .extend({
    enabled: EnabledFieldSchema.optional(),
    hiddenTestcaseSetEnabled: HiddenTestcaseSetEnabledFieldSchema.optional(),
  });

// New admin-created problems get an id starting well clear of the catalog's
// own sequential range (currently 1–250ish) so the two numbering spaces
// never visually collide, while still being guaranteed unique (always
// strictly greater than the current max id in the collection, whatever
// that is). Two concurrent creates could theoretically compute the same
// next id — Mongoose's unique index on `id` will reject the second insert
// with a duplicate-key error, which createProblem below surfaces as a
// clean 409 rather than a raw 500. Acceptable for "zero real users yet";
// revisit if concurrent admin-authoring ever becomes a real usage pattern.
async function nextAdminProblemId() {
  const highest = await Problem.findOne({}).sort({ id: -1 }).select("id").lean();
  return Math.max((highest?.id || 0) + 1, 100000);
}

// ── GET /api/admin/problems ──────────────────────────────────────────────────
export async function listProblemsForAdmin(req, res) {
  try {
    const { difficulty, topic, adminSource, search, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (difficulty && ["Easy", "Medium", "Hard"].includes(difficulty)) {
      filter.difficulty = difficulty;
    }
    if (topic) filter.topic = topic;
    if (adminSource && ["catalog", "admin"].includes(adminSource)) {
      filter.adminSource = adminSource;
    }
    // Same "missing or true counts as enabled" reasoning as
    // problemController.getProblems — lets the future admin UI filter by
    // availability without a backfill migration.
    if (req.query.enabled === "true") {
      filter.enabled = { $ne: false };
    } else if (req.query.enabled === "false") {
      filter.enabled = false;
    }
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { slug: { $regex: search, $options: "i" } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, parseInt(limit));

    const [problems, total] = await Promise.all([
      Problem.find(
        filter,
        "id title slug difficulty topic pattern sourceType adminSource visibility enabled hiddenTestcaseSet.enabled contentVersion createdAt"
      )
        .sort({ id: 1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
      Problem.countDocuments(filter),
    ]);

    return res.json({ problems, total, page: pageNum, limit: limitNum });
  } catch (err) {
    logger.error({ err }, "[Admin] problems list error");
    return res.status(500).json({ error: "Failed to load problems." });
  }
}

// ── GET /api/admin/problems/:slug ────────────────────────────────────────────
// Full detail INCLUDING hiddenTestcaseSet — the public getProblemBySlug
// (problemController.js) deliberately strips these (Problem.js's
// publicFields static / its own .select() calls); this is the admin-only
// variant that doesn't.
export async function getProblemForAdmin(req, res) {
  try {
    const problem = await Problem.findOne({ slug: req.params.slug }).lean();
    if (!problem) {
      return res.status(404).json({ error: "Problem not found." });
    }
    return res.json({ problem });
  } catch (err) {
    logger.error({ err }, "[Admin] get problem error");
    return res.status(500).json({ error: "Failed to load problem." });
  }
}

// ── POST /api/admin/problems ─────────────────────────────────────────────────
export async function createProblem(req, res) {
  try {
    // `enabled` extended in locally (see EnabledFieldSchema above) — kept
    // optional so a create payload that doesn't mention it at all still
    // works exactly as before, falling through to the Mongoose schema's
    // own `default: true`.
    const parsed = AdminProblemCreateSchema.omit({ id: true })
      .extend({ enabled: EnabledFieldSchema.optional() })
      .safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: "Invalid problem payload.",
        issues: parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
      });
    }

    const id = await nextAdminProblemId();

    let created;
    try {
      created = await Problem.create({ ...parsed.data, id, adminSource: "admin" });
    } catch (err) {
      if (err.code === 11000) {
        return res.status(409).json({ error: "A problem with this slug already exists." });
      }
      throw err;
    }

    await invalidateProblemsCache();

    recordAdminAction({
      adminDoc: req.actingAdminDoc || req.userDoc,
      action: "problem.create",
      targetType: "Problem",
      targetId: created._id,
      details: { slug: created.slug, adminSource: "admin" },
    });

    return res.status(201).json({ problem: created });
  } catch (err) {
    logger.error({ err }, "[Admin] create problem error");
    return res.status(500).json({ error: "Failed to create problem." });
  }
}

// ── PATCH /api/admin/problems/:slug ──────────────────────────────────────────
export async function updateProblem(req, res) {
  try {
    const problem = await Problem.findOne({ slug: req.params.slug });
    if (!problem) {
      return res.status(404).json({ error: "Problem not found." });
    }

    const bodyKeys = Object.keys(req.body || {});

    if (problem.adminSource !== "admin") {
      // Catalog problem — only the three safelisted fields, and reject
      // (don't silently drop) anything else so the admin knows the edit
      // didn't fully apply, per plan 006's explicit instruction.
      const disallowed = bodyKeys.filter((k) => !CATALOG_SAFELISTED_FIELDS.includes(k));
      if (disallowed.length > 0) {
        return res.status(400).json({
          error: `Catalog problems can only have ${CATALOG_SAFELISTED_FIELDS.join(
            ", "
          )} edited here. Full content edits happen in src/data/problems.js — see the note on this page.`,
          disallowedFields: disallowed,
        });
      }

      const parsed = CatalogSafelistSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: "Invalid field value.",
          issues: parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
        });
      }

      const changed = {};
      for (const key of Object.keys(parsed.data)) {
        // Flat request-body key that maps onto a nested schema path — not
        // a real top-level field on the Mongoose document (unlike the
        // other three safelisted fields, which are), so it needs its own
        // assignment rather than the generic `problem[key] = value` below.
        if (key === "hiddenTestcaseSetEnabled") {
          const before = problem.hiddenTestcaseSet?.enabled ?? true;
          const after = parsed.data.hiddenTestcaseSetEnabled;
          if (before !== after) changed.hiddenTestcaseSetEnabled = { from: before, to: after };
          problem.hiddenTestcaseSet.enabled = after;
          continue;
        }
        if (problem[key] !== parsed.data[key]) changed[key] = { from: problem[key], to: parsed.data[key] };
        problem[key] = parsed.data[key];
      }
      await problem.save();
      await invalidateProblemsCache();

      recordAdminAction({
        adminDoc: req.actingAdminDoc || req.userDoc,
        action: "problem.update_safelisted",
        targetType: "Problem",
        targetId: problem._id,
        details: { slug: problem.slug, changed },
      });

      return res.json({ problem });
    }

    // Admin-sourced — full update, same shape/rules as create.
    const parsed = AdminProblemCreateSchema.omit({ id: true })
      .partial()
      .extend({ enabled: EnabledFieldSchema.optional() })
      .safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: "Invalid problem payload.",
        issues: parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
      });
    }

    const changed = {};
    for (const key of Object.keys(parsed.data)) {
      const before = problem[key];
      const after = parsed.data[key];
      // Cheap deep-enough comparison for the plain values/arrays/objects
      // this schema produces — good enough for an audit-log diff, not
      // trying to be a full deep-equal library.
      if (JSON.stringify(before) !== JSON.stringify(after)) {
        changed[key] = { from: before, to: after };
      }
      problem[key] = after;
    }
    await problem.save();
    await invalidateProblemsCache();

    recordAdminAction({
      adminDoc: req.actingAdminDoc || req.userDoc,
      action: "problem.update",
      targetType: "Problem",
      targetId: problem._id,
      details: { slug: problem.slug, changedFields: Object.keys(changed) },
    });

    return res.json({ problem });
  } catch (err) {
    logger.error({ err }, "[Admin] update problem error");
    return res.status(500).json({ error: "Failed to update problem." });
  }
}

// ── DELETE /api/admin/problems/:slug ─────────────────────────────────────────
// Refuses (403) on a catalog problem — it would just come back on the next
// seed run anyway (looks deleted, then silently reappears), which is worse
// than not offering delete at all. Admin-sourced problems are safe to hard
// delete — nothing references them by construction (never seeded, never
// exported to folders).
export async function deleteProblem(req, res) {
  try {
    const problem = await Problem.findOne({ slug: req.params.slug });
    if (!problem) {
      return res.status(404).json({ error: "Problem not found." });
    }
    if (problem.adminSource !== "admin") {
      return res.status(403).json({
        error: "Catalog problems can't be deleted here — they'd reappear on the next seed run. Remove them from src/data/problems.js instead.",
      });
    }

    await Problem.deleteOne({ _id: problem._id });
    await invalidateProblemsCache();

    recordAdminAction({
      adminDoc: req.actingAdminDoc || req.userDoc,
      action: "problem.delete",
      targetType: "Problem",
      targetId: problem._id,
      details: { slug: problem.slug },
    });

    return res.json({ success: true });
  } catch (err) {
    logger.error({ err }, "[Admin] delete problem error");
    return res.status(500).json({ error: "Failed to delete problem." });
  }
}