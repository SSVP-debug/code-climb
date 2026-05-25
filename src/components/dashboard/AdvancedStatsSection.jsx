import {
    getAcceptanceRate,
    getAverageRuntime,
    getLanguageStats,
    getAllSubmissions,
} from "../../utils/analyticsUtils";

import { useMemo } from "react";

function AdvancedStatsSection() {

    const acceptanceRate =
        useMemo(
            () => getAcceptanceRate(),
            []
        );

    const averageRuntime =
  useMemo(
    () => getAverageRuntime(),
    []
  );

    const submissions =
        useMemo(
            () => getAllSubmissions(),
            []
        );

    const languageStats =
        useMemo(
            () => getLanguageStats(),
            []
        );

    const favoriteLanguage =
        Object.keys(languageStats)
            .sort(
                (a, b) =>
                    languageStats[b] -
                    languageStats[a]
            )[0] || "N/A";

    return (

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

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
                    Average Runtime
                </p>

                <h2 className="text-3xl font-bold mt-2">

                    {averageRuntime} ms

                </h2>

            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">

                <p className="text-zinc-400 text-sm">
                    Favorite Language
                </p>

                <h2 className="text-3xl font-bold mt-2 capitalize">

                    {favoriteLanguage}

                </h2>

            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">

                <p className="text-zinc-400 text-sm">
                    Total Submissions
                </p>

                <h2 className="text-3xl font-bold mt-2">

                    {submissions.length}

                </h2>

            </div>

        </div>

    );
}

export default AdvancedStatsSection;