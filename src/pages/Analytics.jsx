/**
 * Analytics — the student's personal performance dashboard.
 *
 * This file used to be 405 lines with all the derived-stat computation
 * (rank, acceptance rate, velocity, radar data, ...) and every card/chart
 * inlined together (Staff review §4/§9/#12). It's now composition:
 *   - useAnalyticsStats → all the useMemo-derived numbers
 *   - components/analytics/* → each card/chart
 *
 * Redesign pass: previously every card was a hand-rolled div (not the
 * shared SectionCard primitive Profile/Dashboard use), charts were tinted
 * with a hardcoded green instead of the app's teal brand color, and none
 * of the page's labels ran through the theme word system the rest of the
 * app uses for per-universe vocabulary. All fixed here — see the touched
 * components under components/analytics/ for the per-card changes.
 */
import { useTheme } from "../hooks/useTheme";
import DashboardLayout from "../layouts/DashboardLayout";
import { useAppContext } from "../hooks/useAppContext";
import { useAnalyticsStats } from "../hooks/useAnalyticsStats";
import AnalyticsIdentityCard from "../components/analytics/AnalyticsIdentityCard";
import AnalyticsStatsGrid from "../components/analytics/AnalyticsStatsGrid";
import TopicBreakdownCard from "../components/analytics/TopicBreakdownCard";
import LanguageUsageCard from "../components/analytics/LanguageUsageCard";
import RecentSubmissionsCard from "../components/analytics/RecentSubmissionsCard";
import SolveVelocityChart from "../components/analytics/SolveVelocityChart";
import TopicCoverageRadar from "../components/analytics/TopicCoverageRadar";
import AIInsightsSection from "../components/dashboard/sections/AIInsightsSection";

function Analytics() {
  const { theme } = useTheme();
  const {
    solvedProblems,
    submissions,
    topicStats,
    currentStreak,
    longestStreak,
    recentActivity,
    totalXP,
  } = useAppContext();

  const stats = useAnalyticsStats({ solvedProblems, submissions, topicStats, recentActivity, totalXP });

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold">{theme.words.analytics}</h1>
          <p className="text-[var(--muted-foreground)] mt-2">Your coding performance at a glance</p>
        </div>

        {/* ── Identity: Rank, Level, XP progress ──────────────────────── */}
        <AnalyticsIdentityCard
          rank={stats.rank}
          level={stats.level}
          xpCurrent={stats.xpCurrent}
          xpNeeded={stats.xpNeeded}
          xpPercent={stats.xpPercent}
        />

        {/* ── Quality & momentum stats ─────────────────────────────────── */}
        <AnalyticsStatsGrid
          acceptanceRate={stats.acceptanceRate}
          averageRuntime={stats.averageRuntime}
          currentStreak={currentStreak}
          longestStreak={longestStreak}
          totalSubmissions={stats.totalSubmissions}
        />

        {/* ── AI-generated coaching insight ────────────────────────────── */}
        <AIInsightsSection />

        {/* ── Where your solves are going ──────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TopicBreakdownCard topicStats={topicStats} strongestTopic={stats.strongestTopic} />
          <LanguageUsageCard languageStats={stats.languageStats} favoriteLanguage={stats.favoriteLanguage} />
        </div>

        {/* ── Trends ────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SolveVelocityChart velocityData={stats.velocityData} />
          <TopicCoverageRadar radarData={stats.radarData} />
        </div>

        {/* ── History ───────────────────────────────────────────────────── */}
        <RecentSubmissionsCard submissions={submissions} />
      </div>
    </DashboardLayout>
  );
}

export default Analytics;