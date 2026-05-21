import Navbar from "../components/Navbar";

function Dashboard() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      <div className="p-8">
        <h1 className="text-4xl font-bold mb-8">
          Dashboard
        </h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

          <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
            <h2 className="text-zinc-400 text-sm mb-2">
              Total Solved
            </h2>
            <p className="text-4xl font-bold">245</p>
          </div>

          <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
            <h2 className="text-zinc-400 text-sm mb-2">
              Easy
            </h2>
            <p className="text-4xl font-bold text-green-400">
              120
            </p>
          </div>

          <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
            <h2 className="text-zinc-400 text-sm mb-2">
              Medium
            </h2>
            <p className="text-4xl font-bold text-yellow-400">
              95
            </p>
          </div>

          <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
            <h2 className="text-zinc-400 text-sm mb-2">
              Hard
            </h2>
            <p className="text-4xl font-bold text-red-400">
              30
            </p>
          </div>

        </div>

        {/* Heatmap Section */}
        <div className="mt-10 bg-zinc-900 p-6 rounded-2xl border border-zinc-800">

          <h2 className="text-2xl font-semibold mb-6">
            Activity Heatmap
          </h2>

          <div className="grid grid-cols-7 gap-3">

            {Array.from({ length: 35 }).map((_, index) => (
              <div
                key={index}
                className="w-10 h-10 rounded-lg bg-zinc-800 hover:bg-green-500 transition"
              ></div>
            ))}

          </div>

        </div>
        {/* Insights Section */}
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
                📉 Needs Practice
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
        {/* Recent Activity */}
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
      </div>
    </div>
  );
}

export default Dashboard;