import { calculateStreak } from "../utils/calculateStreak.js";
import { evaluateAchievements } from "../services/achievementService.js";
import { computeXPFromSlugs, buildDifficultyMap, XP_BY_DIFFICULTY } from "../utils/computeXP.js";
import Problem from "../models/Problem.js";
import { invalidateLeaderboardCaches } from "../routes/leaderboard.js";
import { invalidateProfileCache } from "./publicProfileController.js";
import { invalidateTpoCache } from "../routes/tpo.js";
import { createNotification } from "../services/notificationService.js";
import { logger } from "../config/logger.js";
import { topicStatsToObject, topicStatsFromObject } from "../utils/topicStats.js";

// ── Helpers ────────────────────────────────────────────────────────────────────

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
    topicStats: topicStatsToObject(user.topicStats),
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
      leetcodeUsername,
      // totalXP is intentionally NOT destructured — it comes from the client
      // but is ignored. XP is always recomputed server-side below.
      //
      // solvedSlugs / topicStats / activityDates / solvedDifficulty /
      // recentActivity are ALSO not trusted from the body anymore — see
      // req.verifiedNewSlugs below. They used to be applied directly
      // (`req.userDoc.solvedSlugs = solvedSlugs`), which meant any
      // authenticated client could PUT an arbitrary solved-problem list
      // and have it saved verbatim, without ever running code through the
      // judge. docs/security-fixes/2026-07-solve-integrity.md has the full
      // writeup; the short version is: this endpoint now only ever adds a
      // slug to solvedSlugs if routes/progress.js's verifyAgainstSubmissions
      // middleware found a matching `Submission` with status "Accepted" for
      // this user — and that Submission can only have been created by
      // routes/judge.js, from a real Judge0-graded run.
    } = req.body;

    // ── Apply verified solves only ──────────────────────────────────────────
    // req.verifiedNewSlugs (set by verifyAgainstSubmissions in
    // routes/progress.js) is the subset of the client's claimed solvedSlugs
    // that this server independently confirmed via a real Accepted
    // Submission. Anything the client claimed without one was already
    // dropped (and logged) before we got here.
    const newSlugs = (req.verifiedNewSlugs || []).filter(
      (slug) => !req.userDoc.solvedSlugs.includes(slug)
    );

    if (newSlugs.length > 0) {
      // Topic/difficulty/title come from the Problem catalog, not the
      // client — closes the same trust gap for topicStats/solvedDifficulty/
      // recentActivity that solvedSlugs had (a client could otherwise claim
      // a Hard problem was Easy, or attribute it to a topic it isn't, to
      // skew stats independently of the solvedSlugs check above).
      const problems = await Problem.find({ slug: { $in: newSlugs } })
        .select("slug topic difficulty title")
        .lean();
      const bySlug = new Map(problems.map((p) => [p.slug, p]));

      const today = new Date().toISOString().split("T")[0];
      const nextTopicStats = topicStatsToObject(req.userDoc.topicStats);
      const nextSolvedDifficulty = {
        easy: req.userDoc.solvedDifficulty?.easy || 0,
        medium: req.userDoc.solvedDifficulty?.medium || 0,
        hard: req.userDoc.solvedDifficulty?.hard || 0,
      };
      const nextRecentActivity = [...(req.userDoc.recentActivity || [])];

      for (const slug of newSlugs) {
        const problem = bySlug.get(slug);
        // Shouldn't happen (routes/progress.js's validateSlugs already
        // confirmed the slug exists) — skip defensively rather than throw.
        if (!problem) continue;

        req.userDoc.solvedSlugs.push(slug);

        if (problem.topic) {
          nextTopicStats[problem.topic] = (nextTopicStats[problem.topic] || 0) + 1;
        }

        const diffKey = (problem.difficulty || "").toLowerCase();
        if (diffKey in nextSolvedDifficulty) {
          nextSolvedDifficulty[diffKey] += 1;
        }

        nextRecentActivity.unshift({ title: problem.title, time: today });
      }

      req.userDoc.topicStats = topicStatsFromObject(nextTopicStats);
      req.userDoc.solvedDifficulty = nextSolvedDifficulty;
      req.userDoc.recentActivity = nextRecentActivity.slice(0, 10);

      // activityDates/streak: today is provably a solving day (we just
      // verified at least one new Accepted submission), so — and only
      // so — it's safe to add. A client can no longer backfill arbitrary
      // past dates to inflate a streak.
      const activityDates = new Set(req.userDoc.activityDates || []);
      activityDates.add(today);
      req.userDoc.activityDates = [...activityDates];

      const { currentStreak, longestStreak } = calculateStreak(req.userDoc.activityDates);
      req.userDoc.currentStreak = currentStreak;
      req.userDoc.longestStreak = Math.max(req.userDoc.longestStreak || 0, longestStreak);
      req.userDoc.lastActivityDate = today;
    }

    if (leetcodeUsername !== undefined) {
      req.userDoc.leetcodeUsername = leetcodeUsername;
    }

    // ── Server-side XP recomputation ──────────────────────────────────────
    // Always recompute from the (now fully verified) solved slugs — never
    // trust client-supplied XP.
    const freshXP = await recomputeXP(req.userDoc.solvedSlugs);
    if (freshXP !== null) {
      req.userDoc.totalXP = freshXP;
    }

    // ── Achievement evaluation ─────────────────────────────────────────────
    const newlyUnlocked = evaluateAchievements(req.userDoc);
    const existing = new Set(
      req.userDoc.achievements.map((a) => a.key)
    );
    const newlyAwardedKeys = [];

    for (const key of newlyUnlocked) {
      if (!existing.has(key)) {
        req.userDoc.achievements.push({
          key,
          unlockedAt: new Date(),
        });
        newlyAwardedKeys.push(key);
      }
    }

    await req.userDoc.save();

    // One notification per newly-unlocked achievement (a single solve can
    // trigger more than one, e.g. crossing both a solve-count and a streak
    // milestone at once — each is worth its own entry in the feed, not a
    // combined one). Title/message are deliberately generic here — the
    // frontend resolves the real title/icon from the achievement key via
    // ACHIEVEMENT_METADATA (the single source of truth for achievement
    // display text) rather than duplicating that data on the backend too.
    for (const key of newlyAwardedKeys) {
      createNotification({
        userId: req.userDoc._id,
        type: "achievement",
        title: "Achievement unlocked!",
        message: "You unlocked a new achievement — check it out on your profile.",
        link: "/profile",
        meta: { achievementKey: key },
      }).catch((err) =>
        req.log.warn({ err, key }, "[Progress] Achievement notification failed")
      );
    }

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