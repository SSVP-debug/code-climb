/**
 * useAdminColleges.js
 *
 * Paginated/searchable/status-filterable college list with per-college
 * aggregate stats, backing the admin console's Colleges page (plan 005).
 * Same shape as useAdminUsers.js's fetch pattern for consistency.
 */
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { apiFetch } from "../services/api";

export const COLLEGES_PAGE_SIZE = 12;

export function useAdminColleges() {
  const [colleges, setColleges] = useState([]);
  const [collegesTotal, setCollegesTotal] = useState(0);
  const [collegesLoading, setCollegesLoading] = useState(true);
  const [collegesPage, setCollegesPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setCollegesPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const loadColleges = useCallback(async () => {
    try {
      setCollegesLoading(true);
      const params = new URLSearchParams({
        page: String(collegesPage),
        limit: String(COLLEGES_PAGE_SIZE),
      });
      if (statusFilter) params.set("status", statusFilter);
      if (search) params.set("search", search);

      const data = await apiFetch(`/api/admin/colleges?${params.toString()}`);
      setColleges(data.colleges || []);
      setCollegesTotal(data.total || 0);
    } catch (err) {
      toast.error(err.message || "Failed to load colleges.");
    } finally {
      setCollegesLoading(false);
    }
  }, [collegesPage, statusFilter, search]);

  useEffect(() => {
    // Same established (if imperfect) pattern as useAdminUsers.js/
    // useAdminDashboardMetrics.js's effects — react-hooks/set-state-in-effect
    // flags it there too. Kept consistent rather than a one-off fix.
    loadColleges();
  }, [loadColleges]);

  function setStatusFilterAndResetPage(nextStatus) {
    setStatusFilter(nextStatus);
    setCollegesPage(1);
  }

  return {
    colleges,
    collegesTotal,
    collegesLoading,
    collegesPage,
    setCollegesPage,
    statusFilter,
    setStatusFilter: setStatusFilterAndResetPage,
    searchInput,
    setSearchInput,
  };
}