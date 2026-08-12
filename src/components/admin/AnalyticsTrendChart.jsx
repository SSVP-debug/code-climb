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
          <h2 className="text-xs uppercase tracking-widest text-zinc-500 font-semibold">{title}</h2>
          <p className="text-zinc-600 text-xs mt-0.5">{description}</p>
        </div>
        <div className="flex items-center gap-2">
          {error && (
            <button
              type="button"
              onClick={retry}
              className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-white border border-zinc-700 rounded-full px-3 py-1 transition"
            >
              <RefreshCw size={11} className={loading ? "animate-spin" : ""} />
              Retry
            </button>
          )}
          <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-1">
            {BUCKET_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setBucket(opt.id)}
                className={`text-xs px-2.5 py-1 rounded-md transition ${
                  bucket === opt.id ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl px-4 py-3">
        {error ? (
          <p className="flex items-center justify-center gap-2 text-verdict-reject text-sm py-8 text-center">
            <AlertTriangle size={14} />
            Couldn't load this trend.
          </p>
        ) : loading ? (
          <p className="text-zinc-600 text-sm py-8 text-center">Loading…</p>
        ) : trend.every((b) => b.count === 0) ? (
          <p className="text-zinc-600 text-sm py-8 text-center">No data in this window yet.</p>
        ) : (
          <>
            <p className="text-white text-lg font-black mb-2">
              {total} <span className="text-zinc-500 text-xs font-normal uppercase tracking-wide">total</span>
            </p>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={trend} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <XAxis
                  dataKey="label"
                  tick={{ fill: "#71717a", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: 8, color: "#fff" }}
                  labelStyle={{ color: "#a1a1aa" }}
                  cursor={{ stroke: "#3f3f46" }}
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