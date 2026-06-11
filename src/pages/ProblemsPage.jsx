import {
  useMemo,
  useState,
} from "react";

import { useTheme } from "../context/ThemeContext";

import DashboardLayout from "../layouts/DashboardLayout";

import ProblemCard from "../components/ProblemCard";

import { useProblems } from "../hooks/useProblems";

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

  // ALL hooks must run before returns
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
          selectedDifficulty ===
          "All" ||
          problem.difficulty ===
          selectedDifficulty;

        const matchesTopic =
          selectedTopic ===
          "All" ||
          problem.topic ===
          selectedTopic;

        const matchesSearch =
          problem.title
            .toLowerCase()
            .includes(
              searchTerm.toLowerCase()
            );

        return (
          matchesDifficulty &&
          matchesTopic &&
          matchesSearch
        );
      }
    );
  }, [
    problems,
    selectedDifficulty,
    selectedTopic,
    searchTerm,
  ]);

  // RETURNS AFTER ALL HOOKS
  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-white">
          Loading problems...
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="text-red-400">
          {error}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold">
            {theme.words.problems}
          </h1>

          <p className="text-zinc-400 mt-2">
            {theme.description}
          </p>
        </div>

        {/* Search */}
        <div className="mb-8">
          <input
            type="text"
            placeholder={theme.words.searchProblems}
            value={searchTerm}
            onChange={(e) =>
              setSearchTerm(
                e.target.value
              )
            }
            className="w-full md:w-[400px] bg-zinc-900 border border-zinc-800 px-5 py-3 rounded-xl outline-none focus:border-green-500 transition"
          />
        </div>

        {/* Topic Filters */}
        <div className="flex gap-4 mb-8 flex-wrap">
          {topics.map((topic) => (
            <button
              key={topic}
              onClick={() =>
                setSelectedTopic(
                  topic
                )
              }
              className={`px-5 py-2 rounded-xl transition font-semibold ${selectedTopic ===
                topic
                ? "bg-blue-500 text-white"
                : "bg-zinc-900 border border-zinc-800 text-white hover:border-blue-500"
                }`}
            >
              {topic}
            </button>
          ))}
        </div>

        {/* Difficulty Filters */}
        <div className="flex gap-4 mb-8 flex-wrap">
          {[
            { value: "All", label: theme.words.all },
            { value: "Easy", label: theme.words.easy },
            { value: "Medium", label: theme.words.medium },
            { value: "Hard", label: theme.words.hard },
          ].map((level) => (
            <button
              key={level.value}
              onClick={() =>
                setSelectedDifficulty(
                  level.value
                )
              }
              className={`px-5 py-2 rounded-xl transition font-semibold ${selectedDifficulty ===
                level.value
                ? "bg-green-500 text-black"
                : "bg-zinc-900 border border-zinc-800 text-white hover:border-green-500"
                }`}
            >
              {level.label}
            </button>
          ))}
        </div>

        {/* Results Count */}
        <p className="text-zinc-500 text-sm mb-6">
          {filtered.length}{" "}
          {filtered.length === 1
            ? theme.words.problemFound
            : theme.words.problemsFound}
        </p>

        {/* Problems Grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filtered.map(
              (problem) => (
                <ProblemCard
                  key={
                    problem.id
                  }
                  title={
                    problem.title
                  }
                  slug={
                    problem.slug
                  }
                  difficulty={
                    problem.difficulty
                  }
                  topic={
                    problem.topic
                  }
                />
              )
            )}
          </div>
        ) : (
          <div className="text-center py-16 text-zinc-500">
            <p className="text-lg">
              {theme.words.noProblemsFound}
            </p>

            <button
              onClick={() => {
                setSelectedDifficulty(
                  "All"
                );

                setSelectedTopic(
                  "All"
                );

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

