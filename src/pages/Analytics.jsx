import { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
} from "recharts";
import DashboardLayout from "../layouts/DashboardLayout";
import { useAppContext } from "../hooks/useAppContext";

function Analytics() {
  const {
    solvedProblems,
    submissions,
    topicStats,
    currentStreak,
    longestStreak,
    recentActivity,
  } = useAppContext();

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

    const accepted = submissions.filter(
      (s) => s.status === "Accepted"
    ).length;

    return (
      (accepted / submissions.length) *
      100
    ).toFixed(1);
  }, [submissions]);

  const averageRuntime = useMemo(() => {
    const acceptedSubmissions =
      submissions.filter(
        (s) =>
          s.status === "Accepted"
      );

    if (
      acceptedSubmissions.length === 0
    ) {
      return 0;
    }

    const total =
      acceptedSubmissions.reduce(
        (sum, s) =>
          sum +
          Number(
            s.executionTime || 0
          ),
        0
      );

    return (
      total /
      acceptedSubmissions.length
    ).toFixed(2);
  }, [submissions]);

  const languageStats = useMemo(() => {
    const stats = {};

    submissions.forEach((s) => {
      const language =
        s.language || "unknown";

      stats[language] =
        (stats[language] || 0) + 1;
    });

    return stats;
  }, [submissions]);

  const favoriteLanguage =
    Object.keys(languageStats).sort(
      (a, b) =>
        languageStats[b] -
        languageStats[a]
    )[0] || "N/A";

  const strongestTopic =
    Object.keys(topicStats).sort(
      (a, b) =>
        topicStats[b] -
        topicStats[a]
    )[0] || null;

  // ── Solve velocity: problems solved per week for last 8 weeks ────────────
  const velocityData = useMemo(() => {
    const weeks = [];
    const now = new Date();
    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - i * 7);
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);

      const count = (recentActivity || []).filter(a => {
        const d = new Date(a.time);
        return d >= weekStart && d < weekEnd;
      }).length;

      const label = `W${8 - i}`;
      weeks.push({ week: label, solved: count });
    }
    return weeks;
  }, [recentActivity]);

  // ── Topic radar data ──────────────────────────────────────────────────────
  const radarData = useMemo(() => {
    const entries = Object.entries(topicStats || {})
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
    return entries.map(([topic, count]) => ({
      topic: topic.length > 12 ? topic.slice(0, 12) + "…" : topic,
      count,
    }));
  }, [topicStats]);


  return (
    <DashboardLayout>
      <div className="space-y-8">

        <div>
          <h1 className="text-4xl font-bold">
            Analytics
          </h1>

          <p className="text-zinc-400 mt-2">
            Your coding performance at a glance
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <p className="text-zinc-400 text-sm">
              Rank
            </p>

            <h2 className="text-3xl font-bold mt-2">
              {rank}
            </h2>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <p className="text-zinc-400 text-sm">
              Level
            </p>

            <h2 className="text-3xl font-bold mt-2">
              {level}
            </h2>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <p className="text-zinc-400 text-sm">
              Acceptance Rate
            </p>

            <h2 className="text-3xl font-bold mt-2">
              {acceptanceRate}%
            </h2>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <p className="text-zinc-400 text-sm">
              Avg Runtime
            </p>

            <h2 className="text-3xl font-bold mt-2">
              {averageRuntime} ms
            </h2>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <p className="text-zinc-400 text-sm">
              Current Streak
            </p>

            <h2 className="text-3xl font-bold mt-2">
              {currentStreak}
            </h2>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <p className="text-zinc-400 text-sm">
              Best Streak
            </p>

            <h2 className="text-3xl font-bold mt-2">
              {longestStreak}
            </h2>
          </div>

        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">

            <h2 className="text-xl font-semibold mb-4">
              Topic Breakdown
            </h2>

            {Object.keys(topicStats)
              .length === 0 ? (
              <p className="text-zinc-400">
                No topic data yet.
              </p>
            ) : (
              <div className="space-y-3">
                {Object.entries(
                  topicStats
                ).map(
                  ([topic, count]) => (
                    <div
                      key={topic}
                      className="flex items-center justify-between bg-zinc-800 px-4 py-3 rounded-xl"
                    >
                      <span>
                        {topic}
                      </span>

                      <span className="text-green-400 font-semibold">
                        {count}
                      </span>
                    </div>
                  )
                )}
              </div>
            )}

            {strongestTopic && (
              <p className="text-zinc-400 text-sm mt-4">
                Strongest Topic:{" "}
                <span className="text-white">
                  {strongestTopic}
                </span>
              </p>
            )}

          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">

            <h2 className="text-xl font-semibold mb-4">
              Language Usage
            </h2>

            <p className="text-zinc-400 text-sm mb-4">
              Favorite:{" "}
              {favoriteLanguage}
            </p>

            <div className="space-y-3">

              {Object.entries(
                languageStats
              ).map(
                ([lang, count]) => (
                  <div
                    key={lang}
                    className="flex items-center justify-between bg-zinc-800 px-4 py-3 rounded-xl"
                  >
                    <span className="capitalize">
                      {lang}
                    </span>

                    <span>
                      {count} submissions
                    </span>
                  </div>
                )
              )}

              {Object.keys(
                languageStats
              ).length === 0 && (
                  <p className="text-zinc-400">
                    No submissions yet.
                  </p>
                )}

            </div>

          </div>

        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">

          <h2 className="text-xl font-semibold mb-4">
            Recent Submissions
          </h2>

          <div className="space-y-3">

            {submissions
              .slice(0, 10)
              .map((submission) => (
                <div
                  key={
                    submission._id ||
                    submission.id
                  }
                  className="bg-zinc-800 px-4 py-3 rounded-xl flex items-center justify-between"
                >
                  <div>
                    <p className="font-semibold">
                      {submission.problemTitle ||
                        submission.problemSlug}
                    </p>

                    <p className="text-zinc-400 text-sm">
                      {
                        submission.language
                      }
                    </p>
                  </div>

                  <span className="text-sm">
                    {submission.status}
                  </span>
                </div>
              ))}

            {submissions.length ===
              0 && (
                <p className="text-zinc-400">
                  No submissions yet.
                </p>
              )}

          </div>

        </div>

        {/* ── Solve Velocity Chart ─────────────────────────────────────── */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest mb-4">
            Solve Velocity (last 8 weeks)
          </h3>
          {velocityData.every(d => d.solved === 0) ? (
            <p className="text-zinc-600 text-sm text-center py-8">
              No recent activity to chart. Start solving!
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={velocityData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <XAxis dataKey="week" tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: 8, color: "#fff" }}
                  labelStyle={{ color: "#a1a1aa" }}
                  cursor={{ fill: "#27272a" }}
                />
                <Bar dataKey="solved" fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* ── Topic Coverage Radar ──────────────────────────────────────── */}
        {radarData.length >= 3 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest mb-4">
              Topic Coverage
            </h3>
            <ResponsiveContainer width="100%" height={260}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#27272a" />
                <PolarAngleAxis dataKey="topic" tick={{ fill: "#71717a", fontSize: 10 }} />
                <Radar
                  name="Solved"
                  dataKey="count"
                  stroke="#22c55e"
                  fill="#22c55e"
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}

export default Analytics;
