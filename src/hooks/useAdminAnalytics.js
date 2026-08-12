/**
 * useAdminAnalytics.js
 *
 * Backs the admin Analytics page (plan 007) — six metrics, each fetched
 * independently and in parallel so a slow query doesn't block the rest of
 * the page from rendering (plan 007 step 6: "don't block the whole page on
 * the slowest query — fetch in parallel, render each section's own loading
 * state"). Registrations/submissions each carry their own bucket selector
 * (daily/weekly/monthly) since they're the only two endpoints that take one.
 */
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { apiFetch } from "../services/api";

function useTrendMetric(endpoint, label) {
  const [bucket, setBucket] = useState("daily");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  // Same data-contract fix as useAdminDashboardMetrics.js: a section that
  // failed to load must be distinguishable from one that genuinely has no
  // data yet, so the Analytics page can render "couldn't load" instead of
  // an empty chart that looks identical to "nothing happened."
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiFetch(`${endpoint}?bucket=${bucket}`);
      setData(result);
    } catch (err) {
      setError(err.message || `Failed to load ${label}.`);
      toast.error(err.message || `Failed to load ${label}.`);
    } finally {
      setLoading(false);
    }
  }, [endpoint, bucket, label]);

  useEffect(() => {
    // Same pre-existing set-state-in-effect pattern as
    // useAdminDashboardMetrics.js/useAdminColleges.js — documented there,
    // kept consistent here rather than a one-off fix.
    load();
  }, [load]);

  return { data, loading, error, bucket, setBucket, retry: load };
}

function useSimpleMetric(endpoint, label) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiFetch(endpoint);
      setData(result);
    } catch (err) {
      setError(err.message || `Failed to load ${label}.`);
      toast.error(err.message || `Failed to load ${label}.`);
    } finally {
      setLoading(false);
    }
  }, [endpoint, label]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, retry: load };
}

export function useAdminAnalytics() {
  const registrations = useTrendMetric("/api/admin/analytics/registrations", "registration trends");
  const submissions = useTrendMetric("/api/admin/analytics/submissions", "submission trends");
  const activeUsers = useSimpleMetric("/api/admin/analytics/active-users", "active user counts");
  const retention = useSimpleMetric("/api/admin/analytics/retention", "retention metric");
  const problems = useSimpleMetric("/api/admin/analytics/problems", "problem popularity");
  const languages = useSimpleMetric("/api/admin/analytics/languages", "language popularity");

  return { registrations, submissions, activeUsers, retention, problems, languages };
}