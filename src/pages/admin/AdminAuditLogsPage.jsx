import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import PageMeta from "../../components/seo/PageMeta";
import { apiFetch } from "../../services/api";

const LOGS_PAGE_SIZE = 20;

function formatTimestamp(d) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Plan 002: real Audit Logs page, replacing the plan-001 placeholder.
// Follows AdminConsolePage's original data-fetching convention (useCallback
// + useEffect + apiFetch) rather than inventing a new one — see
// src/hooks/useAdminUsers.js for the same shape this mirrors.
export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const loadLogs = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        limit: String(LOGS_PAGE_SIZE),
      });
      if (actionFilter) params.set("action", actionFilter);
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);

      const data = await apiFetch(`/api/admin/audit-logs?${params.toString()}`);
      setLogs(data.logs || []);
      setTotal(data.total || 0);
    } catch (err) {
      toast.error(err.message || "Failed to load audit logs.");
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter, startDate, endDate]);

  useEffect(() => {
    // Same shape as useAdminUsers.js's effect (pre-existing pattern this
    // mirrors, not introduced by this file) — react-hooks/set-state-in-effect
    // flags it there too. Leaving it consistent with that established
    // convention rather than a one-off fix; worth revisiting both together.
    loadLogs();
  }, [loadLogs]);

  function updateActionFilter(value) {
    setActionFilter(value);
    setPage(1);
  }

  function updateStartDate(value) {
    setStartDate(value);
    setPage(1);
  }

  function updateEndDate(value) {
    setEndDate(value);
    setPage(1);
  }

  return (
    <>
      <PageMeta title="Audit Logs — Admin Console — Code Club" description="Durable trail of admin actions." />
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-black text-white">Audit Logs</h1>
          <p className="text-zinc-500 text-sm">
            {total > 0 ? `${total} recorded action${total === 1 ? "" : "s"}` : "No admin actions recorded yet."}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <input
            type="text"
            placeholder="Filter by action, e.g. recruiter.approve…"
            value={actionFilter}
            onChange={(e) => updateActionFilter(e.target.value)}
            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
          />
          <input
            type="date"
            aria-label="Start date"
            value={startDate}
            onChange={(e) => updateStartDate(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-600"
          />
          <input
            type="date"
            aria-label="End date"
            value={endDate}
            onChange={(e) => updateEndDate(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-600"
          />
        </div>

        {loading ? (
          <p className="text-zinc-600 text-sm">Loading…</p>
        ) : logs.length === 0 ? (
          <p className="text-zinc-600 text-sm">No matching audit log entries.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-zinc-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-zinc-900/60 text-left text-zinc-500 text-xs uppercase tracking-widest">
                  <th className="px-4 py-2 font-semibold">Admin</th>
                  <th className="px-4 py-2 font-semibold">Action</th>
                  <th className="px-4 py-2 font-semibold">Target</th>
                  <th className="px-4 py-2 font-semibold">When</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log._id} className="border-t border-zinc-800">
                    <td className="px-4 py-2 text-zinc-300">{log.adminEmail}</td>
                    <td className="px-4 py-2 font-mono text-xs text-zinc-400">{log.action}</td>
                    <td className="px-4 py-2 text-zinc-500 text-xs">
                      {log.targetType ? `${log.targetType} · ${log.targetId}` : "—"}
                    </td>
                    <td className="px-4 py-2 text-zinc-500 text-xs whitespace-nowrap">
                      {formatTimestamp(log.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {total > LOGS_PAGE_SIZE && (
          <div className="flex items-center justify-between mt-3 text-xs text-zinc-500">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-2 py-1 rounded hover:bg-zinc-900 disabled:opacity-40"
            >
              ← Prev
            </button>
            <span>
              Page {page} of {Math.ceil(total / LOGS_PAGE_SIZE)}
            </span>
            <button
              disabled={page >= Math.ceil(total / LOGS_PAGE_SIZE)}
              onClick={() => setPage((p) => p + 1)}
              className="px-2 py-1 rounded hover:bg-zinc-900 disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </>
  );
}