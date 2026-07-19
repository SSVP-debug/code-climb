import User from "../models/User.js";

/**
 * Persist progress fields.
 * Currently the User model remains the source of truth.
 * This service exists so the controller won't need to change
 * when progress is later extracted into its own model.
 */
export async function saveProgress(userId, progress) {
  return User.updateOne(
    { _id: userId },
    {
      $set: {
        solvedSlugs: progress.solvedSlugs,
        topicStats: progress.topicStats,
        activityDates: progress.activityDates,
        solvedDifficulty: progress.solvedDifficulty,
        recentActivity: progress.recentActivity,
        currentStreak: progress.currentStreak,
        longestStreak: progress.longestStreak,
        lastActivityDate: progress.lastActivityDate,
        totalXP: progress.totalXP,
        achievements: progress.achievements,
      },
    }
  );
}