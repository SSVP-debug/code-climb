import AnalyticsSection from "./AnalyticsSection";

const DIFFICULTY_COLOR = {
  Easy: "text-verdict-accept",
  Medium: "text-verdict-pending",
  Hard: "text-verdict-reject",
};

function ProblemRow({ rank, problem, maxCount }) {
  const pct = maxCount > 0 ? Math.max(6, Math.round((problem.acceptedCount / maxCount) * 100)) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-zinc-600 text-xs w-4 shrink-0 text-right">{rank}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="text-zinc-200 text-sm truncate">{problem.title}</span>
          <span className={`text-xs shrink-0 ${DIFFICULTY_COLOR[problem.difficulty] || "text-zinc-500"}`}>
            {problem.difficulty}
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
          <div className="h-full bg-teal-500/70" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <span className="text-zinc-500 text-xs w-16 shrink-0 text-right font-mono-ui">
        {problem.acceptedCount} solved
      </span>
    </div>
  );
}

/**
 * ProblemPerformanceSection — "What are users solving?" Backs onto
 * GET /api/admin/analytics/problems, which ranks by accepted-submission
 * count (see adminAnalyticsController.js's getProblemPopularity for why
 * that's the definition, not distinct-solver count). `neverSolvedCount`
 * is surfaced explicitly rather than folded into "least solved" — a
 * problem nobody has ever solved isn't the same claim as "barely solved."
 */
export default function ProblemPerformanceSection({ problems }) {
  const data = problems.data;
  const empty = !problems.loading && !problems.error && (!data || (!data.mostSolved?.length && !data.leastSolved?.length));
  const maxCount = data?.mostSolved?.[0]?.acceptedCount || 1;

  return (
    <AnalyticsSection
      title="Problem Performance"
      question="What are users solving — and what's going unsolved?"
      loading={problems.loading}
      error={problems.error}
      retry={problems.retry}
      empty={empty}
      emptyLabel="No accepted submissions yet."
    >
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl px-4 py-3.5">
          <p className="text-zinc-500 text-xs uppercase tracking-wide mb-3">Most solved</p>
          <div className="flex flex-col gap-2.5">
            {(data?.mostSolved || []).slice(0, 8).map((p, i) => (
              <ProblemRow key={p.slug} rank={i + 1} problem={p} maxCount={maxCount} />
            ))}
          </div>
        </div>
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl px-4 py-3.5">
          <p className="text-zinc-500 text-xs uppercase tracking-wide mb-3">Least solved</p>
          <div className="flex flex-col gap-2.5">
            {(data?.leastSolved || []).slice(0, 8).map((p, i) => (
              <ProblemRow key={p.slug} rank={i + 1} problem={p} maxCount={maxCount} />
            ))}
          </div>
          {typeof data?.neverSolvedCount === "number" && data.neverSolvedCount > 0 && (
            <p className="text-zinc-600 text-xs mt-3 pt-3 border-t border-zinc-800/80">
              {data.neverSolvedCount} more problem{data.neverSolvedCount === 1 ? "" : "s"} in the catalog{" "}
              {data.neverSolvedCount === 1 ? "has" : "have"} never been solved — not shown above since they
              have no accepted submissions to rank by.
            </p>
          )}
        </div>
      </div>
    </AnalyticsSection>
  );
}
