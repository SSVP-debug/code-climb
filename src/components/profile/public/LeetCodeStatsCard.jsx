function LeetCodeStatsCard({ leetcode }) {
  if (!leetcode) return null;

  return (
    <div className="mt-10">
      <h2 className="text-2xl font-bold mb-4">LeetCode</h2>

      <div className="bg-[var(--surface-elevated)] rounded-2xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[var(--muted-foreground)] text-sm">Username</p>
            <p className="text-xl font-semibold">@{leetcode.username}</p>
          </div>

          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${
              leetcode.source === "api"
                ? "bg-green-500/10 text-green-400"
                : "bg-yellow-500/10 text-yellow-400"
            }`}
          >
            {leetcode.source === "api" ? "Synced" : "Self Reported"}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-[var(--muted-foreground)] text-sm">Total</p>
            <p className="text-2xl font-bold">{leetcode.totalSolved}</p>
          </div>
          <div>
            <p className="text-green-400 text-sm">Easy</p>
            <p className="text-xl font-bold">{leetcode.easySolved}</p>
          </div>
          <div>
            <p className="text-yellow-400 text-sm">Medium</p>
            <p className="text-xl font-bold">{leetcode.mediumSolved}</p>
          </div>
          <div>
            <p className="text-red-400 text-sm">Hard</p>
            <p className="text-xl font-bold">{leetcode.hardSolved}</p>
          </div>
        </div>

        {leetcode.lastSyncedAt && (
          <p className="text-xs text-[var(--muted-foreground)]">
            Last synced {new Date(leetcode.lastSyncedAt).toLocaleDateString()}
          </p>
        )}
      </div>
    </div>
  );
}

export default LeetCodeStatsCard;
