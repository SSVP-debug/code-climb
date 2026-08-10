import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { useAggregatePlatformStatus } from "../../../hooks/useAggregatePlatformStatus";

// Spec §5/§21: "significantly more sophisticated than simple green dots,"
// but still restrained — one pill, a live pulse when healthy, and a
// hover/click panel with the real per-service breakdown behind it.
const HEADLINE_STYLES = {
  operational: {
    dot: "bg-verdict-accept",
    ring: "bg-verdict-accept/30",
    text: "text-verdict-accept",
    pillBorder: "border-verdict-accept/20",
  },
  degraded: {
    dot: "bg-verdict-pending",
    ring: "bg-verdict-pending/30",
    text: "text-verdict-pending",
    pillBorder: "border-verdict-pending/20",
  },
  incident: {
    dot: "bg-verdict-reject",
    ring: "bg-verdict-reject/30",
    text: "text-verdict-reject",
    pillBorder: "border-verdict-reject/20",
  },
  unknown: {
    dot: "bg-zinc-500",
    ring: "bg-zinc-500/20",
    text: "text-zinc-400",
    pillBorder: "border-zinc-700",
  },
};

const SERVICE_DOT = {
  up: "bg-verdict-accept",
  degraded: "bg-verdict-pending",
  down: "bg-verdict-reject",
  unknown: "bg-zinc-500",
  unavailable: "bg-zinc-500",
};

export default function SystemStatusPill({ className = "" }) {
  const { summary, loading, lastFetchedAt, refresh } = useAggregatePlatformStatus();
  const [open, setOpen] = useState(false);

  const headline = summary?.headline || "unknown";
  const styles = HEADLINE_STYLES[headline] || HEADLINE_STYLES.unknown;

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full border bg-ink-900/80 ${styles.pillBorder} hover:brightness-110 transition`}
        aria-haspopup="true"
        aria-expanded={open}
      >
        <span className="relative flex h-2 w-2">
          {headline === "operational" && (
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${styles.ring}`} />
          )}
          <span className={`relative inline-flex rounded-full h-2 w-2 ${styles.dot}`} />
        </span>
        <span className={`text-xs font-mono-ui font-medium ${styles.text} hidden sm:inline`}>
          {loading && !summary ? "Checking systems…" : summary?.label || "Status unknown"}
        </span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-72 z-50 rounded-xl border border-zinc-800 bg-ink-900/95 backdrop-blur-xl shadow-2xl shadow-black/50 p-3 animate-fadeIn">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold">
                Live system status
              </span>
              <button
                type="button"
                onClick={refresh}
                disabled={loading}
                className="text-zinc-500 hover:text-white transition"
                aria-label="Refresh system status"
              >
                <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
              </button>
            </div>
            <ul className="space-y-1.5">
              {(summary?.services || []).map((s) => (
                <li key={s.key} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 text-zinc-300">
                    <span className={`h-1.5 w-1.5 rounded-full ${SERVICE_DOT[s.status] || SERVICE_DOT.unknown}`} />
                    {s.label}
                  </span>
                  <span className="text-zinc-500 uppercase tracking-wide text-[10px]">{s.status}</span>
                </li>
              ))}
              {!summary && <li className="text-zinc-600 text-xs">No data yet.</li>}
            </ul>
            {lastFetchedAt && (
              <p className="mt-2 pt-2 border-t border-zinc-800 text-[10px] text-zinc-600">
                Checked {lastFetchedAt.toLocaleTimeString()} · full breakdown on System Health
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
