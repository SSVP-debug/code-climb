import { Link } from "react-router-dom";
import { AlertTriangle, CheckCircle2, Clock, ShieldAlert } from "lucide-react";
import { useAggregatePlatformStatus } from "../../../hooks/useAggregatePlatformStatus";

const HEADLINE_COPY = {
  operational: { title: "All systems operational", tone: "text-verdict-accept", icon: CheckCircle2 },
  degraded: { title: "Degraded performance detected", tone: "text-verdict-pending", icon: AlertTriangle },
  incident: { title: "Active incident", tone: "text-verdict-reject", icon: ShieldAlert },
};

/**
 * CommandCenterHero — spec §5/§17: a single glanceable strip communicating
 * platform health plus real, actionable alerts, before the operational
 * metric grid. Built entirely from data the app already computes
 * (useAggregatePlatformStatus over /api/admin/system-health, and the
 * verification queue's own pendingCount) — no synthetic incident feed.
 */
export default function CommandCenterHero({ pendingCount = 0 }) {
  const { summary, loading } = useAggregatePlatformStatus();
  const headline = HEADLINE_COPY[summary?.headline] || null;
  const Icon = headline?.icon || Clock;

  const alerts = [];
  if (summary) {
    for (const s of summary.services) {
      if (s.status === "down") {
        alerts.push({ tone: "reject", label: `${s.label} is down`, to: "/admin/system-health" });
      } else if (s.status === "degraded") {
        alerts.push({ tone: "pending", label: `${s.label} is degraded`, to: "/admin/system-health" });
      }
    }
  }
  if (pendingCount > 0) {
    alerts.push({
      tone: "pending",
      label: `${pendingCount} approval${pendingCount === 1 ? "" : "s"} awaiting review`,
      to: "#recruiter-queue",
    });
  }

  return (
    <div className="mb-8 rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900/80 to-ink-900/60 p-5 sm:p-6 relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
        aria-hidden="true"
      />
      <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-mono-ui mb-1">
            Code Club Command Center
          </p>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5">
            {!loading && headline && <Icon size={22} className={headline.tone} />}
            {loading && !summary ? "Initializing…" : headline?.title || "Status unavailable"}
          </h1>
        </div>

        <div className="flex flex-wrap gap-2">
          {alerts.length === 0 && !loading && (
            <span className="text-xs text-zinc-500 border border-zinc-800 rounded-full px-3 py-1.5">
              Nothing needs your attention right now.
            </span>
          )}
          {alerts.map((a, i) => (
            <Link
              key={`${a.label}-${i}`}
              to={a.to}
              className={`flex items-center gap-1.5 text-xs font-medium rounded-full px-3 py-1.5 border transition hover:brightness-110 ${
                a.tone === "reject"
                  ? "text-verdict-reject border-verdict-reject/30 bg-verdict-reject/10"
                  : "text-verdict-pending border-verdict-pending/30 bg-verdict-pending/10"
              }`}
            >
              <AlertTriangle size={12} />
              {a.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
