import RankProgressSection from "./sections/RankProgressSection";
import DailyChallengeSection from "./sections/DailyChallengeSection";
import WelcomeBanner from "./sections/WelcomeBanner";
import ContinueLearningSection from "./sections/ContinueLearningSection";
import WeeklyGoalSection from "./sections/WeeklyGoalSection";
import RecentAchievementCard from "./sections/RecentAchievementCard";
import AdvancedStatsSection from "./sections/AdvancedStatsSection";
import AIInsightsSection from "./sections/AIInsightsSection";
import PublicProfileCard from "./sections/PublicProfileCard";
import ActivityHeatmapCard from "./sections/ActivityHeatmapCard";
import TopicProgressCard from "./sections/TopicProgressCard";
import ContestCountdownCard from "./sections/ContestCountdownCard";

// ── Dashboard grid ──────────────────────────────────────────────────────
// Phase A reflow (unchanged): the original 9 sections are untouched — same
// components, same props, same data. Only the composition changed.
//
// Phase B (this batch): 3 new widgets, all built from data that was
// already flowing through the app — zero new backend endpoints required.
//   - ActivityHeatmapCard reads `activityDates` (already in AppContext)
//   - TopicProgressCard reads `topicStats` (already in AppContext, same
//     field Analytics.jsx's radar chart already uses)
//   - ContestCountdownCard calls the already-existing, already-cached
//     GET /api/contests?status=upcoming endpoint
//
// Row 1 — Greeting                        (full width)
// Row 2 — KPI strip                       (full width, 4-up internally)
// Row 3 — Status & goals: Rank | Weekly Goal | Daily Challenge | Next Contest
// Row 4 — Patterns: Activity Heatmap (wide) | Topic Progress
// Row 5 — Momentum: Continue | AI Insights | Recent Achievement
// Row 6 — Profile snapshot                (full width)
//
// NOTE: Row 6 (PublicProfileCard) duplicates a fair amount of what's on
// the actual Profile page (rank, solved breakdown, topics, a 35-day
// activity grid). Flagged in PROJECT_STATE.md as an out-of-scope finding
// for a future pass — not touched here.

function DashboardSections() {
  return (
    <div className="space-y-6">
      <WelcomeBanner />

      <AdvancedStatsSection />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <RankProgressSection />
        <WeeklyGoalSection />
        <DailyChallengeSection />
        <ContestCountdownCard />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ActivityHeatmapCard />
        <TopicProgressCard />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ContinueLearningSection />
        <AIInsightsSection />
        <RecentAchievementCard />
      </div>

      <PublicProfileCard />
    </div>
  );
}

export default DashboardSections;