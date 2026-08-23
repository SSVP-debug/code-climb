import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Copy, BarChart3, Pencil, X } from "lucide-react";
import PageMeta from "../../components/seo/PageMeta";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/feedback/EmptyState";
import { formatVerificationDate } from "../../utils/formatVerificationDate";
import {
  fetchOpportunitiesAdmin,
  submitOpportunityForReview,
  approveOpportunityAdmin,
  publishOpportunityAdmin,
  rejectOpportunityAdmin,
  archiveOpportunityAdmin,
  markOpportunityExpiredAdmin,
  duplicateOpportunityAdmin,
} from "../../services/opportunityApi";

const STATUS_TABS = [
  { value: "", label: "All" },
  { value: "draft", label: "Drafts" },
  { value: "pending_review", label: "Pending Review" },
  { value: "approved", label: "Approved" },
  { value: "published", label: "Published" },
  { value: "rejected", label: "Rejected" },
  { value: "expired", label: "Expired" },
  { value: "archived", label: "Archived" },
];

const STATUS_STYLES = {
  draft: "bg-zinc-800 text-zinc-400",
  pending_review: "bg-amber-500/10 text-amber-400",
  approved: "bg-sky-500/10 text-sky-400",
  published: "bg-[var(--theme-primary,#2dd4bf)]/10 text-[var(--theme-primary,#2dd4bf)]",
  rejected: "bg-red-500/10 text-red-400",
  expired: "bg-zinc-700 text-zinc-400",
  archived: "bg-zinc-800 text-zinc-500",
};

