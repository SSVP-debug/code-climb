import { useMemo } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import {
  getAcceptanceRate,
  getAllSubmissions,
  getAverageRuntime,
  getLanguageStats,
  getTopicStats,
  getUserLevel,
  getUserRank,
  getStrongestTopic,
} from "../utils/analyticsUtils";

function Analytics() {
  const rank = useMemo(() => getUserRank(), []);
  const level = useMemo(() => getUserLevel(), []);
  const acceptanceRate = useMemo(
    () => getAcceptanceRate(),
    []
  );
  const averageRuntime = useMemo(
    () => getAverageRuntime(),
    []
  );
  const languageStats = useMemo(
    () => getLanguageStats(),
    []
  );
  const topicStats = useMemo(
    () => getTopicStats(),
    []
  );
  const submissions = useMemo(
    () => getAllSubmissions(),
    []
  );
  const strongestTopic = useMemo(
    () => getStrongestTopic(),
    []
  );

  const favoriteLanguage =
    Object.keys(languageStats).sort(
      (a, b) =>
        languageStats[b] - languageStats[a]
    )[0] || "N/A";

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold">Analytics</h1>
          <p className="text-zinc-400 mt-2">
            Your coding performance at a glance
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <p className="text-zinc-400 text-sm">Rank</p>
            <h2 className="text-3xl font-bold mt-2">{rank}</h2>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <p className="text-zinc-400 text-sm">Level</p>
            <h2 className="text-3xl font-bold mt-2">{level}</h2>
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
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h2 className="text-xl font-semibold mb-4">
              Topic Breakdown
            </h2>
            {Object.keys(topicStats).length === 0 ? (
              <p className="text-zinc-400">
                No topic data yet. Solve problems to see stats.
              </p>
            ) : (
              <div className="space-y-3">
                {Object.entries(topicStats).map(
                  ([topic, count]) => (
                    <div
                      key={topic}
                      className="flex items-center justify-between bg-zinc-800 px-4 py-3 rounded-xl"
                    >
                      <span>{topic}</span>
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
                Strongest topic:{" "}
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
              Favorite: {favoriteLanguage}
            </p>
            <div className="space-y-3">
              {Object.entries(languageStats).map(
                ([lang, count]) => (
                  <div
                    key={lang}
                    className="flex items-center justify-between bg-zinc-800 px-4 py-3 rounded-xl"
                  >
                    <span className="capitalize">{lang}</span>
                    <span>{count} submissions</span>
                  </div>
                )
              )}
              {Object.keys(languageStats).length === 0 && (
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
            {submissions.slice(0, 10).map((submission) => (
              <div
                key={submission.id}
                className="bg-zinc-800 px-4 py-3 rounded-xl flex items-center justify-between"
              >
                <div>
                  <p className="font-semibold">
                    {submission.problemTitle ||
                      submission.problemSlug}
                  </p>
                  <p className="text-zinc-400 text-sm">
                    {submission.language} · {submission.date}{" "}
                    {submission.time}
                  </p>
                </div>
                <span className="text-sm">{submission.status}</span>
              </div>
            ))}
            {submissions.length === 0 && (
              <p className="text-zinc-400">
                No submissions yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default Analytics;
