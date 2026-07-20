/**
 * PublicProfile — the recruiter/public-facing solve-history page at /u/:username.
 *
 * This file used to be 455 lines with every section (header, stats,
 * achievements, difficulty breakdown, topic coverage, LeetCode, heatmap)
 * inlined together (Staff review §4/§9/#12). It's now just composition —
 * each section is its own component under src/components/profile/public/.
 */
import { useParams } from "react-router-dom";
import PageMeta from "../components/seo/PageMeta";
import ActivityHeatmap from "../components/profile/ActivityHeatmap";
import { usePublicProfile } from "../hooks/usePublicProfile";
import PublicProfileHeader from "../components/profile/public/PublicProfileHeader";
import PublicProfileStats from "../components/profile/public/PublicProfileStats";
import PublicProfileAchievements from "../components/profile/public/PublicProfileAchievements";
import DifficultyBreakdown from "../components/profile/public/DifficultyBreakdown";
import TopicCoverageSection from "../components/profile/public/TopicCoverageSection";
import LeetCodeStatsCard from "../components/profile/public/LeetCodeStatsCard";

function PublicProfile() {
  const { username } = useParams();
  const { profile, loading, error } = usePublicProfile(username);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-10">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <PageMeta
        title={`${profile.displayName || profile.username} · Code Club Profile`}
        description={`Level ${profile.level} · ${profile.solvedCount} problems solved · ${profile.currentStreak} day streak on Code Club.`}
        path={`/u/${profile.username}`}
      />
      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
          <PublicProfileHeader profile={profile} />
          <PublicProfileStats profile={profile} />
          <PublicProfileAchievements achievements={profile.achievements} />
          <DifficultyBreakdown solvedDifficulty={profile.solvedDifficulty} />
          <TopicCoverageSection profile={profile} />
          <LeetCodeStatsCard leetcode={profile.leetcode} />
          <ActivityHeatmap activityDates={profile.activityDates} />
        </div>
      </div>
    </div>
  );
}

export default PublicProfile;
