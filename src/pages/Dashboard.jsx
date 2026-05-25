import { useEffect } from "react";

import DashboardSections
from "../components/dashboard/DashboardSections";

function Dashboard() {

  useEffect(() => {

    // Save joined date once
    if (
      !localStorage.getItem(
        "joinedDate"
      )
    ) {

      localStorage.setItem(
        "joinedDate",
        new Date().toLocaleDateString()
      );

    }

  }, []);

  return (

    <DashboardLayout>

      <div className="p-8 space-y-8">
        <DashboardSections />

        {/* Rank Progress */}
        <RankProgressSection />

        {/* Daily Challenge */}
        <DailyChallengeSection />

        {/* Basic Stats */}
        <StatsSection />

        {/* Advanced Stats */}
        <AdvancedStatsSection />

        {/* Language Usage */}
        <LanguageChart />

        {/* Topic Mastery */}
        <TopicMasteryChart />

        {/* AI Insights */}
        <AIInsightsSection />

        {/* Achievements */}
        <AchievementGallery />

        {/* Public Profile */}
        <PublicProfileCard />

      </div>

    </DashboardLayout>

  );
}

export default Dashboard;