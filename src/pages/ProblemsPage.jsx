import { useMemo, useState } from "react";

import { useTheme } from "../context/ThemeContext";
import { useAppContext } from "../hooks/useAppContext";
import { useProblems } from "../hooks/useProblems";

import ProblemsTopbar from "../components/problem/common/ProblemsTopbar";
import ProblemsNavigation from "../components/problem/navigation/ProblemsNavigation";
import LearningWorkspace from "../components/problem/learning/LearningWorkspace";

import BrowseView from "../components/problem/browse/BrowseView";
import PatternView from "../components/problem/patterns/PatternView";
import PlaylistView from "../components/problem/playlists/PlaylistView";
import SavedView from "../components/problem/saved/SavedView";

// View registry — add Roadmaps, Company Tracks, Revision, AI Picks here only.
const VIEWS = {
  browse:    BrowseView,
  patterns:  PatternView,
  playlists: PlaylistView,
  saved:     SavedView,
};

function ProblemsPage() {
  const { theme } = useTheme();
  const { problems, loading, error } = useProblems();
  const { solvedProblems } = useAppContext();

  const [activeView, setActiveView] = useState("browse");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("All");
  const [selectedTopic, setSelectedTopic] = useState("All");

  const solvedCount = solvedProblems.length;

  const progress =
    problems.length > 0
      ? Math.round((solvedCount / problems.length) * 100)
      : 0;

  const topics = useMemo(() => {
    const unique = [
      ...new Set(problems.map((p) => p.topic).filter(Boolean)),
    ];
    return ["All", ...unique.sort()];
  }, [problems]);

  const filtered = useMemo(() => {
    return problems.filter((problem) => {
      const matchesDifficulty =
        selectedDifficulty === "All" ||
        problem.difficulty === selectedDifficulty;
      const matchesTopic =
        selectedTopic === "All" || problem.topic === selectedTopic;
      const matchesSearch = problem.title
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      return matchesDifficulty && matchesTopic && matchesSearch;
    });
  }, [problems, selectedDifficulty, selectedTopic, searchTerm]);

  const ActiveView = VIEWS[activeView] ?? null;

  const browseProps =
    activeView === "browse"
      ? {
          loading,
          error,
          filtered,
          topics,
          selectedTopic,
          setSelectedTopic,
          selectedDifficulty,
          setSelectedDifficulty,
          searchTerm,
          setSearchTerm,
        }
      : {};

  return (
    <div className="h-screen flex flex-col bg-black text-white overflow-hidden">

      {/* Slim topbar — replaces global Navbar */}
      <ProblemsTopbar
        totalProblems={problems.length}
        solvedCount={solvedCount}
        progress={progress}
      />

      {/* 3-column body */}
      <div className="flex flex-1 min-h-0">

        {/* ── LEFT: workspace nav ── */}
        <aside
          className="w-56 flex-shrink-0 border-r border-zinc-800 bg-zinc-950 overflow-y-auto"
          style={{ scrollbarWidth: "none" }}
        >
          <div className="p-3 pt-4">
            <p className="text-[10px] uppercase tracking-widest text-zinc-600 px-3 mb-3">
              Workspace
            </p>
            <ProblemsNavigation
              activeView={activeView}
              setActiveView={setActiveView}
            />
          </div>
        </aside>

        {/* ── CENTER: only this column scrolls ── */}
        <main
          className="flex-1 min-w-0 bg-black overflow-y-auto"
          style={{ scrollbarWidth: "thin", scrollbarColor: "#3f3f46 transparent" }}
        >
          <div className="px-7 py-6 max-w-4xl">

            {/* Page header — tighter than before */}
            <div className="mb-5">
              <h1 className="text-2xl font-bold tracking-tight">
                {theme.words.problems}
              </h1>
              <p className="text-zinc-500 mt-0.5 text-sm">{theme.description}</p>
            </div>

            {ActiveView && <ActiveView {...browseProps} />}

          </div>
        </main>

        {/* ── RIGHT: learning hub ── */}
        <aside
          className="w-80 flex-shrink-0 border-l border-zinc-800 bg-zinc-950 overflow-y-auto"
          style={{ scrollbarWidth: "none" }}
        >
          <LearningWorkspace
            problems={problems}
            solvedCount={solvedCount}
            progress={progress}
          />
        </aside>

      </div>

    </div>
  );
}

export default ProblemsPage;
