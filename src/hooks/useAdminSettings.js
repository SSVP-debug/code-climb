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
    // Same pre-existing set-state-in-effect pattern documented across the
    // other admin hooks (useAdminDashboardMetrics.js etc.) — kept
    // consistent rather than a one-off fix here.
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