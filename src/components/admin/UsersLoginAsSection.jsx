import { useState } from "react";
import { X, Users as UsersIcon, ShieldAlert } from "lucide-react";
import Button from "../ui/Button";
import UserActionsMenu from "./UserActionsMenu";
import UserDetailDrawer from "./UserDetailDrawer";
import { USERS_PAGE_SIZE } from "../../hooks/useAdminUsers";
import { useAdminDashboardMetrics } from "../../hooks/useAdminDashboardMetrics";

const ROLE_FILTERS = [
  { id: "", label: "All roles" },
  { id: "student", label: "Student" },
  { id: "recruiter", label: "Recruiter" },
  { id: "tpo", label: "TPO" },
];

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

// Command Center transformation, Phase 4 ("USER INTELLIGENCE"): the table
// itself and its data (useAdminUsers) are unchanged — search, role filter,
// pagination, the five row actions all still work exactly as before. What
// changed is the interaction: rows are now click targets that open
// UserDetailDrawer (a real intelligence panel built only from fields the
// API actually returns — see that file's header comment for the honest
// scope note on what's deliberately NOT in there), and a small header
// strip surfaces two real, already-available numbers instead of zero.
function UsersLoginAsSection({ adminUsers }) {
  const {
    users,
    usersTotal,
    usersLoading,
    usersPage,
    setUsersPage,
    roleFilter,
    setRoleFilter,
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
  } = adminUsers;

  const [selectedUserId, setSelectedUserId] = useState(null);
  const selectedUser = users.find((u) => u.id === selectedUserId) || null;

  // Reuses the same GET /api/admin/dashboard-metrics response Overview's
  // Attention Required section reads — no second endpoint for what's
  // already a platform-wide, non-paginated count.
  const { metrics } = useAdminDashboardMetrics();
  const pendingVerification =
    (metrics?.approvals?.pendingRecruiterApprovals || 0) + (metrics?.approvals?.pendingTpoApprovals || 0);

  return (
    <section className="mb-10">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-2 bg-zinc-900/60 border border-zinc-800 rounded-lg px-3 py-2">
          <UsersIcon size={14} className="text-zinc-500" />
          <span className="text-white text-sm font-bold">{usersTotal}</span>
          <span className="text-zinc-500 text-xs">total users</span>
        </div>
        {pendingVerification > 0 && (
          <div className="flex items-center gap-2 bg-verdict-pending/5 border border-verdict-pending/25 rounded-lg px-3 py-2">
            <ShieldAlert size={14} className="text-verdict-pending" />
            <span className="text-verdict-pending text-sm font-bold">{pendingVerification}</span>
            <span className="text-verdict-pending/80 text-xs">pending verification</span>
          </div>
        )}
      </div>

      {collegeFilter && (
        <div className="flex items-center gap-2 mb-3">
          <span className="inline-flex items-center gap-1.5 text-xs bg-zinc-800 text-zinc-200 rounded-full pl-3 pr-1.5 py-1">
            Filtered to: {collegeName || "selected college"}
            <button
              onClick={clearCollegeFilter}
              aria-label="Clear college filter"
              className="p-0.5 rounded-full hover:bg-zinc-700 transition"
            >
              <X size={12} />
            </button>
          </span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-2 mb-3">
        <input
          type="text"
          placeholder="Search name, email, or username…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-600"
        >
          {ROLE_FILTERS.map((r) => (
            <option key={r.id} value={r.id}>
              {r.label}
            </option>
          ))}
        </select>
      </div>

      {usersLoading ? (
        <p className="text-zinc-600 text-sm">Loading…</p>
      ) : users.length === 0 ? (
        <p className="text-zinc-600 text-sm">No users match that search.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {users.map((u) => (
            <div
              key={u.id}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedUserId(u.id)}
              onKeyDown={(e) => e.key === "Enter" && setSelectedUserId(u.id)}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900/60 border border-zinc-800 rounded-xl px-4 py-3 cursor-pointer transition hover:border-zinc-700"
            >
              <div className="min-w-0">
                <p className="text-white font-semibold text-sm truncate">
                  {u.displayName || u.email}
                  <span className="ml-2 text-[10px] uppercase tracking-wide text-zinc-500 font-normal align-middle">
                    {u.role}
                  </span>
                  {(u.role === "recruiter" || u.role === "tpo") && (
                    <span
                      className={`ml-2 text-[10px] px-1.5 py-0.5 rounded align-middle ${
                        u.verified
                          ? "bg-green-500/10 text-green-400"
                          : "bg-amber-500/10 text-amber-400"
                      }`}
                    >
                      {u.verified ? "verified" : "pending"}
                    </span>
                  )}
                  {u.status === "suspended" && (
                    <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded align-middle bg-red-500/10 text-red-400">
                      suspended
                    </span>
                  )}
                </p>
                <p className="text-zinc-500 text-xs truncate">
                  {u.email}
                  {u.label && ` · ${u.label}`}
                  {u.joinedAt && ` · joined ${formatDate(u.joinedAt)}`}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={impersonatingId === u.id}
                  loading={impersonatingId === u.id}
                  onClick={() => loginAs(u)}
                >
                  Login As
                </Button>
                <UserActionsMenu
                  user={u}
                  busy={busyIds[u.id]}
                  onSuspend={suspendUser}
                  onActivate={activateUser}
                  onDelete={deleteUser}
                  onResetProgress={resetUserProgress}
                  onChangeRole={changeUserRole}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {usersTotal > USERS_PAGE_SIZE && (
        <div className="flex items-center justify-between mt-3 text-xs text-zinc-500">
          <button
            disabled={usersPage <= 1}
            onClick={() => setUsersPage((p) => Math.max(1, p - 1))}
            className="px-2 py-1 rounded hover:bg-zinc-900 disabled:opacity-40"
          >
            ← Prev
          </button>
          <span>
            Page {usersPage} of {Math.ceil(usersTotal / USERS_PAGE_SIZE)}
          </span>
          <button
            disabled={usersPage >= Math.ceil(usersTotal / USERS_PAGE_SIZE)}
            onClick={() => setUsersPage((p) => p + 1)}
            className="px-2 py-1 rounded hover:bg-zinc-900 disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      )}

      <UserDetailDrawer
        user={selectedUser}
        open={Boolean(selectedUser)}
        onClose={() => setSelectedUserId(null)}
        actions={{ impersonatingId, loginAs, busyIds, suspendUser, activateUser, deleteUser, resetUserProgress, changeUserRole }}
      />
    </section>
  );
}

export default UsersLoginAsSection;
