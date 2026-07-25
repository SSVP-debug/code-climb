import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useHideDifficultyLabels } from "../../../hooks/useHideDifficultyLabels";

const DIFFICULTY_STYLES = {
  Easy: "text-emerald-400 border-emerald-500/20 bg-emerald-500/10",
  Medium: "text-amber-400 border-amber-500/20 bg-amber-500/10",
  Hard: "text-rose-400 border-rose-500/20 bg-rose-500/10",
};

/**
 * NextBestProblemCard — Feature 4 of the Submission Experience.
 *
 * Purely presentational: takes whatever `{ slug, title, difficulty, topic }`
 * it's handed and renders it. Today that data comes from
 * backend/utils/recommendNextProblem.js's ordering-based placeholder; when
 * a real recommendation engine replaces it, this component doesn't change
 * at all — only the data it receives does.
 */
function NextBestProblemCard({ nextProblem }) {
  const hideDifficulty = useHideDifficultyLabels();

  if (!nextProblem) return null;

  return (
    <div>
      <p className="text-xs font-medium text-zinc-500 mb-1.5">Next Best Problem</p>
      <Link
        to={`/problems/${nextProblem.slug}`}
        className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-800/40 hover:bg-zinc-800/70 hover:border-zinc-700 transition px-3.5 py-2.5 group"
      >
        <div className="min-w-0 pr-3">
          <p className="text-sm font-medium text-white truncate group-hover:text-[var(--theme-primary,#2dd4bf)] transition-colors">
            {nextProblem.title}
          </p>
          <div className="flex items-center gap-2 mt-1">
            {!hideDifficulty && nextProblem.difficulty && (
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium border ${
                  DIFFICULTY_STYLES[nextProblem.difficulty] ??
                  "text-zinc-400 border-zinc-700 bg-zinc-800"
                }`}
              >
                {nextProblem.difficulty}
              </span>
            )}
            {nextProblem.topic && (
              <span className="text-[10px] text-zinc-500 truncate">{nextProblem.topic}</span>
            )}
          </div>
        </div>
        <ArrowRight
          size={16}
          className="shrink-0 text-zinc-600 group-hover:text-[var(--theme-primary,#2dd4bf)] group-hover:translate-x-0.5 transition-all"
          aria-hidden="true"
        />
      </Link>
    </div>
  );
}

export default NextBestProblemCard;
