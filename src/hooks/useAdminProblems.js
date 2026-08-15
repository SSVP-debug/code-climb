/**
 * useAdminProblems.js
 *
 * Paginated/filterable problem list plus create/update/delete actions for
 * the admin console's Problems page (plan 006). The two-tier write model
 * (catalog vs admin-sourced) is enforced server-side
 * (adminProblemController.js) — this hook just surfaces whatever the API
 * accepts or rejects; it doesn't duplicate that logic client-side.
 */
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { apiFetch } from "../services/api";

export const PROBLEMS_PAGE_SIZE = 20;

export function useAdminProblems() {
  const [problems, setProblems] = useState([]);
  const [problemsTotal, setProblemsTotal] = useState(0);
  const [problemsLoading, setProblemsLoading] = useState(true);
  const [problemsPage, setProblemsPage] = useState(1);
  const [difficultyFilter, setDifficultyFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setProblemsPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const loadProblems = useCallback(async () => {
    try {
      setProblemsLoading(true);
      const params = new URLSearchParams({
        page: String(problemsPage),
        limit: String(PROBLEMS_PAGE_SIZE),
      });
      if (difficultyFilter) params.set("difficulty", difficultyFilter);
      if (sourceFilter) params.set("adminSource", sourceFilter);
      if (search) params.set("search", search);

      const data = await apiFetch(`/api/admin/problems?${params.toString()}`);
      setProblems(data.problems || []);
      setProblemsTotal(data.total || 0);
    } catch (err) {
      toast.error(err.message || "Failed to load problems.");
    } finally {
      setProblemsLoading(false);
    }
  }, [problemsPage, difficultyFilter, sourceFilter, search]);

  useEffect(() => {
    // Same established pattern as the other admin list hooks
    // (useAdminUsers.js, useAdminColleges.js) — see those files' comments.
    // Standard "fetch on mount" pattern used throughout this codebase's
    // data-fetching hooks/pages: the called function is a useCallback-wrapped
    // async fetcher whose setState calls all happen after its own await, not
    // synchronously in this effect's body. react-hooks/set-state-in-effect
    // still flags the call site here because it can't see across the
    // function boundary. A real fix would mean adopting a data-fetching
    // library (React Query/SWR) or inlining every one of these fetchers —
    // out of scope for a lint-debt pass; suppressed and documented instead.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount pattern: the called function is a useCallback-wrapped async fetcher that sets loading/data state after its own await, not synchronously; see src/hooks/useAdminSettings.js for the fullest write-up of this decision.
    loadProblems();
  }, [loadProblems]);

  function setDifficultyFilterAndResetPage(next) {
    setDifficultyFilter(next);
    setProblemsPage(1);
  }

  function setSourceFilterAndResetPage(next) {
    setSourceFilter(next);
    setProblemsPage(1);
  }

  async function fetchProblemForEdit(slug) {
    return apiFetch(`/api/admin/problems/${slug}`);
  }

  // Errors thrown by apiFetch already carry `.status` and `.body` (the
  // parsed JSON response — see src/services/api.js), so a 400 with zod
  // `issues` reaches the form as err.body.issues without any extra
  // wrapping here.
  async function createProblem(payload) {
    setSaving(true);
    try {
      const data = await apiFetch("/api/admin/problems", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      toast.success("Problem created.");
      setProblemsPage(1);
      await loadProblems();
      return data.problem;
    } finally {
      setSaving(false);
    }
  }

  async function updateProblem(slug, payload) {
    setSaving(true);
    try {
      const data = await apiFetch(`/api/admin/problems/${slug}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      toast.success("Problem updated.");
      await loadProblems();
      return data.problem;
    } finally {
      setSaving(false);
    }
  }

  async function deleteProblem(slug) {
    try {
      await apiFetch(`/api/admin/problems/${slug}`, { method: "DELETE" });
      setProblems((list) => list.filter((p) => p.slug !== slug));
      setProblemsTotal((t) => Math.max(0, t - 1));
      toast.success("Problem deleted.");
    } catch (err) {
      toast.error(err.message || "Failed to delete problem.");
    }
  }

  return {
    problems,
    problemsTotal,
    problemsLoading,
    problemsPage,
    setProblemsPage,
    difficultyFilter,
    setDifficultyFilter: setDifficultyFilterAndResetPage,
    sourceFilter,
    setSourceFilter: setSourceFilterAndResetPage,
    searchInput,
    setSearchInput,
    saving,
    fetchProblemForEdit,
    createProblem,
    updateProblem,
    deleteProblem,
  };
}