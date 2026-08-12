import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Activity, ArrowRight } from "lucide-react";
import { apiFetch } from "../../../services/api";
import { formatAuditAction, getAuditActionTone } from "../../../utils/auditLogFormat";

const ACTIVITY_LIMIT = 6;

const TONE_DOT = {
  destructive: "bg-verdict-reject",
  positive: "bg-verdict-accept",
  neutral: "bg-zinc-600",
};

function formatTime(d) {
  if (!d) return "—";
  return new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

/**
 * PlatformActivitySection — Overview Phase 3's "recent activity" ask,
 * built from real data rather than a synthetic feed: the last few entries
 * from the same AdminAuditLog collection the Audit Logs page reads via
 * GET /api/admin/audit-logs (limit=6, page 1, no filters). No new
 * endpoint. If the platform genuinely has no recorded actions yet, this
 * renders an honest empty state instead of fabricating events.
 */
export default function PlatformActivitySection() {
  const [logs, setLogs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setFailed(false);
        const data = await apiFetch(`/api/admin/audit-logs?limit=${ACTIVITY_LIMIT}&page=1`);
        if (!cancelled) setLogs(data.logs || []);
      } catch {
        if (!cancelled) setFailed(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs uppercase tracking-widest text-zinc-500 font-semibold">Platform activity</h2>
        <Link
          to="/admin/audit-logs"
          className="flex items-center gap-1 text-xs text-zinc-500 hover:text-white transition"
        >
          View full audit trail
          <ArrowRight size={11} />
        </Link>
      </div>

      {loading && !logs ? (
        <div className="flex flex-col gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-11 rounded-lg bg-zinc-900/60 border border-zinc-800 animate-pulse" />
          ))}
        </div>
      ) : failed ? (
        <p className="text-zinc-600 text-sm">Couldn't load recent activity.</p>
      ) : !logs || logs.length === 0 ? (
        <div className="flex items-center gap-2.5 rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3.5 text-sm text-zinc-500">
          <Activity size={15} className="text-zinc-600 shrink-0" />
          No admin actions recorded yet.
        </div>
      ) : (
        <div className="relative pl-4">
          <div className="absolute left-[3px] top-1.5 bottom-1.5 w-px bg-zinc-800" aria-hidden="true" />
          <div className="flex flex-col gap-3.5">
            {logs.map((log) => (
              <div key={log._id} className="relative">
                <span
                  className={`absolute -left-4 top-1 h-1.5 w-1.5 rounded-full ${TONE_DOT[getAuditActionTone(log.action)]}`}
                  aria-hidden="true"
                />
                <p className="text-sm text-zinc-200">
                  <span className="text-zinc-500">{log.adminEmail}</span> · {formatAuditAction(log.action)}
                </p>
                <p className="text-zinc-600 text-xs">{formatTime(log.createdAt)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
