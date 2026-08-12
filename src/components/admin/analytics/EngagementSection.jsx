import AnalyticsSection from "./AnalyticsSection";

function StatBlock({ label, value, sublabel }) {
  return (
    <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl px-4 py-3.5">
      <p className="text-zinc-500 text-xs uppercase tracking-wide mb-1.5">{label}</p>
      <p className="text-white text-2xl font-black">{value}</p>
      {sublabel && <p className="text-zinc-600 text-xs mt-1">{sublabel}</p>}
    </div>
  );
}

/**
 * EngagementSection — "Are users returning?" Backs onto
 * GET /api/admin/analytics/active-users (rolling 7/30-day counts) and
 * .../retention (week-over-week %). retentionPercent is explicitly `null`
 * from the backend when there's no prior week to compare against (see
 * adminAnalyticsController.js's comment on that field) — rendered here as
 * "Not enough data yet," never as a fabricated 0%, which would wrongly
 * read as "everyone churned."
 */
export default function EngagementSection({ activeUsers, retention }) {
  const loading = activeUsers.loading || retention.loading;
  const error = activeUsers.error || retention.error;
  const empty = !loading && !error && !activeUsers.data && !retention.data;

  function retry() {
    activeUsers.retry();
    retention.retry();
  }

  return (
    <AnalyticsSection
      title="Engagement"
      question="Are users coming back?"
      loading={loading}
      error={error}
      retry={retry}
      empty={empty}
    >
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatBlock label="Active — 7 days" value={activeUsers.data?.last7Days ?? 0} />
        <StatBlock label="Active — 30 days" value={activeUsers.data?.last30Days ?? 0} />
        <StatBlock
          label="Week-over-week retention"
          value={retention.data?.retentionPercent == null ? "—" : `${retention.data.retentionPercent}%`}
          sublabel={retention.data?.retentionPercent == null ? "Not enough data yet" : undefined}
        />
        <StatBlock
          label="Retained users"
          value={retention.data?.retainedUsers ?? 0}
          sublabel={
            retention.data?.weekN1ActiveUsers
              ? `of ${retention.data.weekN1ActiveUsers} active last week`
              : undefined
          }
        />
      </div>
    </AnalyticsSection>
  );
}
