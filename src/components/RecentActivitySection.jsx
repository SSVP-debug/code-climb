function RecentActivitySection() {
  return (
    <div className="mt-10 bg-zinc-900 p-6 rounded-2xl border border-zinc-800">

      <h2 className="text-2xl font-semibold mb-6">
        Recent Activity
      </h2>

      <div className="space-y-4">

        <div className="bg-zinc-800 p-4 rounded-xl">
          <p className="font-semibold">
            Solved "Two Sum"
          </p>

          <p className="text-zinc-400 text-sm mt-1">
            Runtime beat 92% of submissions
          </p>
        </div>

        <div className="bg-zinc-800 p-4 rounded-xl">
          <p className="font-semibold">
            Completed 5 problems today
          </p>

          <p className="text-zinc-400 text-sm mt-1">
            Strong daily consistency streak
          </p>
        </div>

        <div className="bg-zinc-800 p-4 rounded-xl">
          <p className="font-semibold">
            Solved "Binary Tree Paths"
          </p>

          <p className="text-zinc-400 text-sm mt-1">
            Medium difficulty challenge completed
          </p>
        </div>

      </div>

    </div>
  );
}

export default RecentActivitySection;