import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import PageMeta from "../components/seo/PageMeta";
import DashboardLayout from "../layouts/DashboardLayout";
import Button from "../components/ui/Button";
import { apiFetch } from "../services/api";

const VIEW_AS = [
  {
    id: "student",
    label: "Student",
    accent: "border-green-500/30 hover:border-green-500/60",
    icon: "🧑‍💻",
    path: "/dashboard",
  },
  {
    id: "recruiter",
    label: "Recruiter",
    accent: "border-sky-500/30 hover:border-sky-500/60",
    icon: "🎯",
    path: "/recruiter/dashboard",
  },
  {
    id: "tpo",
    label: "TPO",
    accent: "border-violet-500/30 hover:border-violet-500/60",
    icon: "🏫",
    path: "/tpo/dashboard",
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
                <Link
                  key={v.id}
                  to={v.path}
                  className={`flex items-center gap-3 bg-zinc-900/60 border rounded-xl px-4 py-3 transition ${v.accent}`}
                >
                  <span className="text-2xl" aria-hidden="true">{v.icon}</span>
                  <div>
                    <p className="text-white text-sm font-semibold">{v.label}</p>
                    <p className="text-zinc-500 text-xs font-mono">{v.path}</p>
                  </div>
                </Link>
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