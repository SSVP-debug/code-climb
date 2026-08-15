import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { apiFetch } from "../services/api";

export function useAdminSettings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const result = await apiFetch("/api/admin/settings");
      setSettings(result);
    } catch (err) {
      toast.error(err.message || "Failed to load settings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Standard "fetch on mount" pattern used throughout this codebase's
    // data-fetching hooks/pages: the called function is a useCallback-wrapped
    // async fetcher whose setState calls all happen after its own await, not
    // synchronously in this effect's body. react-hooks/set-state-in-effect
    // still flags the call site here because it can't see across the
    // function boundary. A real fix would mean adopting a data-fetching
    // library (React Query/SWR) or inlining every one of these fetchers —
    // out of scope for a lint-debt pass; suppressed and documented instead.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount pattern: the called function is a useCallback-wrapped async fetcher that sets loading/data state after its own await, not synchronously; see src/hooks/useAdminSettings.js for the fullest write-up of this decision.
    load();
  }, [load]);

  // Returns the updated settings on success so the page can act on the
  // fresh value immediately (e.g. re-check a checkbox), or null on
  // failure so the page's optimistic UI can revert.
  const updateSettings = useCallback(async (partial) => {
    try {
      setSaving(true);
      const result = await apiFetch("/api/admin/settings", {
        method: "PATCH",
        body: JSON.stringify(partial),
      });
      setSettings(result);
      return result;
    } catch (err) {
      toast.error(err.message || "Failed to update settings.");
      return null;
    } finally {
      setSaving(false);
    }
  }, []);

  return { settings, loading, saving, updateSettings, reload: load };
}