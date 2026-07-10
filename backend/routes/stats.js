/**
 * GET /api/stats (public — no auth required)
 *
 * Returns platform-wide stats for the landing page social proof section.
 * Cached in memory for 10 minutes — this endpoint gets hit by every visitor.
 * Uses Promise.all to run all three queries in parallel.
 */
import { Router } from "express";
import User from "../models/User.js";
import Problem from "../models/Problem.js";
import Submission from "../models/Submission.js";

const router = Router();

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
let cachedStats = null;
let cacheExpiresAt = 0;

router.get("/", async (req, res) => {
  try {
    const now = Date.now();

    if (cachedStats && now < cacheExpiresAt) {
      res.set("X-Cache", "HIT");
      return res.json(cachedStats);
    }

    const [userCount, problemCount, submissionCount] = await Promise.all([
      User.countDocuments(),
      Problem.countDocuments(),
      Submission.countDocuments(),
    ]);

    cachedStats = {
      users: userCount,
      problems: problemCount,
      submissions: submissionCount,
      // Derived — shown on landing page
      languages: 4,
      themes: 5,
    };

    cacheExpiresAt = now + CACHE_TTL_MS;
    res.set("X-Cache", "MISS");
    return res.json(cachedStats);

  } catch (err) {
    console.error("[/api/stats] Error:", err.message);
    // Fallback to hardcoded minimums rather than a 500
    return res.json({
      users: 0,
      problems: 0,
      submissions: 0,
      languages: 0,
      themes: 0,
    });
  }
});

export default router;
