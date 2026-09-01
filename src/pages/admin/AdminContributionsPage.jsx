import { useCallback, useEffect, useState } from "react";
import { X, RotateCcw, ChevronDown, ChevronUp } from "lucide-react";
import PageMeta from "../../components/seo/PageMeta";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/feedback/EmptyState";
import { formatVerificationDate } from "../../utils/formatVerificationDate";
import {
  fetchContributionsAdmin,
  approveContributionAdmin,
  rejectContributionAdmin,
  retryContributionRewardsAdmin,
} from "../../services/contributionApi";

/**
 * AdminContributionsPage — review queue for Contribution Infrastructure
 * (Phase 2F). Structurally mirrors AdminOpportunitiesPage.jsx: same status
 * tabs, same toast/busyId pattern, same reject-reason modal — that page is
 * the closest existing analog ("admin reviews a user-generated row,
 * approve/reject with a reason") in this codebase.
 *
 * Deliberately simpler than AdminOpportunitiesPage.jsx in one way: no
 * separate create/edit/publish lifecycle — a Contribution only ever moves
 * pending -> approved | rejected (see backend/models/Contribution.js), so
 * there's no multi-stage action set to branch on here.
 */

const STATUS_TABS = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "all", label: "All" },
];

const STATUS_STYLES = {
  pending: "bg-amber-500/10 text-amber-400",
  approved: "bg-[var(--theme-primary,#2dd4bf)]/10 text-[var(--theme-primary,#2dd4bf)]",
  rejected: "bg-red-500/10 text-red-400",
};

const KIND_LABELS = {
  new_problem: "New problem",
  testcase_improvement: "Testcase improvement",
};

