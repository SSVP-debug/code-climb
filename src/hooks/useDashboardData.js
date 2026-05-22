import { useEffect, useState } from "react";
import { fetchLeetCodeStats } from "../services/leetcode";

function useDashboardData(username) {

    const [stats, setStats] = useState(null);

    const [loading, setLoading] =
        useState(false);

    const [error, setError] = useState("");
    const [codeClimbSolved, setCodeClimbSolved] =
        useState(0);

    const [streak, setStreak] =
        useState(0);

    const [recentActivity, setRecentActivity] =
        useState([]);

    const [badges, setBadges] =
        useState([]);

    const [recommendation, setRecommendation] =
        useState("");

    const [dailySolved, setDailySolved] =
        useState(0);

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

                const data =
                    await fetchLeetCodeStats(username);

                if (
                    data &&
                    data.solvedProblem !== undefined
                ) {

                    setStats(data);

                    localStorage.setItem(
                        "leetcodeUsername",
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
        // Native Solved Problems
        const solvedProblems =
            JSON.parse(
                localStorage.getItem(
                    "codeclimbSolved"
                )
            ) || [];

        setCodeClimbSolved(
            solvedProblems.length
        );

        // Streak
        const activityDates =
            JSON.parse(
                localStorage.getItem(
                    "activityDates"
                )
            ) || [];

        setStreak(activityDates.length);

        // Recent Activity
        const activity =
            JSON.parse(
                localStorage.getItem(
                    "recentActivity"
                )
            ) || [];

        setRecentActivity(activity);

        // Daily Goal
        const todayKey =
            `dailySolved-${new Date().toLocaleDateString()}`;

        const solvedToday =
            Number(localStorage.getItem(todayKey)) || 0;

        setDailySolved(solvedToday);

        // Badges
        const solvedDifficulty =
            JSON.parse(
                localStorage.getItem(
                    "solvedDifficulty"
                )
            ) || {
                easy: 0,
                medium: 0,
                hard: 0,
            };

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

        setBadges(earnedBadges);

        // Recommendation
        if (solvedProblems.length < 3) {

            setRecommendation(
                "Start solving more Easy problems consistently."
            );

        } else if (activityDates.length < 3) {

            setRecommendation(
                "Build a stronger daily solving streak."
            );

        } else if (
            solvedDifficulty.hard === 0
        ) {

            setRecommendation(
                "Try solving Hard problems to level up."
            );

        } else {

            setRecommendation(
                "Excellent progress! Keep pushing consistency."
            );

        }

    }, [username]);

    return {
        stats,
        loading,
        error,
        setStats,
        streak,
        badges,
        recommendation,
        dailySolved,
        recentActivity,
        codeClimbSolved,
    };
}

export default useDashboardData;