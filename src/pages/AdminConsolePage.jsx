import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import PageMeta from "../components/seo/PageMeta";
import DashboardLayout from "../layouts/DashboardLayout";
import Button from "../components/ui/Button";
import { apiFetch } from "../services/api";
import { getPostLoginDestination } from "../utils/roleRedirect";

const ROLE_FILTERS = [
  { id: "", label: "All roles" },
  { id: "student", label: "Student" },
  { id: "recruiter", label: "Recruiter" },
  { id: "tpo", label: "TPO" },
];

const USERS_PAGE_SIZE = 10;

const VIEW_AS = [
  {
    id: "student",
    label: "Student",
    accent: "border-green-500/30 hover:border-green-500/60",
    icon: "🧑‍💻",
    pages: [{ label: "Dashboard", path: "/dashboard" }],
  },
  {
    id: "recruiter",
    label: "Recruiter",
    accent: "border-sky-500/30 hover:border-sky-500/60",
    icon: "🎯",
    pages: [
      { label: "Candidates", path: "/recruiter/dashboard?tab=candidates" },
      { label: "Sent Tests", path: "/recruiter/dashboard?tab=tests" },
    ],
  },
  {
    id: "tpo",
    label: "TPO",
    accent: "border-violet-500/30 hover:border-violet-500/60",
    icon: "🏫",
    pages: [
      { label: "Overview", path: "/tpo/dashboard?tab=overview" },
      { label: "Students", path: "/tpo/dashboard?tab=students" },
      { label: "Assignments", path: "/tpo/dashboard?tab=assignments" },
    ],
  },
];

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function QueueRow({ title, subtitle, meta, onApprove, onReject, busy }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900/60 border border-zinc-800 rounded-xl px-4 py-3">
      <div className="min-w-0">
        <p className="text-white font-semibold text-sm truncate">{title}</p>
        <p className="text-zinc-500 text-xs truncate">{subtitle}</p>
        {meta && <p className="text-zinc-600 text-[11px] mt-0.5">{meta}</p>}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Button size="sm" variant="secondary" disabled={busy} loading={busy === "reject"} onClick={onReject}>
          Reject
        </Button>
        <Button size="sm" variant="primary" disabled={busy} loading={busy === "approve"} onClick={onApprove}>
          Approve
        </Button>
      </div>
    </div>
  );
}

