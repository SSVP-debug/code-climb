/**
 * GET /api/leaderboard/global   — top 50 users by XP (paginated)
 * GET /api/leaderboard/college  — top users grouped by email domain
 *
 * Public endpoints — no auth required (profiles are already public).
 * Heavy caching: leaderboard recomputed max once every 5 minutes.
 */
import { Router } from "express";
import User from "../models/User.js";

const router = Router();

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
let globalCache = null;
let globalCacheAt = 0;
let collegeCache = {};
let collegeCacheAt = 0;

// ── GET /api/leaderboard/global ─────────────────────────────────────────────
router.get("/global", async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const skip  = (page - 1) * limit;
    const now   = Date.now();

    // Serve from cache if fresh
    if (globalCache && now - globalCacheAt < CACHE_TTL) {
      const slice = globalCache.slice(skip, skip + limit);
      return res.json({ users: slice, total: globalCache.length, page, limit });
    }

    const users = await User.find({ isProfilePublic: true })
      .sort({ totalXP: -1, solvedSlugs: -1 })
      .limit(500)            // cap at top 500 — enough for any college leaderboard
      .select("username displayName totalXP solvedSlugs currentStreak solvedDifficulty email joinedDate")
      .lean();

    // Compute level + medal server-side
    const ranked = users.map((u, i) => ({
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

    globalCache   = ranked;
    globalCacheAt = now;

    const slice = ranked.slice(skip, skip + limit);
    return res.json({ users: slice, total: ranked.length, page, limit });

  } catch (err) {
    console.error("[Leaderboard] global error:", err.message);
    return res.status(500).json({ error: "Failed to load leaderboard." });
  }
});

// ── GET /api/leaderboard/college?domain=marwadiuniversity.ac.in ─────────────
router.get("/college", async (req, res) => {
  try {
    const domain = (req.query.domain || "").toLowerCase().trim();
    const now    = Date.now();

    if (!domain) {
      return res.status(400).json({ error: "domain query param required." });
    }

    // Cache per domain
    if (collegeCache[domain] && now - collegeCacheAt < CACHE_TTL) {
      return res.json(collegeCache[domain]);
    }

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

    const result = { domain, users: ranked, total: ranked.length };
    collegeCache[domain] = result;
    collegeCacheAt       = now;

    return res.json(result);

  } catch (err) {
    console.error("[Leaderboard] college error:", err.message);
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
    return res.status(500).json({ error: "Failed to load domains." });
  }
});

export default router;
