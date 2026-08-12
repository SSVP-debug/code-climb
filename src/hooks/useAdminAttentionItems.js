/**
 * useAdminAttentionItems.js
 *
 * JARVIS pass, spec §5: "bring [Attention Required] into the global admin
 * shell... use the existing real alert logic." Previously this logic lived
 * only inside AttentionRequiredSection.jsx (Overview page). Extracted here
 * so the Overview section AND the new global AttentionCenter (command bar)
 * read from one source — no risk of the two drifting apart, same principle
 * as auditLogFormat.js.
 *
 * No new endpoints: reduces the same useAggregatePlatformStatus (over
 * GET /api/admin/system-health) and useAdminDashboardMetrics (over
 * GET /api/admin/dashboard-metrics) responses already fetched elsewhere.
 */
import { useMemo } from "react";
import { AlertTriangle, ShieldAlert, UserCheck } from "lucide-react";
import { useAggregatePlatformStatus } from "./useAggregatePlatformStatus";
import { useAdminDashboardMetrics } from "./useAdminDashboardMetrics";

const SERVICE_ICON = { down: ShieldAlert, degraded: AlertTriangle };

export function useAdminAttentionItems() {
  const { summary, loading: healthLoading } = useAggregatePlatformStatus();
  const { metrics, loading: metricsLoading } = useAdminDashboardMetrics();

  const items = useMemo(() => {
    const list = [];

    if (summary) {
      for (const s of summary.services) {
        if (s.status === "down" || s.status === "degraded") {
          list.push({
            id: `service-${s.key}`,
            tone: s.status,
            icon: SERVICE_ICON[s.status],
            label: `${s.label} is ${s.status}`,
            to: "/admin/system-health",
            cta: "Investigate",
          });
        }
      }
    }

    const pendingRecruiters = metrics?.approvals?.pendingRecruiterApprovals || 0;
    if (pendingRecruiters > 0) {
      list.push({
        id: "recruiter-approvals",
        tone: "pending",
        icon: UserCheck,
        label: `${pendingRecruiters} recruiter application${pendingRecruiters === 1 ? "" : "s"} pending`,
        to: "/admin#recruiter-queue",
        cta: "Review",
      });
    }

    const pendingTpos = metrics?.approvals?.pendingTpoApprovals || 0;
    if (pendingTpos > 0) {
      list.push({
        id: "tpo-approvals",
        tone: "pending",
        icon: UserCheck,
        label: `${pendingTpos} college/TPO request${pendingTpos === 1 ? "" : "s"} pending`,
        to: "/admin#tpo-queue",
        cta: "Review",
      });
    }

    return list;
  }, [summary, metrics]);

  return { items, loading: healthLoading || metricsLoading };
}