export default function AdminConsolePage() {
  const [loading, setLoading] = useState(true);
  const [recruiters, setRecruiters] = useState([]);
  const [tpos, setTpos] = useState([]);
  // Tracks which row is mid-request so its own buttons show a spinner
  // without disabling the rest of the queue: { [id]: "approve" | "reject" }
  const [busyIds, setBusyIds] = useState({});

  // ── Users / Login As ─────────────────────────────────────────────────
  const [users, setUsers] = useState([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersPage, setUsersPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState(""); // debounced value actually sent
  const [impersonatingId, setImpersonatingId] = useState(null);

  const loadQueue = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiFetch("/api/admin/pending");
      setRecruiters(data.recruiters || []);
      setTpos(data.tpos || []);
    } catch (err) {
      toast.error(err.message || "Failed to load the approval queue.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

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

  async function actOnRecruiter(id, action) {
    setBusyIds((b) => ({ ...b, [id]: action }));
    try {
      await apiFetch(`/api/admin/recruiters/${id}/${action}`, { method: "POST" });
      setRecruiters((list) => list.filter((r) => r.id !== id));
      toast.success(action === "approve" ? "Recruiter approved." : "Recruiter request rejected.");
    } catch (err) {
      toast.error(err.message || `Failed to ${action} recruiter.`);
    } finally {
      setBusyIds((b) => {
        const next = { ...b };
        delete next[id];
        return next;
      });
    }
  }

  async function actOnTpo(collegeId, action) {
    setBusyIds((b) => ({ ...b, [collegeId]: action }));
    try {
      await apiFetch(`/api/admin/tpo/${collegeId}/${action}`, { method: "POST" });
      setTpos((list) => list.filter((t) => t.collegeId !== collegeId));
      toast.success(action === "approve" ? "College verified." : "TPO request rejected.");
    } catch (err) {
      toast.error(err.message || `Failed to ${action} TPO request.`);
    } finally {
      setBusyIds((b) => {
        const next = { ...b };
        delete next[collegeId];
        return next;
      });
    }
  }

  const pendingCount = recruiters.length + tpos.length;

  return (
    <>
      <PageMeta title="Admin Console — Code Club" description="Verification queue and role preview." />
      <DashboardLayout>
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-black text-white">Admin Console</h1>
            <p className="text-zinc-500 text-sm">
              {pendingCount > 0
                ? `${pendingCount} request${pendingCount === 1 ? "" : "s"} awaiting review`
                : "Nothing waiting on you right now."}
            </p>
          </div>

          {/* ── View As ──────────────────────────────────────────────── */}
          <section className="mb-10">
            <h2 className="text-xs uppercase tracking-widest text-zinc-500 font-semibold mb-3">
              View as
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {VIEW_AS.map((v) => (
                <div
                  key={v.id}
                  className={`bg-zinc-900/60 border rounded-xl px-4 py-3 transition ${v.accent}`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl" aria-hidden="true">{v.icon}</span>
                    <p className="text-white text-sm font-semibold">{v.label} portal</p>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {v.pages.map((p) => (
                      <Link
                        key={p.path}
                        to={p.path}
                        className="text-xs font-mono text-zinc-400 hover:text-white bg-black/30 hover:bg-black/50 rounded-lg px-2.5 py-1.5 transition"
                      >
                        {p.label} →
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-zinc-600 text-xs mt-2">
              These are your real live dashboards — an admin badge follows you so you can jump back here anytime.
            </p>
          </section>

          {/* ── Demo dataset ─────────────────────────────────────────── */}
          <section className="mb-10">
            <h2 className="text-xs uppercase tracking-widest text-zinc-500 font-semibold mb-3">
              Demo dataset
            </h2>
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl px-4 py-4 text-sm">
              <p className="text-zinc-400">
                8 demo students, 1 demo college, 1 demo company — safe to
                screen-record, none of it is real user data.
              </p>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
                <div className="bg-black/40 rounded-lg px-3 py-2 border border-zinc-800">
                  <p className="text-zinc-600">College domain</p>
                  <p className="text-violet-300">demo-institute.codeclub.dev</p>
                </div>
                <div className="bg-black/40 rounded-lg px-3 py-2 border border-zinc-800">
                  <p className="text-zinc-600">Company domain</p>
                  <p className="text-sky-300">demo-corp.codeclub.dev</p>
                </div>
              </div>
              <p className="text-zinc-600 text-xs mt-3">
                View as → TPO shows this college automatically once your admin
                account has been wired to it (one-time, via the seed script).
                For Recruiter search, type the college domain above into the
                College filter to pull up the demo students.
              </p>
              <p className="text-zinc-700 text-xs mt-2">
                Regenerate or refresh anytime:{" "}
                <code className="text-zinc-500">node scripts/seedDemoAccounts.js</code>
              </p>
            </div>
          </section>

          {/* ── Users / Login As ─────────────────────────────────────── */}
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
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setUsersPage(1);
                }}
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

          {/* ── Pending recruiters ──────────────────────────────────── */}
          <section className="mb-10">
            <h2 className="text-xs uppercase tracking-widest text-zinc-500 font-semibold mb-3">
              Recruiter requests {recruiters.length > 0 && `(${recruiters.length})`}
            </h2>
            {loading ? (
              <p className="text-zinc-600 text-sm">Loading…</p>
            ) : recruiters.length === 0 ? (
              <p className="text-zinc-600 text-sm">No recruiters awaiting review.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {recruiters.map((r) => (
                  <QueueRow
                    key={r.id}
                    title={r.companyName || r.email}
                    subtitle={`${r.displayName || r.email} · ${r.designation || "—"}`}
                    meta={`${r.companyDomain} · requested ${formatDate(r.requestedAt)}`}
                    busy={busyIds[r.id]}
                    onApprove={() => actOnRecruiter(r.id, "approve")}
                    onReject={() => actOnRecruiter(r.id, "reject")}
                  />
                ))}
              </div>
            )}
          </section>

          {/* ── Pending TPOs ─────────────────────────────────────────── */}
          <section>
            <h2 className="text-xs uppercase tracking-widest text-zinc-500 font-semibold mb-3">
              TPO / college requests {tpos.length > 0 && `(${tpos.length})`}
            </h2>
            {loading ? (
              <p className="text-zinc-600 text-sm">Loading…</p>
            ) : tpos.length === 0 ? (
              <p className="text-zinc-600 text-sm">No colleges awaiting review.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {tpos.map((t) => (
                  <QueueRow
                    key={t.collegeId}
                    title={t.collegeName}
                    subtitle={t.requestedBy?.displayName || t.requestedBy?.email || "Unknown requester"}
                    meta={`${t.domain} · requested ${formatDate(t.requestedAt)}`}
                    busy={busyIds[t.collegeId]}
                    onApprove={() => actOnTpo(t.collegeId, "approve")}
                    onReject={() => actOnTpo(t.collegeId, "reject")}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </DashboardLayout>
    </>
  );
}