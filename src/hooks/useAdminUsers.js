/**
 * useAdminUsers.js
 *
 * Paginated/searchable user list plus the "Login As" impersonation action,
 * for the admin console's user-management section.
 *
 * Extracted from src/pages/AdminConsolePage.jsx (Staff review §4/§9/#12).
 */
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { apiFetch } from "../services/api";
import { getPostLoginDestination } from "../utils/roleRedirect";

export const USERS_PAGE_SIZE = 10;

export function useAdminUsers() {
  const [users, setUsers] = useState([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersPage, setUsersPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState(""); // debounced value actually sent
  const [impersonatingId, setImpersonatingId] = useState(null);

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

      const data = await apiFetch(`/api/admin/users?${params.toString()}`);
      setUsers(data.users || []);
      setUsersTotal(data.total || 0);
    } catch (err) {
      toast.error(err.message || "Failed to load users.");
    } finally {
      setUsersLoading(false);
    }
  }, [usersPage, roleFilter, search]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  function setRoleFilterAndResetPage(nextRole) {
    setRoleFilter(nextRole);
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
    impersonatingId,
    loginAs,
  };
}
