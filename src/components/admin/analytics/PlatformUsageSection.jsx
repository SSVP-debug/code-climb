import AnalyticsSection from "./AnalyticsSection";

const BAR_COLORS = ["bg-teal-500/70", "bg-violet-500/70", "bg-sky-500/70", "bg-amber-500/70", "bg-rose-500/70"];

/**
 * PlatformUsageSection — "How is the platform being used?" Backs onto
 * GET /api/admin/analytics/languages, grouped by submission count across
 * every language actually used (see adminAnalyticsController.js's
 * getLanguagePopularity — all submissions, any status, not just accepted).
 */
export default function PlatformUsageSection({ languages }) {
  const data = languages.data?.languages || [];
  const empty = !languages.loading && !languages.error && data.length === 0;
  const total = data.reduce((sum, l) => sum + l.count, 0);

  return (
    <AnalyticsSection
      title="Platform Usage"
      question="Which languages are students actually coding in?"
      loading={languages.loading}
      error={languages.error}
      retry={languages.retry}
      empty={empty}
      emptyLabel="No submissions recorded yet."
    >
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl px-4 py-3.5">
        <div className="flex flex-col gap-3">
          {data.slice(0, 6).map((l, i) => {
            const pct = total > 0 ? Math.round((l.count / total) * 100) : 0;
            return (
              <div key={l.language}>
                <div className="flex items-center justify-between mb-1 text-sm">
                  <span className="text-zinc-200 capitalize">{l.language}</span>
                  <span className="text-zinc-500 text-xs font-mono-ui">
                    {l.count} · {pct}%
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                  <div
                    className={`h-full ${BAR_COLORS[i % BAR_COLORS.length]}`}
                    style={{ width: `${Math.max(2, pct)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AnalyticsSection>
  );
}
