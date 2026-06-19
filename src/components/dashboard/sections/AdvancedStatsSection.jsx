import { useMemo } from "react";

import { useTheme } from "../../../context/ThemeContext";
import { useAppContext } from "../../../hooks/useAppContext";

function AdvancedStatsSection() {
  const { theme } = useTheme();

  const { submissions } = useAppContext();

  const acceptanceRate = useMemo(() => {
    if (submissions.length === 0) {
      return 0;
    }

    const accepted = submissions.filter(
      (submission) =>
        submission.status === "Accepted 🎉"
    ).length;

    return (
      (accepted / submissions.length) *
      100
    ).toFixed(1);
  }, [submissions]);

  const averageRuntime = useMemo(() => {
    const acceptedSubmissions =
      submissions.filter(
        (submission) =>
          submission.status ===
          "Accepted 🎉"
      );

    if (
      acceptedSubmissions.length === 0
    ) {
      return 0;
    }

    const totalRuntime =
      acceptedSubmissions.reduce(
        (sum, submission) =>
          sum +
          Number(
            submission.executionTime ||
              0
          ),
        0
      );

    return (
      totalRuntime /
      acceptedSubmissions.length
    ).toFixed(2);
  }, [submissions]);

  const languageStats = useMemo(() => {
    const stats = {};

    submissions.forEach(
      (submission) => {
        const language =
          submission.language ||
          "unknown";

        stats[language] =
          (stats[language] || 0) + 1;
      }
    );

    return stats;
  }, [submissions]);

  const favoriteLanguage =
    Object.keys(languageStats).sort(
      (a, b) =>
        languageStats[b] -
        languageStats[a]
    )[0] || "N/A";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <p className="text-zinc-400 text-sm">
          {theme.words.acceptanceRate}
        </p>

        <h2 className="text-3xl font-bold mt-2">
          {acceptanceRate}%
        </h2>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <p className="text-zinc-400 text-sm">
          {theme.words.averageRuntime}
        </p>

        <h2 className="text-3xl font-bold mt-2">
          {averageRuntime} ms
        </h2>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <p className="text-zinc-400 text-sm">
          {theme.words.favoriteLanguage}
        </p>

        <h2 className="text-3xl font-bold mt-2 capitalize">
          {favoriteLanguage}
        </h2>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <p className="text-zinc-400 text-sm">
          {theme.words.totalSubmissions}
        </p>

        <h2 className="text-3xl font-bold mt-2">
          {submissions.length}
        </h2>
      </div>

    </div>
  );
}

export default AdvancedStatsSection;