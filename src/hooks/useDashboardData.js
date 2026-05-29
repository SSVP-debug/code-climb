import { useEffect, useState } from "react";
import { fetchLeetCodeStats } from "../services/leetcode";
import { PROGRESS_KEYS } from "../constants/progressKeys";
import { useAppContext } from "./useAppContext";

function useDashboardData(username) {
  const {
    solvedProblems,
    activityDates,
    recentActivity,
    solvedDifficulty,
  } = useAppContext();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const earnedBadges = [];

  if (solvedDifficulty.easy >= 1) {
    earnedBadges.push("Beginner 🟢");
  }

  if (solvedDifficulty.medium >= 1) {
    earnedBadges.push("Intermediate 🟡");
  }

  if (solvedDifficulty.hard >= 1) {
    earnedBadges.push("Advanced 🔴");
  }

  let recommendation =
    "Excellent progress! Keep pushing consistency.";

  if (solvedProblems.length < 3) {
    recommendation =
      "Start solving more Easy problems consistently.";
  } else if (activityDates.length < 3) {
    recommendation =
      "Build a stronger daily solving streak.";
  } else if (solvedDifficulty.hard === 0) {
    recommendation =
      "Try solving Hard problems to level up.";
  }

  const today = new Date().formatDate(...);
  const dailySolved = activityDates.includes(today)
    ? 1
    : 0;

  useEffect(() => {
    async function getStats() {
      if (!username.trim()) {
        setStats(null);
        setError("");
        return;
      }

      try {
        setLoading(true);
        setError("");

        const data = await fetchLeetCodeStats(username);

        if (data && data.solvedProblem !== undefined) {
          setStats(data);
          localStorage.setItem(
            PROGRESS_KEYS.leetcodeUsername,
            username
          );
        } else {
          setStats(null);
          setError(
            "Unable to fetch LeetCode stats right now"
          );
        }
      } catch (err) {
        console.error(err);
        setError("Something went wrong");
      } finally {
        setLoading(false);
      }
    }

    getStats();
  }, [username]);

  return {
    stats,
    loading,
    error,
    setStats,
    streak: activityDates.length,
    badges: earnedBadges,
    recommendation,
    dailySolved,
    recentActivity,
    codeClimbSolved: solvedProblems.length,
  };
}

export default useDashboardData;
