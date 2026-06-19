import { useMemo } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import { useAppContext } from "../hooks/useAppContext";

function Analytics() {
  const {
    solvedProblems,
    submissions,
    topicStats,
    currentStreak,
    longestStreak,
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
      (s) => s.status === "Accepted 🎉"
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
          s.status === "Accepted 🎉"
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

      </div>
    </DashboardLayout>
  );
}

export default Analytics;