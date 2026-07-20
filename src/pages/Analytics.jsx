/**
 * Analytics — the student's personal performance dashboard.
 *
 * This file used to be 405 lines with all the derived-stat computation
 * (rank, acceptance rate, velocity, radar data, ...) and every card/chart
 * inlined together (Staff review §4/§9/#12). It's now composition:
 *   - useAnalyticsStats → all the useMemo-derived numbers
 *   - components/analytics/* → each card/chart
 */
import DashboardLayout from "../layouts/DashboardLayout";
import { useAppContext } from "../hooks/useAppContext";
import { useAnalyticsStats } from "../hooks/useAnalyticsStats";
import AnalyticsStatsGrid from "../components/analytics/AnalyticsStatsGrid";
import TopicBreakdownCard from "../components/analytics/TopicBreakdownCard";
import LanguageUsageCard from "../components/analytics/LanguageUsageCard";
import RecentSubmissionsCard from "../components/analytics/RecentSubmissionsCard";
import SolveVelocityChart from "../components/analytics/SolveVelocityChart";
import TopicCoverageRadar from "../components/analytics/TopicCoverageRadar";

function Analytics() {
  const {
    solvedProblems,
    submissions,
    topicStats,
    currentStreak,
    longestStreak,
    recentActivity,
  } = useAppContext();

  const stats = useAnalyticsStats({ solvedProblems, submissions, topicStats, recentActivity });

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold">Analytics</h1>
          <p className="text-zinc-400 mt-2">Your coding performance at a glance</p>
        </div>

        <AnalyticsStatsGrid
          rank={stats.rank}
          level={stats.level}
          acceptanceRate={stats.acceptanceRate}
          averageRuntime={stats.averageRuntime}
          currentStreak={currentStreak}
          longestStreak={longestStreak}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TopicBreakdownCard topicStats={topicStats} strongestTopic={stats.strongestTopic} />
          <LanguageUsageCard languageStats={stats.languageStats} favoriteLanguage={stats.favoriteLanguage} />
        </div>

        <RecentSubmissionsCard submissions={submissions} />
        <SolveVelocityChart velocityData={stats.velocityData} />
        <TopicCoverageRadar radarData={stats.radarData} />
      </div>
    </DashboardLayout>
  );
}

export default Analytics;
