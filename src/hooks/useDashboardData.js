import { useMemo } from "react";
import { useAppContext } from "./useAppContext";

function useDashboardData() {
  const {
    solvedProblems,
    activityDates,
    recentActivity,
    solvedDifficulty,
    currentStreak,
    topicStats,
  } = useAppContext();

  const badges = useMemo(() => {
    const list = [];

    if ((solvedDifficulty.easy ?? 0) > 0) {
      list.push("Beginner 🟢");
    }

    if ((solvedDifficulty.medium ?? 0) > 0) {
      list.push("Intermediate 🟡");
    }

    if ((solvedDifficulty.hard ?? 0) > 0) {
      list.push("Advanced 🔴");
    }

    if (currentStreak >= 7) {
      list.push("7 Day Streak 🔥");
    }

    return list;
  }, [solvedDifficulty, currentStreak]);

  const recommendation = useMemo(() => {
    if (solvedProblems.length < 3) {
      return "Start solving more problems consistently.";
    }

    if (currentStreak < 3) {
      return "Build a stronger daily streak.";
    }

    if ((solvedDifficulty.hard ?? 0) === 0) {
      return "Try solving Hard problems.";
    }

    return "Excellent progress. Keep going.";
  }, [
    solvedProblems,
    currentStreak,
    solvedDifficulty,
  ]);

  const today = new Date()
    .toISOString()
    .split("T")[0];

  const dailySolved =
    activityDates.includes(today)
      ? 1
      : 0;

  return {
    streak: currentStreak,
    badges,
    recommendation,
    dailySolved,
    recentActivity,
    codeClubSolved: solvedProblems.length,
    topicStats,
  };
}

export default useDashboardData;