/**
 * useAnalyticsStats.js
 *
 * All the derived-stat computation behind the Analytics page: rank/level,
 * acceptance rate, average runtime, language usage, strongest topic,
 * 8-week solve velocity, and topic-coverage radar data.
 *
 * Extracted from src/pages/Analytics.jsx (Staff review §4/§9/#12) — pure
 * derivations from context data, so this hook takes plain values in and
 * returns plain values out; no side effects, no fetching.
 */
import { useMemo } from "react";

export function useAnalyticsStats({ solvedProblems, submissions, topicStats, recentActivity }) {
  const level = solvedProblems.length;

  const rank = useMemo(() => {
    if (level < 5) return "Beginner";
    if (level < 15) return "Learner";
    if (level < 30) return "Intermediate";
    if (level < 60) return "Advanced";
    return "Expert";
  }, [level]);

  const acceptanceRate = useMemo(() => {
    if (submissions.length === 0) return 0;
    const accepted = submissions.filter((s) => s.status === "Accepted").length;
    return ((accepted / submissions.length) * 100).toFixed(1);
  }, [submissions]);

  const averageRuntime = useMemo(() => {
    const acceptedSubmissions = submissions.filter((s) => s.status === "Accepted");
    if (acceptedSubmissions.length === 0) return 0;

    const total = acceptedSubmissions.reduce(
      (sum, s) => sum + Number(s.executionTime || 0),
      0
    );
    return (total / acceptedSubmissions.length).toFixed(2);
  }, [submissions]);

  const languageStats = useMemo(() => {
    const stats = {};
    submissions.forEach((s) => {
      const language = s.language || "unknown";
      stats[language] = (stats[language] || 0) + 1;
    });
    return stats;
  }, [submissions]);

  const favoriteLanguage = useMemo(
    () => Object.keys(languageStats).sort((a, b) => languageStats[b] - languageStats[a])[0] || "N/A",
    [languageStats]
  );

  const strongestTopic = useMemo(
    () => Object.keys(topicStats).sort((a, b) => topicStats[b] - topicStats[a])[0] || null,
    [topicStats]
  );

  // Solve velocity: problems solved per week for last 8 weeks
  const velocityData = useMemo(() => {
    const weeks = [];
    const now = new Date();
    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - i * 7);
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);

      const count = (recentActivity || []).filter((a) => {
        const d = new Date(a.time);
        return d >= weekStart && d < weekEnd;
      }).length;

      weeks.push({ week: `W${8 - i}`, solved: count });
    }
    return weeks;
  }, [recentActivity]);

  // Topic radar data
  const radarData = useMemo(() => {
    const entries = Object.entries(topicStats || {})
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
    return entries.map(([topic, count]) => ({
      topic: topic.length > 12 ? topic.slice(0, 12) + "…" : topic,
      count,
    }));
  }, [topicStats]);

  return {
    level,
    rank,
    acceptanceRate,
    averageRuntime,
    languageStats,
    favoriteLanguage,
    strongestTopic,
    velocityData,
    radarData,
  };
}
