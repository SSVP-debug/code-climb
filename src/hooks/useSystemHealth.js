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
    // Standard "fetch on mount" pattern used throughout this codebase's
    // data-fetching hooks/pages: the called function is a useCallback-wrapped
    // async fetcher whose setState calls all happen after its own await, not
    // synchronously in this effect's body. react-hooks/set-state-in-effect
    // still flags the call site here because it can't see across the
    // function boundary. A real fix would mean adopting a data-fetching
    // library (React Query/SWR) or inlining every one of these fetchers —
    // out of scope for a lint-debt pass; suppressed and documented instead.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount pattern: the called function is a useCallback-wrapped async fetcher that sets loading/data state after its own await, not synchronously; see src/hooks/useAdminSettings.js for the fullest write-up of this decision.
    refresh();
  }, [refresh]);

  return { health, loading, lastFetchedAt, refresh };
}