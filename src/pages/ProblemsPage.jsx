import {
  useMemo,
  useState,
} from "react";

import { useTheme } from "../context/ThemeContext";

import DashboardLayout from "../layouts/DashboardLayout";

import ProblemCard from "../components/ProblemCard";

import { useProblems } from "../hooks/useProblems";

import { useAppContext } from "../hooks/useAppContext";

import LearningWorkspace from "../components/learning/LearningWorkspace";

import ContinueLearningCard from "../components/learning/ContinueLearningCard";


// ---------------------------------------------------------------------------
// ProblemCardSkeleton
// Mirrors ProblemCard's exact DOM structure + spacing so the grid never shifts
// when real cards arrive.
//   - bg-zinc-900 border border-zinc-800 rounded-2xl p-6  ← matches ProblemCard
//   - Each placeholder div matches the approximate height of the real element
// ---------------------------------------------------------------------------
function ProblemCardSkeleton() {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 animate-pulse">

      {/* Row 1: title + difficulty badge */}
      <div className="flex items-center justify-between">
        {/* Title placeholder — ~60% width, same line-height as text-2xl */}
        <div className="h-7 w-3/5 bg-zinc-700 rounded-lg" />
        {/* Badge placeholder */}
        <div className="h-5 w-14 bg-zinc-700 rounded-md" />
      </div>

      {/* Row 2: "Topic: …" line — mt-4 matches ProblemCard */}
      <div className="mt-4 h-4 w-2/5 bg-zinc-800 rounded-md" />

      {/* Row 3: button — mt-6 px-5 py-3 rounded-xl matches ProblemCard */}
      <div className="mt-6 h-11 w-32 bg-zinc-700 rounded-xl" />

    </div>
  );
}

// How many skeleton cards to show while loading.
// 6 fills a typical viewport on both desktop (3 rows × 2 cols) and mobile.
const SKELETON_COUNT = 8;

// ---------------------------------------------------------------------------
// ProblemsPage
// ---------------------------------------------------------------------------
function ProblemsPage() {
  const { theme } = useTheme();
  const {
    problems,
    loading,
    error,
  } = useProblems();

  const [
    selectedDifficulty,
    setSelectedDifficulty,
  ] = useState("All");

  const [
    searchTerm,
    setSearchTerm,
  ] = useState("");

  const [
    selectedTopic,
    setSelectedTopic,
  ] = useState("All");

  const { solvedProblems } = useAppContext();

  const solvedCount = solvedProblems.length;

  const progress =
    problems.length > 0
      ? Math.round(
        (solvedCount / problems.length) * 100
      )
      : 0;

  // Derived values — hooks must all run before any early return
  const topics = useMemo(() => {
    const unique = [
      ...new Set(
        problems
          .map((p) => p.topic)
          .filter(Boolean)
      ),
    ];

    return [
      "All",
      ...unique.sort(),
    ];
  }, [problems]);

  const filtered = useMemo(() => {
    return problems.filter(
      (problem) => {
        const matchesDifficulty =
          selectedDifficulty === "All" ||
          problem.difficulty === selectedDifficulty;

        const matchesTopic =
          selectedTopic === "All" ||
          problem.topic === selectedTopic;

        const matchesSearch =
          problem.title
            .toLowerCase()
            .includes(searchTerm.toLowerCase());

        return matchesDifficulty && matchesTopic && matchesSearch;
      }
    );
  }, [problems, selectedDifficulty, selectedTopic, searchTerm]);

  // -------------------------------------------------------------------------
  // Render
  // The page shell (header, search, filters) is ALWAYS rendered so there is
  // zero layout shift when loading resolves. Only the grid body changes.
  // -------------------------------------------------------------------------
  return (
    <DashboardLayout>
      <div>

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-end justify-between mb-5">

          <div>
            <h1 className="text-4xl font-bold">
              {theme.words.problems}
            </h1>

            <p className="text-zinc-400 mt-1">
              {theme.description}
            </p>
          </div>

          <div className="text-right">
            <p className="text-lg font-semibold">
              {problems.length} Vaults
            </p>

            <p className="text-sm text-zinc-500">
              {solvedCount} Cleared • {progress}%
            </p>
          </div>

        </div>


        {/* ── Search ─────────────────────────────────────────────────────── */}
        <div className="mb-4">
          <input
            type="text"
            placeholder={theme.words.searchProblems}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-[520px] bg-zinc-900 border border-zinc-800 px-4 py-2.5 rounded-xl outline-none focus:border-green-500 transition"
          />
        </div>

        {/* ── Topic Filters ───────────────────────────────────────────────── */}
        {/* While loading, topics is [] so this section collapses naturally.  */}
        {topics.length > 0 && (
          <div className="flex gap-4 mb-5 flex-wrap">
            {topics.map((topic) => (
              <button
                key={topic}
                onClick={() => setSelectedTopic(topic)}
                className={`px-4 py-2 rounded-xl transition font-semibold ${selectedTopic === topic
                  ? "bg-blue-500 text-white"
                  : "bg-zinc-900 border border-zinc-800 text-white hover:border-blue-500"
                  }`}
              >
                {topic}
              </button>
            ))}
          </div>
        )}

        {/* ── Difficulty Filters ──────────────────────────────────────────── */}
        <div className="flex gap-4 mb-5 flex-wrap">
          {[
            { value: "All", label: theme.words.all },
            { value: "Easy", label: theme.words.easy },
            { value: "Medium", label: theme.words.medium },
            { value: "Hard", label: theme.words.hard },
          ].map((level) => (
            <button
              key={level.value}
              onClick={() => setSelectedDifficulty(level.value)}
              className={`px-4 py-2 rounded-xl transition font-semibold ${selectedDifficulty === level.value
                ? "bg-green-500 text-black"
                : "bg-zinc-900 border border-zinc-800 text-white hover:border-green-500"
                }`}
            >
              {level.label}
            </button>
          ))}
        </div>

        {/* ── Results Count ───────────────────────────────────────────────── */}
        {/* Hidden while loading — avoids a "0 problems found" flash */}


        {/* ── Error Banner (non-blocking) ─────────────────────────────────── */}
        {error && (
          <div className="mb-4 text-amber-400 text-sm bg-amber-400/10 border border-amber-400/20 rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        {/* ── Grid body ───────────────────────────────────────────────────── */}
        {loading ? (
          /* Skeleton — same 2-col grid as the real cards */
          <div className="flex flex-col gap-3"
            aria-busy={loading}>
            {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
              <ProblemCardSkeleton key={i} />
            ))}
          </div>
        ) : filtered.length > 0 ? (
          /* Real cards — fade in so the skeleton→data switch feels smooth */
          <div className="flex flex-col gap-3 animate-fadeIn"
            aria-busy={loading}>
            {filtered.map((problem) => (
              <ProblemCard
                key={problem.id}
                problem={problem}
              />
            ))}
          </div>
        ) : (
          /* Empty state */
          <div className="text-center py-16 text-zinc-500">
            <p className="text-lg">
              {theme.words.noProblemsFound}
            </p>

            <button
              onClick={() => {
                setSelectedDifficulty("All");
                setSelectedTopic("All");
                setSearchTerm("");
              }}
              className="mt-4 text-green-500 hover:underline text-sm"
            >
              {theme.words.clearFilters}
            </button>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}

export default ProblemsPage;
