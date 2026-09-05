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
 * Purely presentational: takes whatever `{ slug, title, difficulty, topic,
 * reason }` it's handed and renders it. Today that data comes from
 * backend/services/recommendation/ (see RecommendationService.js's swap
 * seam); when a smarter recommendation engine replaces those strategies,
 * this component doesn't change at all — only the data it receives does.
 *
 * `reason` is always the strategy's own truthful explanation for the pick
 * (e.g. "Next challenge in your Beginner path.") — never invented here.
 */
function NextBestProblemCard({ nextProblem }) {
  const hideDifficulty = useHideDifficultyLabels();

  if (!nextProblem) return null;

  return (
    <div>
      <p className="text-xs font-medium text-[var(--muted-foreground)] mb-1.5">Next Best Problem</p>
      <Link
        to={`/problems/${nextProblem.slug}`}
        className="group block rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)]/40 hover:bg-[var(--surface-elevated)]/70 hover:border-[var(--border-strong)] transition px-3.5 py-3"
      >
        {nextProblem.reason && (
          <p
            className="text-[11px] font-medium mb-1.5 truncate"
            style={{ color: "var(--theme-primary, #2dd4bf)" }}
          >
            {nextProblem.reason}
          </p>
        )}

        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-[var(--foreground)] truncate group-hover:text-[var(--theme-primary,#2dd4bf)] transition-colors">
              {nextProblem.title}
            </p>
            <div className="flex items-center gap-2 mt-1">
              {!hideDifficulty && nextProblem.difficulty && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium border ${
                    DIFFICULTY_STYLES[nextProblem.difficulty] ??
                    "text-[var(--muted-foreground)] border-[var(--border-strong)] bg-[var(--surface-elevated)]"
                  }`}
                >
                  {nextProblem.difficulty}
                </span>
              )}
              {nextProblem.topic && (
                <span className="text-[10px] text-[var(--muted-foreground)] truncate">{nextProblem.topic}</span>
              )}
            </div>
          </div>

          <span
            className="shrink-0 inline-flex items-center gap-1 text-xs font-semibold rounded-lg px-3 py-1.5 transition-all group-hover:translate-x-0.5"
            style={{
              color: "var(--theme-primary, #2dd4bf)",
              backgroundColor: "color-mix(in srgb, var(--theme-primary, #2dd4bf) 12%, transparent)",
            }}
          >
            Solve Next
            <ArrowRight size={14} strokeWidth={2.5} aria-hidden="true" />
          </span>
        </div>
      </Link>
    </div>
  );
}

export default NextBestProblemCard;