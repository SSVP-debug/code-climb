import PageMeta from "../../components/seo/PageMeta";
import AnalyticsTrendChart from "../../components/admin/AnalyticsTrendChart";
import EngagementSection from "../../components/admin/analytics/EngagementSection";
import ProblemPerformanceSection from "../../components/admin/analytics/ProblemPerformanceSection";
import PlatformUsageSection from "../../components/admin/analytics/PlatformUsageSection";
import { useAdminAnalytics } from "../../hooks/useAdminAnalytics";

// Command Center transformation, Phase 7: the previous version of this
// page was a literal placeholder ("Coming soon.") even though the backend
// (adminAnalyticsController.js) and this page's own data hook
// (useAdminAnalytics.js) were fully implemented and tested — the one page
// in this pass that needed real construction, not a reskin. Organized
// around the five real questions an admin actually has, each section
// fetching and failing independently (per useAdminAnalytics.js's own
// design intent — a slow query never blocks the rest of the page). No new
// endpoint, no fabricated metric: every chart/list below maps 1:1 to an
// already-existing GET /api/admin/analytics/* route.
export default function AdminAnalyticsPage() {
  const { registrations, submissions, activeUsers, retention, problems, languages } = useAdminAnalytics();

  return (
    <>
      <PageMeta title="Analytics — Admin Console — Code Club" description="Platform intelligence: growth, engagement, and coding activity." />
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-black text-white">Platform Intelligence</h1>
          <p className="text-zinc-500 text-sm mt-1">Real usage data, organized around the questions that actually matter.</p>
        </div>

        <AnalyticsTrendChart
          title="User Growth"
          description="How is Code Club growing?"
          metric={registrations}
        />

        <EngagementSection activeUsers={activeUsers} retention={retention} />

        <AnalyticsTrendChart
          title="Coding Activity"
          description="How much coding is happening?"
          metric={submissions}
        />

        <ProblemPerformanceSection problems={problems} />

        <PlatformUsageSection languages={languages} />
      </div>
    </>
  );
}
