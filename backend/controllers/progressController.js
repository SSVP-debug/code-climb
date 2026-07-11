import { calculateStreak } from "../utils/calculateStreak.js";
import { evaluateAchievements } from "../services/achievementService.js";
import { computeXPFromSlugs, buildDifficultyMap, XP_BY_DIFFICULTY } from "../utils/computeXP.js";
import Problem from "../models/Problem.js";
import { invalidateLeaderboardCaches } from "../routes/leaderboard.js";
import { invalidateProfileCache } from "./publicProfileController.js";
import { invalidateTpoCache } from "../routes/tpo.js";
import { logger } from "../config/logger.js";

// ── Helpers ────────────────────────────────────────────────────────────────────

function mapTopicStats(topicStats) {
  if (topicStats instanceof Map) return Object.fromEntries(topicStats);
  return topicStats || {};
}

/**
 * Compute a user's total XP server-side from their solvedSlugs.
 * Falls back to querying MongoDB for the difficulty map.
 * Returns 0 if the query fails — never crashes.
 */
async function recomputeXP(solvedSlugs) {
  if (!solvedSlugs || solvedSlugs.length === 0) return 0;

  try {
    const problems = await Problem
      .find({ slug: { $in: solvedSlugs } })
      .select("slug difficulty")
      .lean();

    const difficultyMap = buildDifficultyMap(problems);
    return computeXPFromSlugs(solvedSlugs, difficultyMap);
  } catch (err) {
    logger.error({ err }, "[Progress] XP recompute failed");
    return null; // null = keep existing, don't overwrite
  }
}

// ── Public serialiser ──────────────────────────────────────────────────────────

export function progressToClient(user) {
  return {
    solvedSlugs: user.solvedSlugs || [],
    topicStats: mapTopicStats(user.topicStats),
    activityDates: user.activityDates || [],
    achievements: user.achievements || [],
    dailyChallengeHistory: user.dailyChallengeHistory || [],
    solvedDifficulty: user.solvedDifficulty || { easy: 0, medium: 0, hard: 0 },
    recentActivity: user.recentActivity || [],
    currentStreak: user.currentStreak || 0,
    longestStreak: user.longestStreak || 0,
    lastActivityDate: user.lastActivityDate || null,
    totalXP: user.totalXP || 0,
    joinedDate: user.joinedDate,
    leetcodeUsername: user.leetcodeUsername || "",
  };
}

// ── Route handlers ─────────────────────────────────────────────────────────────

export async function getProgress(req, res) {
  return res.json(progressToClient(req.userDoc));
}

export async function putProgress(req, res) {
  try {
    if (!req.userDoc) {
      return res.status(503).json({ error: "Database unavailable" });
    }

    const {
      solvedSlugs,
      topicStats,
      activityDates,
      solvedDifficulty,
      recentActivity,
      leetcodeUsername,
      // totalXP is intentionally NOT destructured — it comes from the client
      // but is ignored. XP is always recomputed server-side below.
    } = req.body;

    // ── Apply each field only if present in the request body ──────────────

    if (Array.isArray(solvedSlugs)) {
      req.userDoc.solvedSlugs = solvedSlugs;
    }

    if (Array.isArray(activityDates)) {
      req.userDoc.activityDates = activityDates;

      const { currentStreak, longestStreak } = calculateStreak(activityDates);
      req.userDoc.currentStreak = currentStreak;
      req.userDoc.longestStreak = Math.max(req.userDoc.longestStreak || 0, longestStreak);
      req.userDoc.lastActivityDate = activityDates[activityDates.length - 1] || null;
    }

    if (topicStats && typeof topicStats === "object") {
      req.userDoc.topicStats = new Map(Object.entries(topicStats));
    }

    if (solvedDifficulty && typeof solvedDifficulty === "object") {
      req.userDoc.solvedDifficulty = {
        easy: solvedDifficulty.easy ?? 0,
        medium: solvedDifficulty.medium ?? 0,
        hard: solvedDifficulty.hard ?? 0,
      };
    }

    if (Array.isArray(recentActivity)) {
      req.userDoc.recentActivity = recentActivity.slice(0, 10);
    }

    if (leetcodeUsername !== undefined) {
      req.userDoc.leetcodeUsername = leetcodeUsername;
    }

    // ── Server-side XP recomputation ──────────────────────────────────────
    // Always recompute from the solved slugs — never trust client-supplied XP.
    const freshXP = await recomputeXP(req.userDoc.solvedSlugs);
    if (freshXP !== null) {
      req.userDoc.totalXP = freshXP;
    }

    // ── Achievement evaluation ─────────────────────────────────────────────
    const newlyUnlocked = evaluateAchievements(req.userDoc);
    const existing = new Set(
      req.userDoc.achievements.map((a) => a.key)
    );

    for (const key of newlyUnlocked) {
      if (!existing.has(key)) {
        req.userDoc.achievements.push({
          key,
          unlockedAt: new Date(),
        });
      }
    }

    await req.userDoc.save();

    // Invalidate caches so the leaderboard and this user's public profile
    // reflect the new XP/streak/solved count on the next request, instead
    // of waiting out the 5-minute (leaderboard) / 2-minute (profile) TTL.
    // Fire-and-forget deliberately — a cache-invalidation hiccup shouldn't
    // fail the user's actual progress save, which has already succeeded.
    invalidateLeaderboardCaches().catch((err) =>
      req.log.warn({ err }, "[Progress] Leaderboard cache invalidation failed")
    );
    if (req.userDoc.username) {
      invalidateProfileCache(req.userDoc.username).catch((err) =>
        req.log.warn({ err }, "[Progress] Profile cache invalidation failed")
      );
    }
    // A solve also changes their college's TPO dashboard/roster numbers —
    // invalidate that domain's cache too so a TPO isn't looking at stale
    // aggregates for up to 2 minutes after a student's college checks in.
    const emailDomain = req.userDoc.email?.split("@")[1];
    if (emailDomain) {
      invalidateTpoCache(emailDomain).catch((err) =>
        req.log.warn({ err }, "[Progress] TPO cache invalidation failed")
      );
    }

    const response = progressToClient(req.userDoc);
    if (newlyUnlocked.length > 0) {
      response.newAchievements = newlyUnlocked;
    }

    return res.json(response);

  } catch (err) {
    req.log.error({ err }, "[Progress] PUT error");

    return res.status(500).json({
      error: process.env.NODE_ENV === "production"
        ? "Internal Server Error"
        : err.message,
    });
  }
}