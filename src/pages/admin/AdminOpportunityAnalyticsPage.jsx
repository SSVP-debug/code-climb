import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { RefreshCw, AlertTriangle } from "lucide-react";
import PageMeta from "../../components/seo/PageMeta";
import { fetchOpportunityAnalyticsAdmin } from "../../services/opportunityApi";

const SOURCE_LABELS = {
  whatsapp: "WhatsApp",
  discord: "Discord",
  linkedin: "LinkedIn",
  direct: "Direct",
  other: "Other",
};

function StatCard({ label, value, sublabel }) {
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3">
      <p className="text-[var(--muted-foreground)] text-[11px] uppercase tracking-wide">{label}</p>
      <p className="text-[var(--foreground)] text-2xl font-black mt-1">{value}</p>
      {sublabel && <p className="text-[var(--muted-foreground)] text-[11px] mt-0.5">{sublabel}</p>}
    </div>
  );
}

export default function AdminOpportunityAnalyticsPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  function load() {
    setLoading(true);
    setError(null);
    fetchOpportunityAnalyticsAdmin(id)
      .then(setData)
      .catch(() => setError("Failed to load analytics."))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount pattern used throughout this codebase's admin hooks (see src/hooks/useAdminProblems.js's fuller write-up); load()'s setState calls happen after its own await, not synchronously here.
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const sourceData = data
    ? Object.entries(data.sourceBreakdown || {}).map(([key, count]) => ({
        source: SOURCE_LABELS[key] || key,
        count,
      }))
    : [];

  return (
    <div>
      <PageMeta title="Opportunity Analytics · Admin · Code Club" path="/admin/opportunities" />

      <Link to="/admin/opportunities" className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition">
        ← Opportunities
      </Link>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-[var(--theme-primary,#2dd4bf)] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <AlertTriangle size={24} className="text-amber-400" />
          <p className="text-[var(--muted-foreground)] text-sm">{error}</p>
          <button
            onClick={load}
            className="flex items-center gap-1.5 text-xs font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] border border-[var(--border-strong)] rounded-full px-3 py-1 transition"
          >
            <RefreshCw size={11} /> Retry
          </button>
        </div>
      ) : (
        <>
          <div className="mt-3 mb-6">
            <h1 className="text-xl font-bold text-[var(--foreground)]">{data.ccId}</h1>
            <p className="text-[var(--muted-foreground)] text-sm">{data.title}</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
            <StatCard label="Views" value={data.viewCount.toLocaleString()} />
            <StatCard label="Apply clicks" value={data.applyClickCount.toLocaleString()} />
            <StatCard
              label="Application click rate"
              value={data.clickThroughRate !== null ? `${data.clickThroughRate}%` : "—"}
              sublabel={data.clickThroughRate === null ? "No views yet" : undefined}
            />
          </div>

          <div>
            <h2 className="text-xs uppercase tracking-widest text-[var(--muted-foreground)] font-semibold mb-3">
              Traffic by source
            </h2>
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3">
              {sourceData.every((s) => s.count === 0) ? (
                <p className="text-[var(--muted-foreground)] text-sm py-8 text-center">No apply clicks recorded yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={sourceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-strong)" vertical={false} />
                    <XAxis dataKey="source" stroke="var(--muted-foreground)" fontSize={12} />
                    <YAxis stroke="var(--muted-foreground)" fontSize={12} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ background: "var(--surface-elevated)", border: "1px solid var(--border-strong)", borderRadius: 8 }}
                      labelStyle={{ color: "var(--foreground)" }}
                    />
                    <Bar dataKey="count" fill="#2dd4bf" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}