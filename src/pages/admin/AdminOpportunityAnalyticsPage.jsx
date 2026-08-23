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
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3">
      <p className="text-zinc-500 text-[11px] uppercase tracking-wide">{label}</p>
      <p className="text-white text-2xl font-black mt-1">{value}</p>
      {sublabel && <p className="text-zinc-600 text-[11px] mt-0.5">{sublabel}</p>}
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

      <Link to="/admin/opportunities" className="text-xs text-zinc-500 hover:text-zinc-300 transition">
        ← Opportunities
      </Link>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-[var(--theme-primary,#2dd4bf)] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <AlertTriangle size={24} className="text-amber-400" />
          <p className="text-zinc-400 text-sm">{error}</p>
          <button
            onClick={load}
            className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-white border border-zinc-700 rounded-full px-3 py-1 transition"
          >
            <RefreshCw size={11} /> Retry
          </button>
        </div>
      ) : (
        <>
          <div className="mt-3 mb-6">
            <h1 className="text-xl font-bold text-white">{data.ccId}</h1>
            <p className="text-zinc-500 text-sm">{data.title}</p>
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
            <h2 className="text-xs uppercase tracking-widest text-zinc-500 font-semibold mb-3">
              Traffic by source
            </h2>
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl px-4 py-3">
              {sourceData.every((s) => s.count === 0) ? (
                <p className="text-zinc-600 text-sm py-8 text-center">No apply clicks recorded yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={sourceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis dataKey="source" stroke="#71717a" fontSize={12} />
                    <YAxis stroke="#71717a" fontSize={12} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: 8 }}
                      labelStyle={{ color: "#e4e4e7" }}
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
