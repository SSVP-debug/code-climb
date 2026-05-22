import Navbar from "../components/Navbar";
import StatCard from "../components/StatCard";
import HeatmapSection from "../components/HeatmapSection";
import InsightsSection from "../components/InsightsSection";
import RecentActivitySection from "../components/RecentActivitySection";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import DashboardLayout from "../layouts/DashboardLayout";
import { useEffect, useState } from "react";
import { fetchLeetCodeStats } from "../services/leetcode";

function Dashboard() {
  const { user } = useContext(AuthContext);

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [username, setUsername] = useState(
    localStorage.getItem("leetcodeUsername") || ""
  );

  const [isConnected, setIsConnected] = useState(
    !!localStorage.getItem("leetcodeUsername")
  );

  const statsData = stats
    ? [
        {
          title: "Total Solved",
          value: stats.solvedProblem,
          color: "text-white",
        },
        {
          title: "Easy",
          value: stats.easySolved,
          color: "text-green-400",
        },
        {
          title: "Medium",
          value: stats.mediumSolved,
          color: "text-yellow-400",
        },
        {
          title: "Hard",
          value: stats.hardSolved,
          color: "text-red-400",
        },
      ]
    : [];

  useEffect(() => {
    async function getStats() {
      if (!username.trim()) {
        setStats(null);
        setError("");
        return;
      }

      try {
        setLoading(true);
        setError("");

        const data = await fetchLeetCodeStats(username);

        console.log("LeetCode API Data:", data);

        if (data && data.solvedProblem !== undefined) {
          setStats(data);

          localStorage.setItem(
            "leetcodeUsername",
            username
          );

          setError("");
        } else {
          setStats(null);

          setError(
            "Unable to fetch LeetCode stats right now"
          );
        }
      } catch (err) {
        setError("Something went wrong");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    getStats();
  }, [username]);

  return (
    <DashboardLayout>
      <div className="p-8">

        <div className="mb-8">

          <h1 className="text-4xl font-bold">
            Welcome back, {user?.displayName} 👋
          </h1>

          <p className="text-zinc-400 mt-2">
            Let's track and break DSA problems today!
          </p>

        </div>

        {loading && (
          <p className="text-yellow-400 mt-4">
            Loading stats...
          </p>
        )}

        {error && (
          <p className="text-red-400 mt-4">
            {error}
          </p>
        )}

        <div className="mt-6 mb-8">

          {!isConnected ? (

            <div>

              <p className="text-sm text-zinc-400 mb-3">
                Connect your LeetCode account to sync stats
              </p>

              <div className="flex gap-4">

                <input
                  type="text"
                  placeholder="Enter LeetCode username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-zinc-900 border border-zinc-800 px-4 py-3 rounded-xl w-[300px] outline-none focus:border-green-500 transition"
                />

                <button
                  onClick={() => {
                    if (username.trim()) {
                      setIsConnected(true);
                    }
                  }}
                  className="bg-green-500 hover:bg-green-600 transition px-6 py-3 rounded-xl font-semibold text-black"
                >
                  Connect
                </button>

              </div>

            </div>

          ) : (

            <div className="flex items-center gap-4">

              <div className="bg-zinc-900 border border-zinc-800 px-5 py-3 rounded-xl">

                <p className="text-sm text-zinc-400">
                  Connected LeetCode Account
                </p>

                <p className="font-semibold text-green-400">
                  @{username}
                </p>

              </div>

              <button
                onClick={() => {
                  localStorage.removeItem("leetcodeUsername");

                  setUsername("");
                  setIsConnected(false);
                  setStats(null);
                }}
                className="bg-zinc-800 hover:bg-zinc-700 transition px-4 py-3 rounded-xl"
              >
                Disconnect
              </button>

            </div>

          )}

        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

          {statsData.map((stat, index) => (
            <StatCard
              key={index}
              title={stat.title}
              value={stat.value}
              color={stat.color}
            />
          ))}

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

        {/* Progress Insights */}
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
                ✍️ Needs Practice
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
    </DashboardLayout>
  );
}

export default Dashboard;