function ProblemCardSkeleton() {
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-5 w-1/3 bg-[var(--border-strong)] rounded" />
        <div className="h-5 w-20 bg-[var(--border-strong)] rounded" />
      </div>
      <div className="mt-3 h-3.5 w-1/4 bg-[var(--surface-elevated)] rounded" />
      <div className="mt-2 h-3 w-1/3 bg-[var(--surface-elevated)]/70 rounded" />
    </div>
  );
}

export default ProblemCardSkeleton;