import { calculateStreak } from "../utils/calculateStreak.js";
import { evaluateAchievements } from "../services/achievementService.js";
function mapTopicStats(topicStats) {
  if (topicStats instanceof Map) {
    return Object.fromEntries(topicStats);
  }

  return topicStats || {};
}

export function progressToClient(user) {
  return {
    solvedSlugs: user.solvedSlugs || [],
    topicStats: mapTopicStats(user.topicStats),
    activityDates: user.activityDates || [],
    achievements:
      user.achievements || [],
    dailyChallengeHistory:
      user.dailyChallengeHistory || [],
    solvedDifficulty: user.solvedDifficulty || {
      easy: 0,
      medium: 0,
      hard: 0,
    },
    recentActivity: user.recentActivity || [],

    currentStreak: user.currentStreak || 0,
    longestStreak: user.longestStreak || 0,
    lastActivityDate: user.lastActivityDate || null,
    totalXP: user.totalXP || 0,

    joinedDate: user.joinedDate,
    leetcodeUsername: user.leetcodeUsername || "",
  };
}

export async function getProgress(req, res) {
  const payload = progressToClient(req.userDoc);
  console.log("[XP-TRACE 8b] getProgress progressToClient totalXP", payload.totalXP);
  res.json(payload);
}

export async function putProgress(req, res) {
  console.log("[XP-TRACE 6] progressController.putProgress req.body.totalXP", req.body.totalXP);
  try {
    const {
      solvedSlugs,
      topicStats,
      activityDates,
      solvedDifficulty,
      recentActivity,
      leetcodeUsername,
      totalXP,
    } = req.body;
    console.log(
      "[XP-TRACE] controller received:",
      totalXP
    );

    if (!req.userDoc) {
      return res.status(503).json({
        error: "Database unavailable",
      });
    }

    if (Array.isArray(solvedSlugs)) {
      req.userDoc.solvedSlugs = solvedSlugs;
    }

    if (Array.isArray(activityDates)) {
      req.userDoc.activityDates = activityDates;

      const {
        currentStreak,
        longestStreak,
      } = calculateStreak(activityDates);

      req.userDoc.currentStreak = currentStreak;
      req.userDoc.longestStreak = Math.max(
        req.userDoc.longestStreak || 0,
        longestStreak
      );

      req.userDoc.lastActivityDate =
        activityDates[activityDates.length - 1] || null;
    }

    if (topicStats && typeof topicStats === "object") {
      req.userDoc.topicStats = new Map(
        Object.entries(topicStats)
      );
    }

    if (Array.isArray(activityDates)) {
      req.userDoc.activityDates = activityDates;
    }

    if (solvedDifficulty && typeof solvedDifficulty === "object") {
      req.userDoc.solvedDifficulty = {
        easy: solvedDifficulty.easy ?? 0,
        medium: solvedDifficulty.medium ?? 0,
        hard: solvedDifficulty.hard ?? 0,
      };
    }

    if (Array.isArray(solvedSlugs)) {
      req.userDoc.solvedSlugs = solvedSlugs;
    }

    if (Array.isArray(recentActivity)) {
      req.userDoc.recentActivity = recentActivity.slice(0, 10);
    }

    if (leetcodeUsername !== undefined) {
      req.userDoc.leetcodeUsername = leetcodeUsername;
    }

    const newlyUnlocked =
      evaluateAchievements(req.userDoc);

    for (const key of newlyUnlocked) {
      req.userDoc.achievements.push({
        key,
        unlockedAt: new Date(),
      });
    }
    if (
      typeof totalXP === "number"
    ) {
      req.userDoc.totalXP =
        totalXP;
    }

    console.log("[XP-TRACE 7] before save req.userDoc.totalXP", req.userDoc.totalXP, "destructured totalXP", totalXP);
    
    await req.userDoc.save();


    console.log("[XP-TRACE 8] after save userDoc.totalXP", req.userDoc.totalXP);
    console.log("BEFORE SAVE USERDOC:", {
      solvedSlugs: req.userDoc.solvedSlugs,
      topicStats: req.userDoc.topicStats,
      activityDates: req.userDoc.activityDates,
      solvedDifficulty: req.userDoc.solvedDifficulty,
      currentStreak: req.userDoc.currentStreak,
      longestStreak: req.userDoc.longestStreak,
      lastActivityDate: req.userDoc.lastActivityDate,
      newAchievements: newlyUnlocked,
    });

    res.json(progressToClient(req.userDoc));
  } catch (err) {
    console.error("PUT PROGRESS ERROR:", err);
    res.status(500).json({
      error: err.message,
      stack: err.stack,
    });
  }
}
