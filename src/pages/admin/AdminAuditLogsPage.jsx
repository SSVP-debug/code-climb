import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { ChevronDown, Shield } from "lucide-react";
import PageMeta from "../../components/seo/PageMeta";
import { apiFetch } from "../../services/api";
import { formatAuditAction, formatAuditTarget, getAuditActionTone } from "../../utils/auditLogFormat";

const LOGS_PAGE_SIZE = 20;

const TONE_DOT = {
  destructive: "bg-verdict-reject",
  positive: "bg-verdict-accept",
  neutral: "bg-zinc-600",
};

const TONE_TEXT = {
  destructive: "text-verdict-reject",
  positive: "text-verdict-accept",
  neutral: "text-white",
};

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

function formatDay(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

function dayKey(d) {
  if (!d) return "unknown";
  const date = new Date(d);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

// Command Center transformation, Phase 9: "operational audit trail", not a
// database dump. Same data-fetching logic as before (filters, pagination,
// GET /api/admin/audit-logs) — only the presentation changes, from a flat
// <table> to a day-grouped vertical timeline. `details` (already recorded
// by services/adminAuditLog.js on every write, previously never rendered
// anywhere in the UI) is now shown inline per entry when present.
//
// JARVIS pass, spec §13: WHO/WHAT/TARGET/WHEN now sit in their own visual
// slots (actor line, tone-colored action verb, monospace target, and a
// right-aligned timestamp) instead of one prose sentence — reads like an
// event stream, not a table row wrapped in a card. Metadata stays
// secondary (collapsed) until expanded, exactly as before.
function AuditLogEntry({ log }) {
  const [expanded, setExpanded] = useState(false);
  const hasDetails = log.details && Object.keys(log.details).length > 0;
  const target = formatAuditTarget(log);
  const tone = getAuditActionTone(log.action);

  return (
    <div className="relative pl-5">
      <span
        className={`absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-ink-950 ${TONE_DOT[tone]}`}
        aria-hidden="true"
      />
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <p className="text-[11px] font-mono-ui text-zinc-500 truncate">{log.adminEmail}</p>
            <p className={`text-sm font-semibold mt-0.5 ${TONE_TEXT[tone]}`}>{formatAuditAction(log.action)}</p>
            {target && <p className="text-zinc-500 text-xs font-mono-ui mt-0.5">{target}</p>}
          </div>
          <span className="text-zinc-600 text-xs whitespace-nowrap shrink-0 font-mono-ui">
            {formatTimestamp(log.createdAt)}
          </span>
        </div>

        {hasDetails && (
          <div className="mt-2 pt-2 border-t border-zinc-800/80">
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="flex items-center gap-1 text-[11px] text-zinc-500 hover:text-zinc-300 transition"
            >
              <ChevronDown size={11} className={`transition-transform ${expanded ? "rotate-180" : ""}`} />
              {expanded ? "Hide metadata" : "Show metadata"}
            </button>
            {expanded && (
              <pre className="mt-2 text-[11px] text-zinc-400 bg-black/30 rounded-lg px-3 py-2 overflow-x-auto">
                {JSON.stringify(log.details, null, 2)}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

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

  // Group into day buckets for the timeline headers — purely a display
  // grouping over the same page of results the API already returned, no
  // extra request.
  const dayGroups = [];
  for (const log of logs) {
    const key = dayKey(log.createdAt);
    let group = dayGroups.find((g) => g.key === key);
    if (!group) {
      group = { key, label: formatDay(log.createdAt), logs: [] };
      dayGroups.push(group);
    }
    group.logs.push(log);
  }

  return (
    <>
      <PageMeta title="Audit Logs — Admin Console — Code Club" description="Operational audit trail of admin actions." />
      <div className="max-w-4xl mx-auto">
        <div className="flex items-start gap-3 mb-8">
          <div className="mt-0.5 flex items-center justify-center h-9 w-9 rounded-lg bg-zinc-900 border border-zinc-800 shrink-0">
            <Shield size={16} className="text-zinc-500" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">Operational Audit Trail</h1>
            <p className="text-zinc-500 text-sm">
              {total > 0 ? `${total} recorded action${total === 1 ? "" : "s"}` : "No admin actions recorded yet."}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 mb-6">
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
          <div className="flex flex-col gap-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-xl bg-zinc-900/60 border border-zinc-800 animate-pulse" />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <p className="text-zinc-600 text-sm">No matching audit log entries.</p>
        ) : (
          <div className="flex flex-col gap-6">
            {dayGroups.map((group) => (
              <div key={group.key}>
                <p className="text-[11px] uppercase tracking-widest text-zinc-600 font-semibold mb-3">
                  {group.label}
                </p>
                <div className="relative pl-1">
                  <div className="absolute left-[4px] top-2 bottom-2 w-px bg-zinc-800" aria-hidden="true" />
                  <div className="flex flex-col gap-3">
                    {group.logs.map((log) => (
                      <AuditLogEntry key={log._id} log={log} />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {total > LOGS_PAGE_SIZE && (
          <div className="flex items-center justify-between mt-6 text-xs text-zinc-500">
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
