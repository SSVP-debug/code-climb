/**
 * ContinueLearningCard
 *
 * Shows the user's most recent in-progress problem.
 * TODO: wire up to last-attempted problem from user progress API.
 */
function ContinueLearningCard() {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">

      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Continue Learning
        </p>
        <button className="text-xs text-green-400 hover:text-green-300 transition">
          View all
        </button>
      </div>

      {/* Placeholder — replace with real last-attempted problem */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0">
          <span className="text-lg">⬡</span>
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

    </div>
  );
}

export default ContinueLearningCard;
