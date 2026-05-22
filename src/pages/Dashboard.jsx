import { useContext, useState } from "react";

import { AuthContext } from "../context/AuthContext";

import DashboardLayout from "../layouts/DashboardLayout";

import useDashboardData from "../hooks/useDashboardData";

import DailyGoal from "../components/dashboard/DailyGoal";

import RecommendationSection from "../components/dashboard/RecommendationSection";

import AchievementsSection from "../components/dashboard/AchievementsSection";

import RecentActivitySection from "../components/dashboard/RecentActivitySection";

import HeatmapSection from "../components/dashboard/HeatmapSection";

import StatsSection from "../components/dashboard/StatsSection";

import ConnectLeetCodeSection from "../components/dashboard/ConnectLeetCodeSection";

function Dashboard() {

  const { user } = useContext(AuthContext);

  const [username, setUsername] = useState(
    localStorage.getItem("leetcodeUsername") || ""
  );

  const [isConnected, setIsConnected] = useState(
    !!localStorage.getItem("leetcodeUsername")
  );

  const {
    stats,
    loading,
    error,
    setStats,
    streak,
    badges,
    recommendation,
    dailySolved,
    recentActivity,
    codeClimbSolved,
  } = useDashboardData(username);

  const statsData = [
    {
      title: "Total Solved",
      value: stats?.solvedProblem || 0,
      color: "text-white",
    },
    {
      title: "Easy",
      value: stats?.easySolved || 0,
      color: "text-green-400",
    },
    {
      title: "Medium",
      value: stats?.mediumSolved || 0,
      color: "text-yellow-400",
    },
    {
      title: "Hard",
      value: stats?.hardSolved || 0,
      color: "text-red-400",
    },
    {
      title: "Current Streak",
      value: `${streak} Days`,
      color: "text-orange-400",
    },
    {
      title: "Code Climb Solved",
      value: codeClimbSolved,
      color: "text-purple-400",
    },
  ];

  return (
    <DashboardLayout>

      <div className="p-8">

        {/* Welcome */}
        <div className="mb-8">

          <h1 className="text-4xl font-bold">
            Welcome back, {user?.displayName} 👋
          </h1>

          <p className="text-zinc-400 mt-2">
            Let's track and break DSA problems today!
          </p>

        </div>

        {/* Loading */}
        {loading && (
          <p className="text-yellow-400 mb-4">
            Loading stats...
          </p>
        )}

        {/* Error */}
        {error && (
          <p className="text-red-400 mb-4">
            {error}
          </p>
        )}

        {/* Connect LeetCode */}
        <ConnectLeetCodeSection
          isConnected={isConnected}
          username={username}
          setUsername={setUsername}
          setIsConnected={setIsConnected}
          setStats={setStats}
        />

        {/* Stats */}
        <StatsSection statsData={statsData} />

        {/* Daily Goal */}
        <DailyGoal dailySolved={dailySolved} />

        {/* Recommendation */}
        <RecommendationSection
          recommendation={recommendation}
        />

        {/* Achievements */}
        <AchievementsSection badges={badges} />

        {/* Heatmap */}
        <HeatmapSection />

        {/* Recent Activity */}
        <RecentActivitySection
          recentActivity={recentActivity}
        />

      </div>

    </DashboardLayout>
  );
}

export default Dashboard;