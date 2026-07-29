import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { Bookmark, ArrowRight } from "lucide-react";
import SectionCard from "../../ui/layout/SectionCard";
import EmptyState from "../../ui/feedback/EmptyState";
import { useAppContext } from "../../../hooks/useAppContext";
import { useProblems } from "../../../hooks/useProblems";
import { useHideDifficultyLabels } from "../../../hooks/useHideDifficultyLabels";
import { useTheme } from "../../../context/ThemeContext";

const DIFFICULTY_COLOR = {
  Easy: "text-green-400 border-green-500/30 bg-green-500/10",
  Medium: "text-yellow-400 border-yellow-500/30 bg-yellow-500/10",
  Hard: "text-red-400 border-red-500/30 bg-red-500/10",
};

const SORT_OPTIONS = [
  { value: "recent", label: "Recently saved" },
  { value: "difficulty", label: "Difficulty" },
  { value: "title", label: "Title" },
];

const DIFFICULTY_ORDER = { Easy: 0, Medium: 1, Hard: 2 };

/**
 * SavedView
 *
 * Private "read later" list — bookmark any problem (solved or not) from its
 * star icon on ProblemCard, and find it here. Self-sufficient like
 * PinnedProblems.jsx on the Profile page: reads AppContext/useProblems
 * directly rather than being prop-fed by ProblemsPage, since it doesn't
 * need anything ProblemsPage's own filters/state track.
 */
function SavedView() {
  const { theme } = useTheme();
  const hideDifficulty = useHideDifficultyLabels();
  const { savedProblems, unsaveProblem, solvedProblems } = useAppContext();
  const { problems, loading } = useProblems();

  const [sortBy, setSortBy] = useState("recent");
  const [busySlug, setBusySlug] = useState(null);

  const problemsBySlug = useMemo(() => {
    const map = new Map();
    problems.forEach((p) => map.set(p.slug, p));
    return map;
  }, [problems]);

  const rows = useMemo(() => {
    const joined = savedProblems
      .map((saved) => {
        const problem = problemsBySlug.get(saved.slug);
        if (!problem) return null; // problem removed from catalog since saving
        return { ...problem, savedAt: saved.savedAt };
      })
      .filter(Boolean);

    const sorted = [...joined];
    if (sortBy === "title") {
      sorted.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === "difficulty") {
      sorted.sort(
        (a, b) => (DIFFICULTY_ORDER[a.difficulty] ?? 3) - (DIFFICULTY_ORDER[b.difficulty] ?? 3)
      );
    } else {
      sorted.sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));
    }
    return sorted;
  }, [savedProblems, problemsBySlug, sortBy]);

  async function handleUnsave(slug) {
    setBusySlug(slug);
    try {
      await unsaveProblem(slug);
    } catch (err) {
      toast.error(err.message || "Failed to remove saved problem");
    } finally {
      setBusySlug(null);
    }
  }

  return (
    <SectionCard
      title="Saved Problems"
      subtitle="Quickly revisit bookmarked problems."
      icon={<Bookmark size={18} strokeWidth={2} />}
      accented
      action={
        rows.length > 0 && (
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-zinc-800 border border-zinc-700 rounded-lg text-xs px-2 py-1.5 text-zinc-300"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        )
      }
    >
      {loading ? (
        <p className="text-zinc-500 text-sm py-4">Loading your saved problems…</p>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={<Bookmark size={28} strokeWidth={1.75} />}
          title="Nothing saved yet"
          description="Tap the star on any problem while browsing to bookmark it and build your list here."
          compact
        />
      ) : (
        <div className="space-y-3">
          {rows.map((p) => (
            <div
              key={p.slug}
              className="flex items-center justify-between gap-3 bg-zinc-800 rounded-xl px-4 py-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                    solvedProblems.includes(p.slug) ? "bg-green-500" : "bg-zinc-600"
                  }`}
                  aria-hidden="true"
                  title={solvedProblems.includes(p.slug) ? "Solved" : "Not solved yet"}
                />
                {!hideDifficulty && (
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full border flex-shrink-0 ${
                      DIFFICULTY_COLOR[p.difficulty] || "text-zinc-400 border-zinc-700 bg-zinc-800"
                    }`}
                  >
                    {theme.words[p.difficulty?.toLowerCase()] ?? p.difficulty}
                  </span>
                )}
                <div className="min-w-0">
                  <Link
                    to={`/problems/${p.slug}`}
                    className="text-sm font-medium truncate hover:text-[var(--theme-primary,#2dd4bf)] transition block"
                  >
                    {p.title}
                  </Link>
                  {p.topic && (
                    <p className="text-xs text-zinc-500 truncate">{p.topic}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                <Link
                  to={`/problems/${p.slug}`}
                  className="text-xs font-medium text-[var(--theme-primary,#2dd4bf)] hover:brightness-110 transition inline-flex items-center gap-1"
                >
                  Solve <ArrowRight size={12} strokeWidth={2} aria-hidden="true" />
                </Link>
                <button
                  onClick={() => handleUnsave(p.slug)}
                  disabled={busySlug === p.slug}
                  className="text-zinc-500 hover:text-red-400 text-xs transition disabled:opacity-50"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}

export default SavedView;