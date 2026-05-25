import RankProgressSection
from "./sections/RankProgressSection";

import DailyChallengeSection
from "./sections/DailyChallengeSection";

import AdvancedStatsSection
from "./sections/AdvancedStatsSection";

import LanguageChart
from "./sections/LanguageChart";

import TopicMasteryChart
from "./sections/TopicMasteryChart";

import AIInsightsSection
from "./sections/AIInsightsSection";

import AchievementGallery
from "./sections/AchievementGallery";

import PublicProfileCard
from "./sections/PublicProfileCard";

function DashboardSections() {

  return (

    <div className="space-y-8">

      <RankProgressSection />

      <DailyChallengeSection />

      <AdvancedStatsSection />

      <LanguageChart />

      <TopicMasteryChart />

      <AIInsightsSection />

      <AchievementGallery />

      <PublicProfileCard />

    </div>

  );
}

export default DashboardSections;