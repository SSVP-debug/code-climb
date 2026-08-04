/**
 * DashboardSkeleton — shown instead of DashboardSections while
 * AppContext's isBackendReady is still false (see Dashboard.jsx).
 *
 * Mirrors DashboardSections' actual row layout (see that file's comment
 * for the row breakdown) so there's no layout jump/reflow the moment real
 * data swaps in — same grid classes, same row count, just placeholder
 * blocks instead of real cards. Follows the same
 * `bg-zinc-900 border border-zinc-800 rounded-2xl animate-pulse` pattern
 * already used by ProblemCardSkeleton / ProblemDetailsSkeleton.
 *
 * This is the defense-in-depth layer: under normal flow, OnboardingGate's
 * WorkspacePreparationScreen step already blocks navigation to /dashboard
 * until isBackendReady is true, so this should rarely be visible. It
 * exists so that no route — including edge cases like a direct deep link
 * or a fast-refresh during dev — can ever end up rendering the old fake
 * zero-state (0 solved, empty streak, empty charts) instead of an honest
 * loading state.
 */

function Block({ className = "" }) {
  return (
    <div
      className={`bg-zinc-900 border border-zinc-800 rounded-2xl animate-pulse ${className}`}
    />
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Row 1 — Greeting */}
      <Block className="h-24" />

      {/* Row 2 — KPI strip (4-up) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Block className="h-28" />
        <Block className="h-28" />
        <Block className="h-28" />
        <Block className="h-28" />
      </div>

      {/* Row 3 — Rank | Weekly Goal | Daily Challenge | Next Contest */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Block className="h-40" />
        <Block className="h-40" />
        <Block className="h-40" />
        <Block className="h-40" />
      </div>

      {/* Row 4 — Activity Heatmap (wide) | Topic Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Block className="h-64 lg:col-span-2" />
        <Block className="h-64" />
      </div>

      {/* Row 5 — Continue | AI Insights | Recent Achievement */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Block className="h-48" />
        <Block className="h-48" />
        <Block className="h-48" />
      </div>

      {/* Row 6 — Profile-share CTA */}
      <Block className="h-20" />
    </div>
  );
}

export default DashboardSkeleton;