export default function AdminContributionsPage() {
  const [contributions, setContributions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("pending");
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [toast, setToast] = useState(null);
  const [retrying, setRetrying] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    fetchContributionsAdmin({ status })
      .then((data) => setContributions(data.contributions || []))
      .catch(() => setToast({ type: "error", message: "Failed to load contributions." }))
      .finally(() => setLoading(false));
  }, [status]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount pattern used throughout this codebase's admin pages (see AdminOpportunitiesPage.jsx's identical effect).
    load();
  }, [load]);

  async function handleApprove(id) {
    setBusyId(id);
    try {
      const result = await approveContributionAdmin(id);
      const rewardNote =
        result.rewardStatus === "issued"
          ? " Reward issued."
          : result.rewardStatus === "skipped_unconfigured"
          ? " No reward amount configured — nothing issued."
          : result.rewardStatus === "failed"
          ? " Reward issuance failed — use \"Retry rewards\" below."
          : "";
      setToast({ type: "success", message: `Approved.${rewardNote}` });
      load();
    } catch (err) {
      setToast({ type: "error", message: err.message || "Failed to approve." });
    } finally {
      setBusyId(null);
    }
  }

  async function handleReject() {
    if (!rejectTarget) return;
    setBusyId(rejectTarget);
    try {
      await rejectContributionAdmin(rejectTarget, rejectReason.trim() || null);
      setToast({ type: "success", message: "Rejected." });
      load();
    } catch (err) {
      setToast({ type: "error", message: err.message || "Failed to reject." });
    } finally {
      setBusyId(null);
      setRejectTarget(null);
      setRejectReason("");
    }
  }

  async function handleRetryRewards() {
    setRetrying(true);
    try {
      const result = await retryContributionRewardsAdmin();
      setToast({
        type: "success",
        message: `Retried ${result.attempted} — ${result.issued} issued, ${result.stillUnissued} still unissued.`,
      });
      load();
    } catch (err) {
      setToast({ type: "error", message: err.message || "Retry failed." });
    } finally {
      setRetrying(false);
    }
  }

  return (
    <div>
      <PageMeta title="Contributions · Admin · Code Club" path="/admin/contributions" />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-[var(--foreground)]">Contributions</h1>
          <p className="text-[var(--muted-foreground)] text-sm mt-0.5">
            Review student-submitted problems and testcase improvements.
          </p>
        </div>
        <Button size="sm" variant="secondary" onClick={handleRetryRewards} disabled={retrying}>
          <RotateCcw size={14} strokeWidth={2} className={retrying ? "animate-spin" : ""} />
          Retry rewards
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

      <div className="flex flex-wrap items-center gap-2 mb-5">
        {STATUS_TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setStatus(t.value)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full transition ${
              status === t.value ? "bg-white text-black" : "bg-[var(--surface)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-[var(--theme-primary,#2dd4bf)] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : contributions.length === 0 ? (
        <EmptyState icon="🧩" title="No contributions" description="Nothing in this queue right now." />
      ) : (
        <div className="space-y-2">
          {contributions.map((c) => (
            <ContributionCard
              key={c._id}
              contribution={c}
              busy={busyId === c._id}
              expanded={expandedId === c._id}
              onToggleExpand={() => setExpandedId(expandedId === c._id ? null : c._id)}
              onApprove={() => handleApprove(c._id)}
              onReject={() => setRejectTarget(c._id)}
            />
          ))}
        </div>
      )}

      {/* Reject reason — same overlay/panel convention as
          AdminOpportunitiesPage.jsx's identical modal. */}
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
            className="w-full max-w-sm bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5"
            onClick={(e) => e.stopPropagation()}
            role="alertdialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between mb-1.5">
              <h2 className="text-[var(--foreground)] font-bold text-base">Reject contribution</h2>
              <button
                onClick={() => {
                  setRejectTarget(null);
                  setRejectReason("");
                }}
                className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              >
                <X size={16} strokeWidth={2} />
              </button>
            </div>
            <p className="text-[var(--muted-foreground)] text-sm mb-3">
              Reason is optional but shown to the student — worth explaining why.
            </p>
            <textarea
              autoFocus
              placeholder="Reason for rejection (optional)..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:border-red-500"
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
              <Button size="sm" variant="danger" onClick={handleReject}>
                Reject
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ContributionCard({ contribution, busy, expanded, onToggleExpand, onApprove, onReject }) {
  const { kind, status, payload, createdAt, contributorId, rejectionReason, rewardStatus } = contribution;
  const title = kind === "new_problem" ? payload?.title : payload?.problemSlug;
  const contributorLabel = contributorId?.displayName || contributorId?.email || "Unknown";

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={onToggleExpand}
          className="flex items-center gap-3 min-w-0 flex-1 text-left"
        >
          {expanded ? (
            <ChevronUp size={14} strokeWidth={2} className="flex-shrink-0 text-[var(--muted-foreground)]" />
          ) : (
            <ChevronDown size={14} strokeWidth={2} className="flex-shrink-0 text-[var(--muted-foreground)]" />
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wide">
                {KIND_LABELS[kind] || kind}
              </span>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLES[status] || "bg-[var(--surface-elevated)] text-[var(--muted-foreground)]"}`}>
                {status}
              </span>
              {status === "approved" && rewardStatus && rewardStatus !== "issued" && (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[var(--surface-elevated)] text-[var(--muted-foreground)]">
                  reward: {rewardStatus.replace("_", " ")}
                </span>
              )}
            </div>
            <p className="text-[var(--foreground)] font-medium text-sm mt-1 truncate">{title || "Untitled"}</p>
            <p className="text-[var(--muted-foreground)] text-xs mt-0.5">
              {contributorLabel} · {formatVerificationDate(createdAt)}
            </p>
          </div>
        </button>

        {status === "pending" && (
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Button size="sm" onClick={onApprove} disabled={busy} loading={busy}>
              Approve
            </Button>
            <Button size="sm" variant="danger" onClick={onReject} disabled={busy}>
              Reject
            </Button>
          </div>
        )}
      </div>

      {status === "rejected" && rejectionReason && (
        <p className="text-[var(--muted-foreground)] text-xs mt-2 border-t border-[var(--border)] pt-2">
          Rejected: {rejectionReason}
        </p>
      )}

      {expanded && (
        <pre className="mt-3 border-t border-[var(--border)] pt-3 text-xs text-[var(--muted-foreground)] overflow-x-auto whitespace-pre-wrap break-words">
          {JSON.stringify(payload, null, 2)}
        </pre>
      )}
    </div>
  );
}