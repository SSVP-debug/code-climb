import Button from "../ui/Button";
import { USERS_PAGE_SIZE } from "../../hooks/useAdminUsers";

const ROLE_FILTERS = [
  { id: "", label: "All roles" },
  { id: "student", label: "Student" },
  { id: "recruiter", label: "Recruiter" },
  { id: "tpo", label: "TPO" },
];

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
    impersonatingId,
    loginAs,
  } = adminUsers;

  return (
    <section className="mb-10">
      <h2 className="text-xs uppercase tracking-widest text-zinc-500 font-semibold mb-3">
        Users {usersTotal > 0 && `(${usersTotal})`}
      </h2>

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
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900/60 border border-zinc-800 rounded-xl px-4 py-3"
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
                </p>
                <p className="text-zinc-500 text-xs truncate">
                  {u.email}
                  {u.label && ` · ${u.label}`}
                </p>
              </div>
              <Button
                size="sm"
                variant="secondary"
                disabled={impersonatingId === u.id}
                loading={impersonatingId === u.id}
                onClick={() => loginAs(u)}
              >
                Login As
              </Button>
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
    </section>
  );
}

export default UsersLoginAsSection;
