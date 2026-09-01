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
        <div className="h-full w-[30%] bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 animate-pulse">
          <div className="h-6 w-2/3 bg-[var(--border-strong)] rounded" />
          <div className="mt-3 h-5 w-16 bg-[var(--surface-elevated)] rounded-full" />
          <div className="mt-6 space-y-2.5">
            <div className="h-3 w-full bg-[var(--surface-elevated)] rounded" />
            <div className="h-3 w-full bg-[var(--surface-elevated)] rounded" />
            <div className="h-3 w-5/6 bg-[var(--surface-elevated)] rounded" />
            <div className="h-3 w-full bg-[var(--surface-elevated)] rounded" />
            <div className="h-3 w-2/3 bg-[var(--surface-elevated)] rounded" />
          </div>
        </div>

        <div className="h-full flex-1 bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden animate-pulse">
          <div className="h-10 border-b border-[var(--border)] px-4 flex items-center gap-2">
            <div className="h-5 w-20 bg-[var(--surface-elevated)] rounded" />
            <div className="h-5 w-5 bg-[var(--surface-elevated)] rounded ml-auto" />
          </div>
          <div className="p-4 space-y-2.5">
            <div className="h-3 w-3/4 bg-[var(--surface-elevated)] rounded" />
            <div className="h-3 w-1/2 bg-[var(--surface-elevated)] rounded" />
            <div className="h-3 w-2/3 bg-[var(--surface-elevated)] rounded" />
          </div>
        </div>
      </div>

      {/* Mobile / tablet: single pane */}
      <div className="flex lg:hidden h-full">
        <div className="h-full w-full bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 animate-pulse">
          <div className="h-6 w-2/3 bg-[var(--border-strong)] rounded" />
          <div className="mt-3 h-5 w-16 bg-[var(--surface-elevated)] rounded-full" />
          <div className="mt-6 space-y-2.5">
            <div className="h-3 w-full bg-[var(--surface-elevated)] rounded" />
            <div className="h-3 w-full bg-[var(--surface-elevated)] rounded" />
            <div className="h-3 w-5/6 bg-[var(--surface-elevated)] rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProblemDetailsSkeleton;