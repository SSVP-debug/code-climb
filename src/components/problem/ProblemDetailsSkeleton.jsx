/**
 * ProblemDetailsSkeleton — content-shaped loading placeholder for
 * ProblemDetailsPage, replacing a generic spinner. Proportions mirror the
 * real layout: ProblemWorkspaceLayout.jsx's 30/70 problem/editor split
 * (usePanelResize.js's default problemWidth) on `lg`+, single-pane below
 * that. See
 * plans/006-loading-empty-state-standardization.md.
 */
function ProblemDetailsSkeleton() {
  return (
    <div className="h-full overflow-hidden px-3 py-2">
      {/* Desktop: two-pane, ~30/70 split */}
      <div className="hidden lg:flex h-full gap-3">
        <div className="h-full w-[30%] bg-zinc-900 border border-zinc-800 rounded-2xl p-4 animate-pulse">
          <div className="h-6 w-2/3 bg-zinc-700 rounded" />
          <div className="mt-3 h-5 w-16 bg-zinc-800 rounded-full" />
          <div className="mt-6 space-y-2.5">
            <div className="h-3 w-full bg-zinc-800 rounded" />
            <div className="h-3 w-full bg-zinc-800 rounded" />
            <div className="h-3 w-5/6 bg-zinc-800 rounded" />
            <div className="h-3 w-full bg-zinc-800 rounded" />
            <div className="h-3 w-2/3 bg-zinc-800 rounded" />
          </div>
        </div>

        <div className="h-full flex-1 bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden animate-pulse">
          <div className="h-10 border-b border-zinc-800 px-4 flex items-center gap-2">
            <div className="h-5 w-20 bg-zinc-800 rounded" />
            <div className="h-5 w-5 bg-zinc-800 rounded ml-auto" />
          </div>
          <div className="p-4 space-y-2.5">
            <div className="h-3 w-3/4 bg-zinc-800 rounded" />
            <div className="h-3 w-1/2 bg-zinc-800 rounded" />
            <div className="h-3 w-2/3 bg-zinc-800 rounded" />
          </div>
        </div>
      </div>

      {/* Mobile / tablet: single pane */}
      <div className="flex lg:hidden h-full">
        <div className="h-full w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 animate-pulse">
          <div className="h-6 w-2/3 bg-zinc-700 rounded" />
          <div className="mt-3 h-5 w-16 bg-zinc-800 rounded-full" />
          <div className="mt-6 space-y-2.5">
            <div className="h-3 w-full bg-zinc-800 rounded" />
            <div className="h-3 w-full bg-zinc-800 rounded" />
            <div className="h-3 w-5/6 bg-zinc-800 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProblemDetailsSkeleton;