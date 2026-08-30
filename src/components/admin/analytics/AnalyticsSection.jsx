import { AlertTriangle, RefreshCw } from "lucide-react";

/**
 * AnalyticsSection — one shell reused by all five Analytics question-blocks
 * (User Growth / Engagement / Coding Activity / Problem Performance /
 * Platform Usage), so each one gets identical, honest loading/error/empty
 * handling instead of five subtly-different implementations. Mirrors the
 * loading/error/real-data three-state pattern already used on Overview's
 * DashboardMetricsSection and AdminSystemHealthPage — never collapses a
 * failed fetch into an empty-looking chart.
 */
export default function AnalyticsSection({ title, question, loading, error, retry, empty, emptyLabel, children }) {
  return (
    <section className="mb-10">
      <div className="flex items-baseline justify-between gap-3 mb-1">
        <h2 className="text-lg font-black text-[var(--foreground)]">{title}</h2>
        {error && (
          <button
            type="button"
            onClick={retry}
            className="flex items-center gap-1.5 text-xs font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] border border-[var(--border-strong)] rounded-full px-3 py-1 transition shrink-0"
          >
            <RefreshCw size={11} className={loading ? "animate-spin" : ""} />
            Retry
          </button>
        )}
      </div>
      <p className="text-[var(--muted-foreground)] text-sm mb-4">{question}</p>

      {loading && !error ? (
        <div className="h-40 rounded-xl bg-[var(--surface)] border border-[var(--border)] animate-pulse" />
      ) : error ? (
        <div className="flex items-center gap-2.5 rounded-xl border border-verdict-reject/25 bg-verdict-reject/5 px-4 py-3.5 text-sm text-verdict-reject">
          <AlertTriangle size={15} className="shrink-0" />
          Couldn't load this data.
        </div>
      ) : empty ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3.5 text-sm text-[var(--muted-foreground)]">
          {emptyLabel || "No data yet."}
        </div>
      ) : (
        children
      )}
    </section>
  );
}