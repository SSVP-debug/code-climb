function StatCard({ label, value }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
      <p className="text-zinc-400 text-sm">{label}</p>
      <h2 className="text-3xl font-bold mt-2">{value}</h2>
    </div>
  );
}

function AnalyticsStatsGrid({ rank, level, acceptanceRate, averageRuntime, currentStreak, longestStreak }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
      <StatCard label="Rank" value={rank} />
      <StatCard label="Level" value={level} />
      <StatCard label="Acceptance Rate" value={`${acceptanceRate}%`} />
      <StatCard label="Avg Runtime" value={`${averageRuntime} ms`} />
      <StatCard label="Current Streak" value={currentStreak} />
      <StatCard label="Best Streak" value={longestStreak} />
    </div>
  );
}

export default AnalyticsStatsGrid;
