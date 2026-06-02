import { useEffect, useMemo, useState } from "react";
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

  // ── Derived values ────────────────────────────────────────────────────
  // Keys must be capitalized: "Easy" | "Medium" | "Hard"
  const earnedBadges = useMemo(() => {
    const badges = [];
    if (solvedDifficulty.Easy >= 1)   badges.push("Beginner 🟢");
    if (solvedDifficulty.Medium >= 1) badges.push("Intermediate 🟡");
    if (solvedDifficulty.Hard >= 1)   badges.push("Advanced 🔴");
    return badges;
  }, [solvedDifficulty]);

  const recommendation = useMemo(() => {
    if (solvedProblems.length < 3) {
      return "Start solving more Easy problems consistently.";
    }
    if (activityDates.length < 3) {
      return "Build a stronger daily solving streak.";
    }
    if (solvedDifficulty.Hard === 0) {
      return "Try solving Hard problems to level up.";
    }
    return "Excellent progress! Keep pushing consistency.";
  }, [solvedProblems, activityDates, solvedDifficulty]);

  const today = new Date().toISOString().split("T")[0];
  const dailySolved = activityDates.includes(today) ? 1 : 0;

  // ── LeetCode stats fetch ──────────────────────────────────────────────
  useEffect(() => {
    async function getStats() {
      if (!username?.trim()) {
        setStats(null);
        setError("");
        return;
      }

      setLoading(true);
      setError("");

      try {
        const data = await fetchLeetCodeStats(username);

        if (data && data.solvedProblem !== undefined) {
          setStats(data);
          localStorage.setItem(PROGRESS_KEYS.leetcodeUsername, username);
        } else {
          setStats(null);
          setError("Unable to fetch LeetCode stats right now.");
        }
      } catch (err) {
        console.error("[useDashboardData] LeetCode fetch failed:", err);
        setError("Something went wrong fetching LeetCode stats.");
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
