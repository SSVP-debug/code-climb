/**
 * LeetCode solve-history import (commit 096).
 *
 * GET /api/leetcode/fetch?username=X — server-side proxy to the unofficial
 *   alfa-leetcode-api.onrender.com. Proxied through the backend (rather than
 *   called directly from the browser, which is how the orphaned
 *   src/services/leetcode.js originally did it) for two reasons: one place
 *   to handle timeouts/errors instead of duplicating that in every client,
 *   and it keeps a third-party dependency we don't control off the
 *   browser's direct network path.
 *
 * PUT /api/leetcode/stats — save stats, either manually entered or
 *   fetched-then-confirmed by the student. Single write path for both —
 *   there's no meaningful difference to the data model between "I typed
 *   these numbers in" and "I fetched them and clicked confirm," so no
 *   reason to have two save endpoints.
 *
 * IMPORTANT — does NOT touch totalXP/solvedSlugs: LeetCode's problem set
 * isn't this platform's catalog, there's no slug mapping between them, and
 * awarding this platform's XP for problems solved elsewhere would violate
 * the "totalXP always computed server-side from solvedSlugs" invariant
 * (see progressController.js). This is display-only, recruiter-facing
 * supplementary info on the public profile — not gamification.
 */
import { Router } from "express";
import { invalidateProfileCache } from "../controllers/publicProfileController.js";

const router = Router();

const FETCH_TIMEOUT_MS = 8000;

// ── GET /api/leetcode/fetch?username=X ──────────────────────────────────────
router.get("/fetch", async (req, res) => {
  const username = (req.query.username || "").trim();

  if (!username) {
    return res.status(400).json({ error: "username query param required." });
  }
  if (!/^[a-zA-Z0-9_-]{1,50}$/.test(username)) {
    return res.status(400).json({ error: "Invalid username format." });
  }

  try {
    const response = await fetch(
      `https://alfa-leetcode-api.onrender.com/${encodeURIComponent(username)}/solved`,
      { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) }
    );

    if (!response.ok) {
      req.log.warn(
        { username, httpStatus: response.status },
        "[LeetCode] Unofficial API returned non-OK status"
      );
      return res.status(502).json({
        error: "Couldn't reach LeetCode's stats service right now — you can still enter your numbers manually below.",
      });
    }

    const data = await response.json();

    // The unofficial API's field names have drifted between versions in
    // the past — normalize a couple of known variants defensively rather
    // than assuming one exact shape and silently passing through garbage
    // if it doesn't match.
    const easySolved   = Number(data.easySolved   ?? data.easy   ?? 0) || 0;
    const mediumSolved = Number(data.mediumSolved ?? data.medium ?? 0) || 0;
    const hardSolved   = Number(data.hardSolved   ?? data.hard   ?? 0) || 0;
    const totalSolved  = Number(data.solvedProblem ?? (easySolved + mediumSolved + hardSolved)) || 0;

    if (easySolved === 0 && mediumSolved === 0 && hardSolved === 0 && totalSolved === 0) {
      // Could be a real zero-solve account, or could be the API silently
      // returning an unrecognized shape (e.g. a "user not found" JSON body
      // with a 200 status, which this particular API has done before) —
      // either way, let the student see the raw zero and decide, rather
      // than guessing on their behalf.
      req.log.warn({ username, raw: data }, "[LeetCode] Parsed all-zero stats — possibly an unrecognized response shape");
    }

    return res.json({ username, easySolved, mediumSolved, hardSolved, totalSolved });
  } catch (err) {
    req.log.warn({ err, username }, "[LeetCode] Fetch failed");
    return res.status(502).json({
      error: "Couldn't reach LeetCode's stats service right now — you can still enter your numbers manually below.",
    });
  }
});

// ── PUT /api/leetcode/stats ──────────────────────────────────────────────
router.put("/stats", async (req, res) => {
  try {
    if (!req.userDoc) return res.status(503).json({ error: "Database unavailable." });

    const { username, easySolved, mediumSolved, hardSolved, source } = req.body;

    const easy   = Math.max(0, parseInt(easySolved)   || 0);
    const medium = Math.max(0, parseInt(mediumSolved) || 0);
    const hard   = Math.max(0, parseInt(hardSolved)   || 0);

    // Sanity cap — LeetCode's entire catalog is a few thousand problems;
    // reject obviously-fabricated numbers rather than silently storing them
    // on a page recruiters will see.
    if (easy > 5000 || medium > 5000 || hard > 5000) {
      return res.status(400).json({ error: "Those numbers look off — please double check." });
    }

    if (username && typeof username === "string") {
      req.userDoc.leetcodeUsername = username.trim().slice(0, 100);
    }

    req.userDoc.leetcodeStats = {
      easySolved: easy,
      mediumSolved: medium,
      hardSolved: hard,
      totalSolved: easy + medium + hard,
      source: source === "api" ? "api" : "manual",
      lastSyncedAt: new Date(),
    };

    await req.userDoc.save();

    if (req.userDoc.username) {
      invalidateProfileCache(req.userDoc.username).catch((err) =>
        req.log.warn({ err }, "[LeetCode] Profile cache invalidation failed")
      );
    }

    return res.json({ leetcodeStats: req.userDoc.leetcodeStats });
  } catch (err) {
    req.log.error({ err }, "[LeetCode] Save stats failed");
    return res.status(500).json({ error: "Failed to save LeetCode stats." });
  }
});

export default router;