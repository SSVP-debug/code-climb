/**
 * GET /api/leaderboard/global   — top 50 users by XP (paginated)
 * GET /api/leaderboard/college  — top users grouped by email domain
 *
 * Public endpoints — no auth required (profiles are already public).
 * Heavy caching: leaderboard recomputed max once every 5 minutes, via the
 * shared Redis-backed cache helper (backend/utils/cache.js) so multiple
 * Railway instances agree on the same ranking instead of each keeping its
 * own in-memory snapshot.
 */
import { Router } from "express";
import User from "../models/User.js";
import { getOrSetCache, invalidateCachePrefix } from "../utils/cache.js";

const router = Router();

const CACHE_TTL_SECONDS = 5 * 60; // 5 minutes
const GLOBAL_CACHE_KEY = "leaderboard:global";
const COLLEGE_CACHE_PREFIX = "leaderboard:college:";

// ── GET /api/leaderboard/global ─────────────────────────────────────────────
router.get("/global", async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const skip  = (page - 1) * limit;

    const { value: ranked } = await getOrSetCache(
      GLOBAL_CACHE_KEY,
      CACHE_TTL_SECONDS,
      async () => {
        const users = await User.find({ isProfilePublic: true })
          .sort({ totalXP: -1, solvedSlugs: -1 })
          .limit(500)            // cap at top 500 — enough for any college leaderboard
          .select("username displayName totalXP solvedSlugs currentStreak solvedDifficulty email joinedDate")
          .lean();

        // Compute level + medal server-side
        return users.map((u, i) => ({
          rank:           i + 1,
          username:       u.username || u.displayName?.toLowerCase().replace(/\s+/g, "_") || "anonymous",
          displayName:    u.displayName || "Anonymous",
          totalXP:        u.totalXP || 0,
          level:          Math.floor((u.totalXP || 0) / 100) + 1,
          solvedCount:    u.solvedSlugs?.length ?? 0,
          currentStreak:  u.currentStreak || 0,
          easy:           u.solvedDifficulty?.easy   || 0,
          medium:         u.solvedDifficulty?.medium || 0,
          hard:           u.solvedDifficulty?.hard   || 0,
          // College extracted from email domain
          college:        u.email ? u.email.split("@")[1]?.replace(".ac.in","").replace(".edu","") : null,
        }));
      }
    );

    const slice = ranked.slice(skip, skip + limit);
    return res.json({ users: slice, total: ranked.length, page, limit });

  } catch (err) {
    req.log.error({ err }, "[Leaderboard] global endpoint failed");
    return res.status(500).json({ error: "Failed to load leaderboard." });
  }
});

// ── GET /api/leaderboard/college?domain=marwadiuniversity.ac.in ─────────────
router.get("/college", async (req, res) => {
  try {
    const domain = (req.query.domain || "").toLowerCase().trim();

    if (!domain) {
      return res.status(400).json({ error: "domain query param required." });
    }

    const { value: result } = await getOrSetCache(
      `${COLLEGE_CACHE_PREFIX}${domain}`,
      CACHE_TTL_SECONDS,
      async () => {
        const users = await User.find({
          email:            { $regex: `@${domain.replace(".", "\\.")}$`, $options: "i" },
          isProfilePublic:  true,
        })
          .sort({ totalXP: -1 })
          .limit(100)
          .select("username displayName totalXP solvedSlugs currentStreak solvedDifficulty joinedDate")
          .lean();

        const ranked = users.map((u, i) => ({
          rank:          i + 1,
          username:      u.username || "anonymous",
          displayName:   u.displayName || "Anonymous",
          totalXP:       u.totalXP || 0,
          level:         Math.floor((u.totalXP || 0) / 100) + 1,
          solvedCount:   u.solvedSlugs?.length ?? 0,
          currentStreak: u.currentStreak || 0,
          easy:          u.solvedDifficulty?.easy   || 0,
          medium:        u.solvedDifficulty?.medium || 0,
          hard:          u.solvedDifficulty?.hard   || 0,
        }));

        return { domain, users: ranked, total: ranked.length };
      }
    );

    return res.json(result);

  } catch (err) {
    req.log.error({ err }, "[Leaderboard] college endpoint failed");
    return res.status(500).json({ error: "Failed to load college leaderboard." });
  }
});

// ── GET /api/leaderboard/domains — list all college domains active on platform
router.get("/domains", async (req, res) => {
  try {
    const users = await User.find({ isProfilePublic: true })
      .select("email")
      .lean();

    const domainCount = {};
    users.forEach(u => {
      if (!u.email) return;
      const domain = u.email.split("@")[1];
      if (domain && domain.includes(".")) {
        domainCount[domain] = (domainCount[domain] || 0) + 1;
      }
    });

    const domains = Object.entries(domainCount)
      .filter(([, count]) => count >= 2)    // at least 2 users from same college
      .sort((a, b) => b[1] - a[1])
      .slice(0, 50)
      .map(([domain, count]) => ({ domain, count }));

    return res.json({ domains });
  } catch (err) {
    req.log.error({ err }, "[Leaderboard] domains endpoint failed");
    return res.status(500).json({ error: "Failed to load domains." });
  }
});

// Exported so progressController can invalidate both leaderboard caches
// after a write that changes a user's totalXP/solvedSlugs.
export async function invalidateLeaderboardCaches() {
  await invalidateCachePrefix(GLOBAL_CACHE_KEY);
  await invalidateCachePrefix(COLLEGE_CACHE_PREFIX);
}

export default router;