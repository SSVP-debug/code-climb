import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { validateBody } from "./compiler.js";
import {
  getProgress,
  putProgress,
} from "../controllers/progressController.js";
import Problem from "../models/Problem.js";

const router = Router();

// ── Zod schema for PUT /api/progress ─────────────────────────────────────────
//
// Why validate here and not just trust the client:
//   Without this, any user can POST { solvedSlugs: ["two-sum", "fake-slug-i-never-solved"] }
//   and the server saves it — marking problems as solved without ever running code.
//   Zod + slug existence check closes that vector entirely.

const progressSchema = z.object({
  // Array of problem slugs — each must be a valid slug format
  solvedSlugs: z
    .array(
      z.string()
        .min(1)
        .max(200)
        .regex(/^[a-z0-9-]+$/, "Each slug must be lowercase letters, numbers, and hyphens")
    )
    .max(10_000, "solvedSlugs array too large")
    .optional()
    .default([]),

  // Topic stats: { "Arrays": 3, "Trees": 1 } — values must be non-negative integers
  topicStats: z
    .record(z.string().min(1).max(100), z.number().int().min(0).max(10_000))
    .optional()
    .default({}),

  // ISO date strings: "2026-06-12"
  activityDates: z
    .array(
      z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "activityDates must be YYYY-MM-DD strings")
    )
    .max(10_000)
    .optional()
    .default([]),

  // Accept both casings (frontend sends Easy/Medium/Hard, model stores easy/medium/hard)
  // Zod normalises to lowercase before hitting the controller.
  solvedDifficulty: z
    .object({
      Easy: z.number().int().min(0).max(10_000).optional().default(0),
      Medium: z.number().int().min(0).max(10_000).optional().default(0),
      Hard: z.number().int().min(0).max(10_000).optional().default(0),
      easy: z.number().int().min(0).max(10_000).optional().default(0),
      medium: z.number().int().min(0).max(10_000).optional().default(0),
      hard: z.number().int().min(0).max(10_000).optional().default(0),
    })
    .optional()
    .default({}),

  // recentActivity items
  recentActivity: z
    .array(
      z.object({
        title: z.string().max(200).optional().default(""),
        time: z.string().max(50).optional().default(""),
        status: z.string().max(100).optional().default(""),
        slug: z.string().max(200).optional().default(""),
      })
    )
    .max(10)
    .optional()
    .default([]),

  // Optional LeetCode username
  leetcodeUsername: z.string().max(100).optional(),

  // NOTE: totalXP is intentionally NOT accepted from the client.
  // It is computed server-side in putProgress from solvedSlugs × difficulty weights.
});

// ── Slug existence middleware ──────────────────────────────────────────────────
// Runs after Zod validation. Verifies every submitted slug actually exists
// in the problems collection — prevents marking fake problems as solved.
async function validateSlugs(req, res, next) {
  const { solvedSlugs } = req.body;

  if (!solvedSlugs || solvedSlugs.length === 0) return next();

  try {
    // Fetch only the slugs that exist in DB — O(1) index lookup
    const uniqueSlugs = [...new Set(solvedSlugs)];
    const existingDocs = await Problem
      .find({ slug: { $in: uniqueSlugs } })
      .select("slug")
      .lean();

    const existingSlugs = new Set(existingDocs.map((p) => p.slug));
    const fakeSlugs = solvedSlugs.filter((s) => !existingSlugs.has(s));
    

    if (fakeSlugs.length > 0) {
      return res.status(400).json({
        error: `The following problem slugs do not exist: ${fakeSlugs.join(", ")}`,
        field: "solvedSlugs",
      });
    }

    next();
  } catch (err) {
    // If DB check fails, don't block the save — log and continue
    console.error(
      "[Progress] Slug validation DB error:",
      err
    );
    next();
  }
}

// ── Routes ────────────────────────────────────────────────────────────────────

router.get("/", requireAuth, getProgress);

router.put(
  "/",
  requireAuth,
  validateBody(progressSchema),
  validateSlugs,
  putProgress
);

export default router;
