/**
 * useAggregatePlatformStatus.js
 *
 * Command Center redesign — the top bar and Overview hero need ONE
 * headline status ("operational" / "degraded" / "incident"), but the only
 * real signal we have is the per-service breakdown already returned by
 * GET /api/admin/system-health (see useSystemHealth.js / adminHealthController.js).
 *
 * This hook does not call anything new. It just reduces the existing
 * {api, db, judge0, storage} statuses into one headline + a short reason,
 * so "sophisticated aggregate indicator" (spec §5) is real math over real
 * data, not a decorative dot.
 */
import { useMemo } from "react";
import { useSystemHealth } from "./useSystemHealth";

const SEVERITY = { up: 0, unknown: 0, unavailable: 0, degraded: 1, down: 2 };

const SERVICE_LABELS = {
  api: "API",
  db: "Database",
  judge0: "Execution (Judge0)",
  storage: "Storage",
};

export function useAggregatePlatformStatus() {
  const { health, loading, lastFetchedAt, refresh } = useSystemHealth();

  const summary = useMemo(() => {
    if (!health) return null;

    const services = ["api", "db", "judge0", "storage"]
      .filter((key) => health[key])
      .map((key) => ({ key, label: SERVICE_LABELS[key], status: health[key].status }));

    const worst = services.reduce(
      (acc, s) => (SEVERITY[s.status] ?? 0) > (SEVERITY[acc.status] ?? 0) ? s : acc,
      services[0] || { status: "unknown" }
    );

    const degraded = services.filter((s) => s.status === "degraded");
    const down = services.filter((s) => s.status === "down");

    let headline = "operational";
    let label = "All systems operational";
    if (down.length > 0) {
      headline = "incident";
      label = `${down.map((s) => s.label).join(", ")} down`;
    } else if (degraded.length > 0) {
      headline = "degraded";
      label = `${degraded.map((s) => s.label).join(", ")} degraded`;
    }

    return { headline, label, services, worst };
  }, [health]);

  return { summary, health, loading, lastFetchedAt, refresh };
}
