/**
 * GET /api/stats (public — no auth required)
 *
 * Returns platform-wide stats for the landing page social proof section.
 * Cached via the shared Redis-backed cache helper (backend/utils/cache.js)
 * for 10 minutes — this endpoint gets hit by every visitor.
 *
 * Previously used a hand-rolled module-level `let cachedStats` — the same
 * per-instance cache bug documented in cache.js's header: multiple Railway
 * instances would each hold their own stale snapshot, so different
 * visitors could see different landing-page numbers for up to 10 minutes.
 * Migrated to getOrSetCache so all instances agree.
 *
 * Uses Promise.all to run all three queries in parallel on a cache miss.
 */
import { Router } from "express";
import User from "../models/User.js";
import Problem from "../models/Problem.js";
import Submission from "../models/Submission.js";
import { getOrSetCache } from "../utils/cache.js";

const router = Router();

const CACHE_TTL_SECONDS = 10 * 60; // 10 minutes
const STATS_CACHE_KEY = "stats:platform";

router.get("/", async (req, res) => {
  try {
    const { value: stats, cacheStatus } = await getOrSetCache(
      STATS_CACHE_KEY,
      CACHE_TTL_SECONDS,
      async () => {
        const [userCount, problemCount, submissionCount] = await Promise.all([
          User.countDocuments(),
          Problem.countDocuments(),
          Submission.countDocuments(),
        ]);

        return {
          users: userCount,
          problems: problemCount,
          submissions: submissionCount,
          // Derived — shown on landing page
          languages: 4,
          themes: 5,
        };
      }
    );

    res.set("X-Cache", cacheStatus);
    return res.json(stats);

  } catch (err) {
    req.log?.error?.({ err }, "[/api/stats] Error") ?? console.error("[/api/stats] Error:", err.message);
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