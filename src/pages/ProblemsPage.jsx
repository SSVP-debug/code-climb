import {
  useEffect,
  useMemo,
  useState
} from "react";
import { X } from "lucide-react";

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
  browse: BrowseView,
  patterns: PatternView,
  playlists: PlaylistView,
  saved: SavedView,
};

function ProblemsPage() {
  const { theme } = useTheme();
  const { problems, loading, error } = useProblems();
  const { solvedProblems } = useAppContext();

  const [activeView, setActiveView] = useState(() => {
    try {
      return sessionStorage.getItem("cc_activeView") || "browse";
    } catch {
      return "browse";
    }
  });

  const [searchTerm, setSearchTerm] = useState(() => {
    try {
      return sessionStorage.getItem("cc_search") || "";
    } catch {
      return "";
    }
  });

  const [selectedDifficulty, setSelectedDifficulty] = useState(() => {
    try {
      return sessionStorage.getItem("cc_difficulty") || "All";
    } catch {
      return "All";
    }
  });

  const [selectedTopic, setSelectedTopic] = useState(() => {
    try {
      return sessionStorage.getItem("cc_topic") || "All";
    } catch {
      return "All";
    }
  });

  const [hideSolved, setHideSolved] = useState(() => {
    try {
      return sessionStorage.getItem("cc_hideSolved") === "true";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      sessionStorage.setItem("cc_activeView", activeView);
    } catch { }
  }, [activeView]);

  useEffect(() => {
    try {
      sessionStorage.setItem("cc_search", searchTerm);
    } catch { }
  }, [searchTerm]);

  useEffect(() => {
    try {
      sessionStorage.setItem(
        "cc_difficulty",
        selectedDifficulty
      );
    } catch { }
  }, [selectedDifficulty]);

  useEffect(() => {
    try {
      sessionStorage.setItem(
        "cc_topic",
        selectedTopic
      );
    } catch { }
  }, [selectedTopic]);

  function toggleHideSolved() {
    setHideSolved((prev) => {
      const next = !prev;

      try {
        sessionStorage.setItem(
          "cc_hideSolved",
          String(next)
        );
      } catch { }

      return next;
    });
  }

  const solvedCount = solvedProblems.length;

  const progress =
    problems.length > 0
      ? Math.round(
        (solvedCount / problems.length) * 100
      )
      : 0;


  const topics = useMemo(() => {
    const unique = [
      ...new Set(
        problems.map((p) => p.topic).filter(Boolean)
      ),
    ];

    return [
      "All",
      ...unique.sort((a, b) =>
        a.localeCompare(b)
      ),
    ];
  }, [problems]);

  const filtered = useMemo(() => {
    return problems.filter((problem) => {
      const matchesDifficulty =
        selectedDifficulty === "All" ||
        problem.difficulty === selectedDifficulty;

      const matchesTopic =
        selectedTopic === "All" ||
        problem.topic === selectedTopic;

      const matchesSearch = problem.title
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      const matchesSolved =
        !hideSolved ||
        !solvedProblems.includes(problem.slug);

      return (
        matchesDifficulty &&
        matchesTopic &&
        matchesSearch &&
        matchesSolved
      );
    });
  }, [
    problems,
    selectedDifficulty,
    selectedTopic,
    searchTerm,
    hideSolved,
    solvedProblems,
  ]);

  // Learning hub (right rail) collapses off-screen below the `xl` breakpoint —
  // there simply isn't width for a 3-column layout on tablet/phone. This
  // state drives it as a slide-over sheet instead, toggled from the topbar.
  const [learningHubOpen, setLearningHubOpen] = useState(false);

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
        hideSolved,
        toggleHideSolved,
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

      {/* ── Mobile/tablet workspace nav — horizontal pill strip, replaces
             the left sidebar below `lg`. Sits right under the topbar. ── */}
      <div className="lg:hidden border-b border-zinc-800 bg-zinc-950">
        <ProblemsNavigation
          activeView={activeView}
          setActiveView={setActiveView}
          orientation="horizontal"
        />
      </div>

      {/* 3-column body on desktop; single column + slide-over on mobile */}
      <div className="flex flex-1 min-h-0 relative">

        {/* ── LEFT: workspace nav — desktop only, `lg` swaps in the strip above ── */}
        <aside
          className="hidden lg:block w-56 flex-shrink-0 border-r border-zinc-800 bg-zinc-950 overflow-y-auto"
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
          <div className="px-4 sm:px-7 py-4 sm:py-6 max-w-4xl">

            {/* Page header — tighter than before */}
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                  {theme.words.problems}
                </h1>
                <p className="text-zinc-500 mt-0.5 text-sm">{theme.description}</p>
                <p className="text-xs text-zinc-600 mt-2">
                  Showing {filtered.length} of {problems.length} problems
                </p>
              </div>

              {/* Learning hub toggle — only needed where the right rail is hidden */}
              <button
                onClick={() => setLearningHubOpen(true)}
                className="xl:hidden flex-shrink-0 flex items-center gap-1.5 rounded-full bg-zinc-900 border border-zinc-700 px-3.5 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white transition"
              >
                Learning Hub
              </button>
            </div>

            {ActiveView && <ActiveView {...browseProps} />}

          </div>
        </main>

        {/* ── RIGHT: learning hub — desktop (xl+) inline sidebar ── */}
        <aside
          className="hidden xl:block w-80 flex-shrink-0 border-l border-zinc-800 bg-zinc-950 overflow-y-auto"
          style={{ scrollbarWidth: "none" }}
        >
          <LearningWorkspace
            problems={problems}
            solvedCount={solvedCount}
            progress={progress}
          />
        </aside>

        {/* ── Learning hub — mobile/tablet slide-over sheet ── */}
        {learningHubOpen && (
          <>
            <div
              className="xl:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              onClick={() => setLearningHubOpen(false)}
            />
            <aside className="xl:hidden fixed top-0 right-0 h-full w-full sm:w-96 z-50 bg-zinc-950 border-l border-zinc-800 overflow-y-auto shadow-2xl">
              <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 sticky top-0 bg-zinc-950">
                <span className="text-sm font-bold text-white">Learning Hub</span>
                <button
                  onClick={() => setLearningHubOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-zinc-800 transition text-zinc-400"
                  aria-label="Close learning hub"
                >
                  <X size={16} />
                </button>
              </div>
              <LearningWorkspace
                problems={problems}
                solvedCount={solvedCount}
                progress={progress}
              />
            </aside>
          </>
        )}

      </div>

    </div>
  );
}

export default ProblemsPage;