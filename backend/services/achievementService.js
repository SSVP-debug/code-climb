import { ACHIEVEMENTS } from "../config/achievements.js";

export function evaluateAchievements(user) {
  const unlocked = [];

  const existing = new Set(
    (user.achievements || []).map(
      (a) => a.key
    )
  );

  // First Solve
  if (
    user.solvedSlugs.length >= 1 &&
    !existing.has(
      ACHIEVEMENTS.FIRST_SOLVE
    )
  ) {
    unlocked.push(
      ACHIEVEMENTS.FIRST_SOLVE
    );
  }

  // First Hard
  if (
    (user.solvedDifficulty?.hard || 0) >= 1 &&
    !existing.has(
      ACHIEVEMENTS.FIRST_HARD
    )
  ) {
    unlocked.push(
      ACHIEVEMENTS.FIRST_HARD
    );
  }

  // 7 Day Streak
  if (
    (user.currentStreak || 0) >= 7 &&
    !existing.has(
      ACHIEVEMENTS.STREAK_7
    )
  ) {
    unlocked.push(
      ACHIEVEMENTS.STREAK_7
    );
  }

  // 25 Solves
  if (
    (user.solvedSlugs?.length || 0) >= 25 &&
    !existing.has(
      ACHIEVEMENTS.SOLVE_25
    )
  ) {
    unlocked.push(
      ACHIEVEMENTS.SOLVE_25
    );
  }

  // 50 Solves
  if (
    (user.solvedSlugs?.length || 0) >= 50 &&
    !existing.has(
      ACHIEVEMENTS.SOLVE_50
    )
  ) {
    unlocked.push(
      ACHIEVEMENTS.SOLVE_50
    );
  }

  // Topic Master (10 solves in one topic)
  const topicStats =
    user.topicStats instanceof Map
      ? Object.fromEntries(user.topicStats)
      : user.topicStats || {};

  const topicCounts =
    Object.values(topicStats);

  if (
    topicCounts.some(
      (count) => count >= 10
    ) &&
    !existing.has(
      ACHIEVEMENTS.TOPIC_MASTER_10
    )
  ) {
    unlocked.push(
      ACHIEVEMENTS.TOPIC_MASTER_10
    );
  }

  return unlocked;
}