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
import { getLevel, getLevelProgress } from "../utils/xpLevel";
import { getStatusMeta } from "../utils/statusMessages";

export function useAnalyticsStats({ solvedProblems, submissions, topicStats, recentActivity, totalXP = 0 }) {
  // Audit fix: this used to be `solvedProblems.length` labeled as "level" —
  // a raw solved-problem count fed into the same Beginner..Expert threshold
  // table Profile.jsx uses for its (correctly) XP-based level. Two users
  // with the same solved count but very different XP (e.g. all-Easy vs.
  // all-Hard) would get the same Analytics rank but different Profile
  // levels. Now both pages derive `level` from the same xpLevel.js curve
  // the backend also uses, so rank/level agree everywhere.
  const level = getLevel(totalXP);

  // Same curve Profile.jsx's hero XP bar reads from — kept here too so
  // Analytics' identity card can show "X / Y XP to next level" without
  // Profile and Analytics silently drifting onto two different formulas.
  const { current: xpCurrent, needed: xpNeeded, percent: xpPercent } = getLevelProgress(totalXP);

  const rank = useMemo(() => {
    if (level < 5) return "Beginner";
    if (level < 15) return "Learner";
    if (level < 30) return "Intermediate";
    if (level < 60) return "Advanced";
    return "Expert";
  }, [level]);

  const acceptanceRate = useMemo(() => {
    // Audit fix: this used to divide by submissions.length unconditionally,
    // so a "Judge Error" or "Runner Unavailable" verdict (Code Club's own
    // execution service failing, not the student's code) silently counted
    // against them — dragging accuracy down for something outside their
    // control. Infra-kind verdicts are excluded from both sides of the
    // ratio entirely, same as if the attempt never happened.
    const gradable = submissions.filter((s) => getStatusMeta(s.status).kind !== "infra");
    if (gradable.length === 0) return 0;
    const accepted = gradable.filter((s) => s.status === "Accepted").length;
    return ((accepted / gradable.length) * 100).toFixed(1);
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

  const totalSubmissions = submissions.length;

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
    totalSubmissions,
    xpCurrent,
    xpNeeded,
    xpPercent,
  };
}