export default function AdminOpportunitiesPage() {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [toast, setToast] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    const filters = {};
    if (status) filters.status = status;
    if (search) filters.search = search;
    fetchOpportunitiesAdmin(filters)
      .then((data) => setOpportunities(data.opportunities || []))
      .catch(() => setToast({ type: "error", message: "Failed to load opportunities." }))
      .finally(() => setLoading(false));
  }, [status, search]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount pattern used throughout this codebase's admin hooks (see src/hooks/useAdminProblems.js's fuller write-up); load() is a useCallback-wrapped async fetcher whose setState calls happen after its own await, not synchronously here.
    load();
  }, [load]);

  async function runAction(id, fn, successMessage) {
    setBusyId(id);
    try {
      await fn(id);
      setToast({ type: "success", message: successMessage });
      load();
    } catch (err) {
      setToast({ type: "error", message: err.message || "Action failed." });
    } finally {
      setBusyId(null);
    }
  }

  async function handleReject() {
    if (!rejectTarget || !rejectReason.trim()) return;
    setBusyId(rejectTarget);
    try {
      await rejectOpportunityAdmin(rejectTarget, rejectReason.trim());
      setToast({ type: "success", message: "Opportunity rejected." });
      load();
    } catch (err) {
      setToast({ type: "error", message: err.message || "Failed to reject." });
    } finally {
      setBusyId(null);
      setRejectTarget(null);
      setRejectReason("");
    }
  }

  return (
    <div>
      <PageMeta title="Opportunities · Admin · Code Club" path="/admin/opportunities" />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Opportunities</h1>
          <p className="text-zinc-500 text-sm mt-0.5">Discover, verify, and publish opportunities for students.</p>
        </div>
        <Button to="/admin/opportunities/new" size="sm">
          <Plus size={16} strokeWidth={2} />
          New Opportunity
        </Button>
      </div>

      {toast && (
        <div
          className={`mb-4 text-sm px-3 py-2 rounded-lg ${
            toast.type === "error" ? "bg-red-500/10 text-red-400" : "bg-[var(--theme-primary,#2dd4bf)]/10 text-[var(--theme-primary,#2dd4bf)]"
          }`}
        >
          {toast.message}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 mb-4">
        {STATUS_TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setStatus(t.value)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full transition ${
              status === t.value ? "bg-white text-black" : "bg-zinc-900 text-zinc-400 hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <input
        type="text"
        placeholder="Search by title, organization, or CC ID..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white mb-5 focus:outline-none focus:border-[var(--theme-primary,#2dd4bf)]"
      />

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-[var(--theme-primary,#2dd4bf)] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : opportunities.length === 0 ? (
        <EmptyState icon="📡" title="No opportunities found" description="Create your first opportunity to get started." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-zinc-500 text-xs uppercase tracking-wide border-b border-zinc-800">
                <th className="py-2 pr-4">CC ID</th>
                <th className="py-2 pr-4">Title</th>
                <th className="py-2 pr-4">Organization</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Deadline</th>
                <th className="py-2 pr-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {opportunities.map((o) => (
                <tr key={o._id} className="border-b border-zinc-900">
                  <td className="py-3 pr-4 font-mono text-xs text-zinc-500">{o.ccId}</td>
                  <td className="py-3 pr-4 text-white font-medium max-w-xs truncate">{o.title}</td>
                  <td className="py-3 pr-4 text-zinc-400">{o.organization}</td>
                  <td className="py-3 pr-4">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLES[o.status] || "bg-zinc-800 text-zinc-400"}`}>
                      {o.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-zinc-500 text-xs">
                    {o.applicationDeadline ? formatVerificationDate(o.applicationDeadline) : "No deadline"}
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Link to={`/admin/opportunities/${o._id}/edit`} className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-white" title="Edit">
                        <Pencil size={14} strokeWidth={2} />
                      </Link>
                      <Link to={`/admin/opportunities/${o._id}/analytics`} className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-white" title="Analytics">
                        <BarChart3 size={14} strokeWidth={2} />
                      </Link>
                      <button
                        onClick={() => runAction(o._id, duplicateOpportunityAdmin, "Duplicated as a new draft.")}
                        disabled={busyId === o._id}
                        className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-white"
                        title="Duplicate"
                      >
                        <Copy size={14} strokeWidth={2} />
                      </button>

                      {o.status === "draft" && (
                        <ActionButton
                          label="Submit for review"
                          onClick={() => runAction(o._id, submitOpportunityForReview, "Submitted for review.")}
                          busy={busyId === o._id}
                        />
                      )}
                      {o.status === "pending_review" && (
                        <>
                          <ActionButton
                            label="Approve"
                            onClick={() => runAction(o._id, approveOpportunityAdmin, "Approved.")}
                            busy={busyId === o._id}
                          />
                          <ActionButton
                            label="Reject"
                            variant="danger"
                            onClick={() => setRejectTarget(o._id)}
                            busy={busyId === o._id}
                          />
                        </>
                      )}
                      {o.status === "approved" && (
                        <>
                          <ActionButton
                            label="Publish"
                            onClick={() => runAction(o._id, publishOpportunityAdmin, "Published — now live on the Opportunity Radar.")}
                            busy={busyId === o._id}
                          />
                          <ActionButton
                            label="Reject"
                            variant="danger"
                            onClick={() => setRejectTarget(o._id)}
                            busy={busyId === o._id}
                          />
                        </>
                      )}
                      {o.status === "published" && (
                        <ActionButton
                          label="Mark expired"
                          onClick={() => runAction(o._id, markOpportunityExpiredAdmin, "Marked expired.")}
                          busy={busyId === o._id}
                        />
                      )}
                      {["draft", "pending_review", "approved", "rejected", "expired"].includes(o.status) && (
                        <ActionButton
                          label="Archive"
                          variant="secondary"
                          onClick={() => runAction(o._id, archiveOpportunityAdmin, "Archived.")}
                          busy={busyId === o._id}
                        />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Reject reason — same overlay/panel visual convention as
          ConfirmDialog.jsx, but bespoke: ConfirmDialog has no slot for a
          form input, only a static description string. */}
      {rejectTarget && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => {
            setRejectTarget(null);
            setRejectReason("");
          }}
          role="presentation"
        >
          <div
            className="w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-2xl p-5"
            onClick={(e) => e.stopPropagation()}
            role="alertdialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between mb-1.5">
              <h2 className="text-white font-bold text-base">Reject opportunity</h2>
              <button
                onClick={() => {
                  setRejectTarget(null);
                  setRejectReason("");
                }}
                className="text-zinc-500 hover:text-white"
              >
                <X size={16} strokeWidth={2} />
              </button>
            </div>
            <p className="text-zinc-400 text-sm mb-3">Give a reason — this is stored for the admin record.</p>
            <textarea
              autoFocus
              placeholder="Reason for rejection..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
              rows={3}
            />
            <div className="flex items-center justify-end gap-2 mt-4">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  setRejectTarget(null);
                  setRejectReason("");
                }}
              >
                Cancel
              </Button>
              <Button size="sm" variant="danger" onClick={handleReject} disabled={!rejectReason.trim()}>
                Reject
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ActionButton({ label, onClick, busy, variant = "primary" }) {
  const styles = {
    primary: "bg-[var(--theme-primary,#2dd4bf)]/10 text-[var(--theme-primary,#2dd4bf)] hover:bg-[var(--theme-primary,#2dd4bf)]/20",
    danger: "bg-red-500/10 text-red-400 hover:bg-red-500/20",
    secondary: "bg-zinc-800 text-zinc-400 hover:bg-zinc-700",
  };
  return (
    <button
      onClick={onClick}
      disabled={busy}
      className={`text-[11px] font-semibold px-2.5 py-1 rounded-md transition disabled:opacity-50 ${styles[variant]}`}
    >
      {label}
    </button>
  );
}
