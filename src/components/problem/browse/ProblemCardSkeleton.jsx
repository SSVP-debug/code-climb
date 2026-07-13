function ProblemCardSkeleton() {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-5 w-1/3 bg-zinc-700 rounded" />
        <div className="h-5 w-20 bg-zinc-700 rounded" />
      </div>
      <div className="mt-3 h-3.5 w-1/4 bg-zinc-800 rounded" />
      <div className="mt-2 h-3 w-1/3 bg-zinc-800/70 rounded" />
    </div>
  );
}

export default ProblemCardSkeleton;