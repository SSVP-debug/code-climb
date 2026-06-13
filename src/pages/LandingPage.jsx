import { Link } from "react-router-dom";

function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-5xl mx-auto px-8 py-20">

        <header className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4">Code Club</h1>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
            Practice DSA problems in a themed coding universe. Track your
            progress, build consistency, and develop the skills that get
            you hired.
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
            <h2 className="text-xl font-semibold mb-3">Practice</h2>
            <p className="text-zinc-400 leading-relaxed">
              Solve curated DSA problems with a built-in code editor.
              Run your code and submit against visible and hidden test cases
              across multiple languages.
            </p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
            <h2 className="text-xl font-semibold mb-3">Track Progress</h2>
            <p className="text-zinc-400 leading-relaxed">
              Monitor solved problems, streaks, topic coverage, and
              submission history. Your progress is synced across sessions
              so nothing is ever lost.
            </p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-semibold">Integrations</h2>
              <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded-lg">
                Coming Soon
              </span>
            </div>
            <p className="text-zinc-400 leading-relaxed">
              Connect LeetCode, Codeforces, and more to unlock unified
              cross-platform analytics and a single coding identity
              you can share with recruiters.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}

export default LandingPage;
