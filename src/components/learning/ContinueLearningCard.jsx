import { Link } from "react-router-dom";
import problems from "../../data/problems";
import { getLastVisitedProblem } from "../../utils/recentProblem";
import { useAppContext } from "../../hooks/useAppContext";
import { CheckCircle2, Hexagon } from "lucide-react";

function ContinueLearningCard() {
  const { solvedProblems } = useAppContext();

  const lastSlug = getLastVisitedProblem();
  const lastProblem = lastSlug
    ? problems.find((p) => p.slug === lastSlug)
    : null;
  const alreadySolved = lastProblem && solvedProblems.includes(lastProblem.slug);

  return (
    <div className="bg-ink-900 border border-ink-700 rounded-xl p-4">

      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Continue Learning
        </p>
        <Link
          to="/problems"
          className="text-xs text-verdict-accept hover:brightness-110 transition"
        >
          View all
        </Link>
      </div>

      {lastProblem ? (
        <Link
          to={`/problems/${lastProblem.slug}`}
          className="flex items-center gap-3 group"
        >
          <div className="w-9 h-9 rounded-lg bg-ink-800 flex items-center justify-center flex-shrink-0">
            {alreadySolved ? (
              <CheckCircle2 size={18} strokeWidth={2} className="text-verdict-accept" aria-hidden="true" />
            ) : (
              <Hexagon size={18} strokeWidth={2} className="text-zinc-500" aria-hidden="true" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-zinc-300 group-hover:text-white truncate transition-colors">
              {lastProblem.title}
            </p>
            <p className="text-xs text-zinc-500 mt-0.5">
              {alreadySolved ? "Already solved · revisit" : `Resume · ${lastProblem.topic}`}
            </p>
          </div>
        </Link>
      ) : (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-ink-800 flex items-center justify-center flex-shrink-0">
            <Hexagon size={18} strokeWidth={2} className="text-zinc-500" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-zinc-300 truncate">
              No problem in progress
            </p>
            <p className="text-xs text-zinc-500 mt-0.5">
              Start one from Browse
            </p>
          </div>
        </div>
      )}

    </div>
  );
}

export default ContinueLearningCard;