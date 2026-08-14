import { useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { useTheme } from "../context/ThemeContext";
import { useAppContext } from "../hooks/useAppContext";
import { useHideDifficultyLabels } from "../hooks/useHideDifficultyLabels";
import { Clock, Bookmark } from "lucide-react";

function ProblemCard({ problem }) {
  const { theme } = useTheme();
  const hideDifficulty = useHideDifficultyLabels();
  const { solvedProblems, savedProblems, saveProblem, unsaveProblem } = useAppContext();
  const [saving, setSaving] = useState(false);

  const {
    title,
    difficulty,
    topic,
    slug,
    pattern,
    estimatedTime,
    learningLabel,
    companies,
    xp,
    acceptanceRate,
  } = problem;

  // solved/saved were previously read off `problem.solved`/`problem.saved`,
  // but nothing upstream ever set those fields — every card silently showed
  // "not solved, not saved" regardless of reality. Deriving both straight
  // from AppContext here (same source Navbar/Profile/analytics already use)
  // instead of relying on callers to pre-flag every problem object passed
  // down through Browse, Related Problems, Learning Paths, etc.
  const solved = solvedProblems.includes(slug);
  const saved = savedProblems.some((p) => p.slug === slug);

  async function handleToggleSave(e) {
    e.preventDefault();
    e.stopPropagation();
    setSaving(true);
    try {
      if (saved) {
        await unsaveProblem(slug);
      } else {
        await saveProblem(slug);
      }
    } catch (err) {
      toast.error(err.message || "Failed to update saved problems");
    } finally {
      setSaving(false);
    }
  }


  // Difficulty stays in its own green/yellow/red family regardless of the
  // selected universe — difficulty must read instantly, the same way in
  // every theme (Phase 11D decision, documented in the tracker).
  const difficultyColors = {
    Easy: "bg-green-500/15 text-green-400 border-green-500/20",
    Medium: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
    Hard: "bg-red-500/15 text-red-400 border-red-500/20",
  };

  return (
    <Link
      to={`/problems/${slug}`}
      className={`
        group
        flex
        items-center
        justify-between
        gap-4
        px-5
        py-3
        rounded-xl
        border
        transition-all
        duration-200
        ${solved
          ? "bg-zinc-900/60 border-zinc-800 opacity-75"
          : "bg-zinc-900 border-zinc-800 hover:border-[var(--theme-primary,#2dd4bf)] hover:bg-zinc-800/70"
        }
      `}
    >
      {/* Left */}
      <div className="flex items-center gap-4 min-w-0 flex-1">

        {/* Solved indicator — kept semantic green (same "success" meaning
            as an Accepted verdict), not tied to the theme color */}
        <div
          className={`w-3 h-3 rounded-full flex-shrink-0 ${solved ? "bg-green-500" : "bg-zinc-600"
            }`}
        />

        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">

            <h2 className="text-[15px] font-semibold text-white">
              {title}
            </h2>

            {(pattern || topic) && (
              <>
                <span className="text-zinc-600">•</span>

                <span className="text-sm text-zinc-400">
                  {pattern || topic}
                </span>
              </>
            )}

          </div>

          {learningLabel && (
            <p className="text-xs text-blue-400 mt-1">
              {learningLabel}
            </p>
          )}

          {companies?.length > 0 && (
            <p className="text-xs text-zinc-500 mt-1 truncate">
              {companies.slice(0, 2).join(" · ")}
              {companies.length > 2 && ` +${companies.length - 2} more`}
            </p>
          )}
        </div>

      </div>

      {/* Right */}
      <div className="flex items-center gap-3 flex-wrap justify-end flex-shrink-0">

        {typeof acceptanceRate === "number" && (
          <span className="hidden sm:inline text-xs text-zinc-500 whitespace-nowrap">
            {acceptanceRate}% solved
          </span>
        )}

        {typeof xp === "number" && (
          <span className="hidden sm:inline text-xs text-[var(--theme-primary,#2dd4bf)] font-medium whitespace-nowrap">
            +{xp} XP
          </span>
        )}

        {estimatedTime && (
          <span className="text-xs text-zinc-400 whitespace-nowrap inline-flex items-center gap-1">
            <Clock size={12} strokeWidth={2} aria-hidden="true" />
            {estimatedTime}
          </span>
        )}

        {!hideDifficulty && (
          <span
            className={`px-3 py-1 rounded-full border text-xs font-semibold ${difficultyColors[difficulty] ?? "bg-zinc-700 text-zinc-300 border-zinc-600"
              }`}
          >
            {difficulty
              ? theme.words[difficulty.toLowerCase()] ?? difficulty
              : "Unknown"}
          </span>
        )}

        <button
          onClick={handleToggleSave}
          disabled={saving}
          className={`transition disabled:opacity-50 ${saved
            ? "text-[var(--theme-primary,#2dd4bf)]"
            : "text-zinc-500 hover:text-[var(--theme-primary,#2dd4bf)]"
            }`}
          title={saved ? "Remove from saved" : "Save problem"}
          aria-pressed={saved}
        >
          <Bookmark size={16} strokeWidth={2} fill={saved ? "currentColor" : "none"} aria-hidden="true" />
        </button>

      </div>
    </Link>
  );
}

export default ProblemCard;