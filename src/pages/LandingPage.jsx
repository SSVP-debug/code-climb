import { Link } from "react-router-dom";

function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-5xl mx-auto px-8 py-20">
        <header className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4">
            Code Climb
          </h1>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
            Practice DSA problems, track your progress, and sync
            with your LeetCode journey — all in one place.
          </p>
          <div className="flex items-center justify-center gap-4 mt-10">
            <Link
              to="/login"
              className="bg-green-500 text-black px-8 py-3 rounded-xl font-semibold hover:bg-green-600 transition"
            >
              Get Started
            </Link>
            <Link
              to="/login"
              className="bg-zinc-900 border border-zinc-800 px-8 py-3 rounded-xl font-semibold hover:bg-zinc-800 transition"
            >
              View Problems
            </Link>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
            <h2 className="text-xl font-semibold mb-3">
              Practice
            </h2>
            <p className="text-zinc-400 leading-relaxed">
              Solve curated problems with a built-in editor.
              Run code and submit against visible and hidden
              testcases.
            </p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
            <h2 className="text-xl font-semibold mb-3">
              Track Progress
            </h2>
            <p className="text-zinc-400 leading-relaxed">
              Monitor solved problems, streaks, topic stats,
              and submission history on your dashboard.
            </p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
            <h2 className="text-xl font-semibold mb-3">
              LeetCode Sync
            </h2>
            <p className="text-zinc-400 leading-relaxed">
              Connect your LeetCode username to pull external
              stats alongside your Code Climb activity.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LandingPage;
