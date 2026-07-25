import { Link } from "react-router-dom";
import { PartyPopper, Compass } from "lucide-react";

/**
 * NextBestProblemEmptyState — the "nothing left to recommend" branch of
 * Feature 4. Rendered instead of NextBestProblemCard when
 * recommendation.nextBestProblem is `null` — i.e. every strategy in
 * RecommendationService (Learning Path, then global next-unsolved) came
 * up empty, meaning the user has solved everything currently available
 * to them (see backend/services/recommendation/RecommendationService.js's
 * "Priority 3" completion case).
 *
 * The spec is explicit this section must never be left blank on a
 * genuine completion — this is that celebration, sized to sit inside the
 * existing SubmissionCelebrationModal rather than compete with it (no
 * confetti here; LearningPathCompletionModal already owns that moment
 * for path-level completion).
 */
function NextBestProblemEmptyState() {
  return (
    <div>
      <p className="text-xs font-medium text-zinc-500 mb-1.5">Next Best Problem</p>
      <div className="rounded-xl border border-teal-500/20 bg-teal-500/5 px-3.5 py-3.5 text-center">
        <div
          className="w-9 h-9 mx-auto mb-2 rounded-full flex items-center justify-center"
          style={{
            background:
              "linear-gradient(135deg, var(--theme-primary, #2dd4bf), var(--theme-accent, #0d9488))",
          }}
        >
          <PartyPopper size={17} className="text-black" strokeWidth={2.25} aria-hidden="true" />
        </div>
        <p className="text-sm font-semibold text-white">Incredible!</p>
        <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
          You've completed every available recommendation.
        </p>
        <Link
          to="/problems"
          className="inline-flex items-center gap-1.5 mt-3 text-xs font-semibold rounded-lg px-3 py-1.5 transition-colors"
          style={{
            color: "var(--theme-primary, #2dd4bf)",
            backgroundColor: "color-mix(in srgb, var(--theme-primary, #2dd4bf) 12%, transparent)",
          }}
        >
          <Compass size={13} strokeWidth={2.5} aria-hidden="true" />
          Explore more problems
        </Link>
      </div>
    </div>
  );
}

export default NextBestProblemEmptyState;