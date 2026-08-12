import { Link } from "react-router-dom";
import { AlertTriangle, ArrowRight, CheckCircle2, ShieldAlert, UserCheck } from "lucide-react";
import { useAggregatePlatformStatus } from "../../../hooks/useAggregatePlatformStatus";
import { useAdminDashboardMetrics } from "../../../hooks/useAdminDashboardMetrics";

const SERVICE_TONE = {
  down: { icon: ShieldAlert, cls: "border-verdict-reject/25 bg-verdict-reject/5 text-verdict-reject" },
  degraded: { icon: AlertTriangle, cls: "border-verdict-pending/25 bg-verdict-pending/5 text-verdict-pending" },
};

/**
 * AttentionRequiredSection — Command Center transformation, Overview
 * Phase 3. Distinct from CommandCenterHero's alert chips (which live in
 * the top status strip): this is a dedicated "what do I need to act on"
 * list, each row a real actionable item with a real destination. Built
 * entirely from data already fetched elsewhere on this page
 * (useAggregatePlatformStatus over /api/admin/system-health,
 * useAdminDashboardMetrics over /api/admin/dashboard-metrics) — no new
 * endpoint, no synthetic incident feed.
 */
export default function AttentionRequiredSection() {
  const { summary } = useAggregatePlatformStatus();
  const { metrics } = useAdminDashboardMetrics();

  const items = [];

  if (summary) {
    for (const s of summary.services) {
      if (s.status === "down" || s.status === "degraded") {
        items.push({
          id: `service-${s.key}`,
          tone: s.status,
          icon: SERVICE_TONE[s.status].icon,
          label: `${s.label} is ${s.status}`,
          to: "/admin/system-health",
          cta: "Investigate",
        });
      }
    }
  }

  const pendingRecruiters = metrics?.approvals?.pendingRecruiterApprovals || 0;
  if (pendingRecruiters > 0) {
    items.push({
      id: "recruiter-approvals",
      tone: "pending",
      icon: UserCheck,
      label: `${pendingRecruiters} recruiter application${pendingRecruiters === 1 ? "" : "s"} pending`,
      to: "#recruiter-queue",
      cta: "Review",
    });
  }

  const pendingTpos = metrics?.approvals?.pendingTpoApprovals || 0;
  if (pendingTpos > 0) {
    items.push({
      id: "tpo-approvals",
      tone: "pending",
      icon: UserCheck,
      label: `${pendingTpos} college/TPO request${pendingTpos === 1 ? "" : "s"} pending`,
      to: "#tpo-queue",
      cta: "Review",
    });
  }

  return (
    <section className="mb-10">
      <h2 className="text-xs uppercase tracking-widest text-zinc-500 font-semibold mb-3">
        Attention required
      </h2>

      {items.length === 0 ? (
        <div className="flex items-center gap-2.5 rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3.5 text-sm text-zinc-400">
          <CheckCircle2 size={16} className="text-verdict-accept shrink-0" />
          All systems clear. Nothing requires your attention right now.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((item) => {
            const Icon = item.icon;
            const toneCls =
              item.tone === "down"
                ? "border-verdict-reject/25 bg-verdict-reject/5"
                : item.tone === "degraded"
                ? "border-verdict-pending/25 bg-verdict-pending/5"
                : "border-verdict-pending/20 bg-zinc-900/60";
            return (
              <Link
                key={item.id}
                to={item.to}
                className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 transition hover:brightness-110 ${toneCls}`}
              >
                <span className="flex items-center gap-2.5 text-sm text-zinc-200">
                  <Icon
                    size={16}
                    className={
                      item.tone === "down"
                        ? "text-verdict-reject"
                        : item.tone === "degraded"
                        ? "text-verdict-pending"
                        : "text-verdict-pending"
                    }
                  />
                  {item.label}
                </span>
                <span className="flex items-center gap-1 text-xs font-medium text-zinc-400">
                  {item.cta}
                  <ArrowRight size={12} />
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
