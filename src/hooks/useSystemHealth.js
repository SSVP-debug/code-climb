import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { apiFetch } from "../services/api";

// Manual refresh only — plan 008 step 7 explicitly says a Refresh button is
// sufficient for v1, no auto-polling. Keeping it that way rather than
// adding a setInterval poll nobody asked for.
export function useSystemHealth() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastFetchedAt, setLastFetchedAt] = useState(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const result = await apiFetch("/api/admin/system-health");
      setHealth(result);
      setLastFetchedAt(new Date());
    } catch (err) {
      toast.error(err.message || "Failed to load system health.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Same pre-existing set-state-in-effect pattern documented in
    // useAdminDashboardMetrics.js/useAdminColleges.js/useAdminAnalytics.js —
    // kept consistent rather than a one-off fix here.
    refresh();
  }, [refresh]);

  return { health, loading, lastFetchedAt, refresh };
}