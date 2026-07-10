import RankProgressSection from "./sections/RankProgressSection";

import DailyChallengeSection from "./sections/DailyChallengeSection";

import WelcomeBanner from "./sections/WelcomeBanner";

import ContinueLearningSection from "./sections/ContinueLearningSection";

import WeeklyGoalSection from "./sections/WeeklyGoalSection";

import RecentAchievementCard from "./sections/RecentAchievementCard";

import AdvancedStatsSection from "./sections/AdvancedStatsSection";

import AIInsightsSection from "./sections/AIInsightsSection";

import PublicProfileCard from "./sections/PublicProfileCard";

function DashboardSections() {

  return (

    <div className="space-y-8">

      <WelcomeBanner />

      <RankProgressSection />

      <WeeklyGoalSection />

      <DailyChallengeSection />

      <ContinueLearningSection />

      <AdvancedStatsSection />

      <AIInsightsSection />

      <RecentAchievementCard />

      <PublicProfileCard />

    </div>

  );
}

export default DashboardSections;