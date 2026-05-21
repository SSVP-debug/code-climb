function InsightsSection() {
  return (
    <div className="mt-10">

      <h2 className="text-2xl font-semibold mb-6">
        Progress Insights
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
          <h3 className="text-xl font-semibold mb-2">
            🔥 Current Streak
          </h3>

          <p className="text-3xl font-bold text-orange-400">
            14 Days
          </p>

          <p className="text-zinc-400 mt-2">
            You’re solving consistently this week.
          </p>
        </div>

        <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
          <h3 className="text-xl font-semibold mb-2">
            📈 Weekly Growth
          </h3>

          <p className="text-3xl font-bold text-green-400">
            +12%
          </p>

          <p className="text-zinc-400 mt-2">
            Better performance than last week.
          </p>
        </div>

        <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
          <h3 className="text-xl font-semibold mb-2">
            🎯 Strongest Topic
          </h3>

          <p className="text-3xl font-bold text-blue-400">
            Arrays
          </p>

          <p className="text-zinc-400 mt-2">
            Excellent problem-solving consistency.
          </p>
        </div>

        <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
          <h3 className="text-xl font-semibold mb-2">
            ⚠️ Needs Practice
          </h3>

          <p className="text-3xl font-bold text-red-400">
            Graphs
          </p>

          <p className="text-zinc-400 mt-2">
            Accuracy is dropping in this topic.
          </p>
        </div>

      </div>

    </div>
  );
}

export default InsightsSection;