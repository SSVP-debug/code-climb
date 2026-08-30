import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { AlertTriangle, RefreshCw } from "lucide-react";

const BUCKET_OPTIONS = [
  { id: "daily", label: "Daily" },
  { id: "weekly", label: "Weekly" },
  { id: "monthly", label: "Monthly" },
];

// Shared by the Registrations and Submissions sections (plan 007) — same
// GET .../analytics/{registrations,submissions}?bucket=... response shape
// ({ bucket, trend: [{ label, count }] }), same recharts usage pattern
// already established by SolveVelocityChart.jsx (student-facing Analytics),
// reused here rather than a second bespoke chart implementation.
//
// Command Center audit fix: a failed fetch (data stays null → trend = [])
// and a genuinely empty trend both used to render the same "No data in
// this window yet." — indistinguishable, same anti-pattern as the
// dashboard-metrics "0 on failure" bug. `error` now renders its own state.
function AnalyticsTrendChart({ title, description, metric }) {
  const { data, loading, error, bucket, setBucket, retry } = metric;
  const trend = data?.trend || [];
  const total = trend.reduce((sum, b) => sum + b.count, 0);

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div>
          <h2 className="text-xs uppercase tracking-widest text-[var(--muted-foreground)] font-semibold">{title}</h2>
          <p className="text-[var(--muted-foreground)] text-xs mt-0.5">{description}</p>
        </div>
        <div className="flex items-center gap-2">
          {error && (
            <button
              type="button"
              onClick={retry}
              className="flex items-center gap-1.5 text-xs font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] border border-[var(--border-strong)] rounded-full px-3 py-1 transition"
            >
              <RefreshCw size={11} className={loading ? "animate-spin" : ""} />
              Retry
            </button>
          )}
          <div className="flex gap-1 bg-[var(--surface)] border border-[var(--border)] rounded-lg p-1">
            {BUCKET_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setBucket(opt.id)}
                className={`text-xs px-2.5 py-1 rounded-md transition ${
                  bucket === opt.id ? "bg-[var(--border-strong)] text-[var(--foreground)]" : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3">
        {error ? (
          <p className="flex items-center justify-center gap-2 text-verdict-reject text-sm py-8 text-center">
            <AlertTriangle size={14} />
            Couldn't load this trend.
          </p>
        ) : loading ? (
          <p className="text-[var(--muted-foreground)] text-sm py-8 text-center">Loading…</p>
        ) : trend.every((b) => b.count === 0) ? (
          <p className="text-[var(--muted-foreground)] text-sm py-8 text-center">No data in this window yet.</p>
        ) : (
          <>
            <p className="text-[var(--foreground)] text-lg font-black mb-2">
              {total} <span className="text-[var(--muted-foreground)] text-xs font-normal uppercase tracking-wide">total</span>
            </p>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={trend} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <XAxis
                  dataKey="label"
                  tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: "var(--surface-elevated)", border: "1px solid var(--border-strong)", borderRadius: 8, color: "var(--foreground)" }}
                  labelStyle={{ color: "var(--muted-foreground)" }}
                  cursor={{ stroke: "var(--border-strong)" }}
                />
                <Line type="monotone" dataKey="count" stroke="#2dd4bf" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </>
        )}
      </div>
    </section>
  );
}

export default AnalyticsTrendChart;