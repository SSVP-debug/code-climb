/**
 * useAdminDashboardMetrics.js
 *
 * Fetches the single-response operational snapshot from
 * GET /api/admin/dashboard-metrics (plan 004) — current-state numbers
 * only, no time-series (that's plan 007/analytics).
 */
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { apiFetch } from "../services/api";

export function useAdminDashboardMetrics() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadMetrics = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiFetch("/api/admin/dashboard-metrics");
      setMetrics(data);
    } catch (err) {
      toast.error(err.message || "Failed to load dashboard metrics.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Same pre-existing pattern as useAdminUsers.js/AdminAuditLogsPage.jsx's
    // effects — react-hooks/set-state-in-effect flags it there too. Kept
    // consistent with that established convention rather than a one-off fix.
    loadMetrics();
  }, [loadMetrics]);

  return { metrics, loading };
}