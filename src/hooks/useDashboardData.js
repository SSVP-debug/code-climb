import { useMemo } from "react";
import { useAppContext } from "./useAppContext";

function useDashboardData() {
  const {
    solvedProblems,
    activityDates,
    recentActivity,
    solvedDifficulty,
  } = useAppContext();

  const earnedBadges = useMemo(() => {
    const badges = [];
    if (solvedDifficulty.Easy   >= 1) badges.push("Beginner 🟢");
    if (solvedDifficulty.Medium >= 1) badges.push("Intermediate 🟡");
    if (solvedDifficulty.Hard   >= 1) badges.push("Advanced 🔴");
    return badges;
  }, [solvedDifficulty]);

  const recommendation = useMemo(() => {
    if (solvedProblems.length < 3)  return "Start solving more Easy problems consistently.";
    if (activityDates.length  < 3)  return "Build a stronger daily solving streak.";
    if (solvedDifficulty.Hard === 0) return "Try solving Hard problems to level up.";
    return "Excellent progress! Keep pushing consistency.";
  }, [solvedProblems, activityDates, solvedDifficulty]);

  const today      = new Date().toISOString().split("T")[0];
  const dailySolved = activityDates.includes(today) ? 1 : 0;

  return {
    streak:         activityDates.length,
    badges:         earnedBadges,
    recommendation,
    dailySolved,
    recentActivity,
    codeClubSolved: solvedProblems.length,
  };
}

export default useDashboardData;
