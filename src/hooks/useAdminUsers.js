/**
 * useAdminUsers.js
 *
 * Paginated/searchable user list plus the "Login As" impersonation action,
 * for the admin console's user-management section.
 *
 * Extracted from src/pages/AdminConsolePage.jsx (Staff review §4/§9/#12).
 * Extended (plan 003) with the five row-level management actions:
 * suspend/activate/delete/reset-progress/change-role. Follows the same
 * busyIds-per-row pattern as useAdminVerificationQueue.js's approve/reject
 * actions, for consistency with the rest of the admin console.
 */
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { apiFetch } from "../services/api";
import { getPostLoginDestination } from "../utils/roleRedirect";

export const USERS_PAGE_SIZE = 10;

export function useAdminUsers({ initialCollege = null, initialCollegeName = null } = {}) {
  const [users, setUsers] = useState([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersPage, setUsersPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState(""); // debounced value actually sent
  const [impersonatingId, setImpersonatingId] = useState(null);
  // Plan 005's "View students" deep-link from the Colleges page — arrives
  // as ?college=<id>&collegeName=<display name> (the id is what the API
  // filter needs; the name is just so this page can show a "Filtered to:
  // MIT ×" badge without a second round-trip to look it up).
  const [collegeFilter, setCollegeFilter] = useState(initialCollege);
  const [collegeName, setCollegeName] = useState(initialCollegeName);
  // Tracks which row is mid-request for the five management actions below,
  // so its own row shows a spinner without disabling the rest of the table:
  // { [id]: "suspend" | "activate" | "delete" | "reset-progress" | "role" }
  const [busyIds, setBusyIds] = useState({});

  // Debounce free-text search so every keystroke doesn't fire a request.
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setUsersPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const loadUsers = useCallback(async () => {
    try {
      setUsersLoading(true);
      const params = new URLSearchParams({
        page: String(usersPage),
        limit: String(USERS_PAGE_SIZE),
      });
      if (roleFilter) params.set("role", roleFilter);
      if (search) params.set("search", search);
      if (collegeFilter) params.set("college", collegeFilter);

      const data = await apiFetch(`/api/admin/users?${params.toString()}`);
      setUsers(data.users || []);
      setUsersTotal(data.total || 0);
    } catch (err) {
      toast.error(err.message || "Failed to load users.");
    } finally {
      setUsersLoading(false);
    }
  }, [usersPage, roleFilter, search, collegeFilter]);

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
    loadUsers();
  }, [loadUsers]);

  function setRoleFilterAndResetPage(nextRole) {
    setRoleFilter(nextRole);
    setUsersPage(1);
  }

  function clearCollegeFilter() {
    setCollegeFilter(null);
    setCollegeName(null);
    setUsersPage(1);
  }

  async function loginAs(targetUser) {
    setImpersonatingId(targetUser.id);
    try {
      const data = await apiFetch(`/api/admin/impersonate/${targetUser.id}`, { method: "POST" });
      const destination = getPostLoginDestination(data.impersonating?.role, null);
      // Full reload, not client-side navigate — AppContext needs a clean
      // refetch of everything (XP, submissions, solved problems, role,
      // impersonation state) for the new identity, not a partial patch.
      window.location.href = destination;
    } catch (err) {
      toast.error(err.message || "Failed to start impersonation.");
      setImpersonatingId(null);
    }
  }

  function withBusy(id, busyLabel, fn) {
    return async () => {
      setBusyIds((b) => ({ ...b, [id]: busyLabel }));
      try {
        await fn();
      } catch (err) {
        toast.error(err.message || "Action failed.");
      } finally {
        setBusyIds((b) => {
          const next = { ...b };
          delete next[id];
          return next;
        });
      }
    };
  }

  async function suspendUser(id) {
    return withBusy(id, "suspend", async () => {
      await apiFetch(`/api/admin/users/${id}/suspend`, { method: "POST" });
      setUsers((list) => list.map((u) => (u.id === id ? { ...u, status: "suspended" } : u)));
      toast.success("User suspended.");
    })();
  }

  async function activateUser(id) {
    return withBusy(id, "activate", async () => {
      await apiFetch(`/api/admin/users/${id}/activate`, { method: "POST" });
      setUsers((list) => list.map((u) => (u.id === id ? { ...u, status: "active" } : u)));
      toast.success("User activated.");
    })();
  }

  async function deleteUser(id) {
    return withBusy(id, "delete", async () => {
      await apiFetch(`/api/admin/users/${id}`, { method: "DELETE" });
      setUsers((list) => list.filter((u) => u.id !== id));
      setUsersTotal((t) => Math.max(0, t - 1));
      toast.success("User deleted.");
    })();
  }

  async function resetUserProgress(id) {
    return withBusy(id, "reset-progress", async () => {
      await apiFetch(`/api/admin/users/${id}/reset-progress`, { method: "POST" });
      toast.success("Progress reset.");
    })();
  }

  async function changeUserRole(id, newRole) {
    return withBusy(id, "role", async () => {
      await apiFetch(`/api/admin/users/${id}/role`, {
        method: "POST",
        body: JSON.stringify({ role: newRole }),
      });
      setUsers((list) => list.map((u) => (u.id === id ? { ...u, role: newRole, label: null } : u)));
      toast.success(`Role changed to ${newRole}.`);
    })();
  }

  return {
    users,
    usersTotal,
    usersLoading,
    usersPage,
    setUsersPage,
    roleFilter,
    setRoleFilter: setRoleFilterAndResetPage,
    searchInput,
    setSearchInput,
    collegeFilter,
    collegeName,
    clearCollegeFilter,
    impersonatingId,
    loginAs,
    busyIds,
    suspendUser,
    activateUser,
    deleteUser,
    resetUserProgress,
    changeUserRole,
  };
}