import { useCallback, useEffect, useState } from "react";
import { RotateCcw, ArrowBigUp } from "lucide-react";
import PageMeta from "../../components/seo/PageMeta";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/feedback/EmptyState";
import { formatVerificationDate } from "../../utils/formatVerificationDate";
import {
  fetchFeatureRequestsAdmin,
  updateFeatureRequestStatusAdmin,
  retryFeatureRequestRewardsAdmin,
} from "../../services/featureRequestApi";

/**
 * AdminFeatureRequestsPage — status-management console for Feature
 * Requests (Phase 5). Structurally mirrors AdminContributionsPage.jsx:
 * same status tabs, same toast/busyId pattern, same
 * retry-rewards button. Genuinely different in one way: Contribution only
 * ever moves pending -> approved | rejected (one review action), while a
 * FeatureRequest moves through a multi-stage, non-terminal lifecycle
 * (open -> planned -> in_progress -> shipped, with declined reachable from
 * open/planned) — so instead of one fixed Approve/Reject pair, each row
 * shows only the transitions actually valid from its current status (see
 * NEXT_ACTIONS below), sourced directly from
 * backend/schemas/featureRequestSchema.js's own admin-settable enum.
 */

const STATUS_TABS = [
  { value: "open", label: "Open" },
  { value: "planned", label: "Planned" },
  { value: "in_progress", label: "In progress" },
  { value: "shipped", label: "Shipped" },
  { value: "declined", label: "Declined" },
  { value: "withdrawn", label: "Withdrawn" },
  { value: "all", label: "All" },
];

const STATUS_STYLES = {
  open: "bg-[var(--surface-elevated)] text-[var(--muted-foreground)]",
  planned: "bg-blue-500/10 text-blue-400",
  in_progress: "bg-amber-500/10 text-amber-400",
  shipped: "bg-[var(--theme-primary,#2dd4bf)]/10 text-[var(--theme-primary,#2dd4bf)]",
  declined: "bg-red-500/10 text-red-400",
  withdrawn: "bg-[var(--surface-elevated)] text-[var(--muted-foreground)]",
};

const STATUS_LABELS = {
  open: "Open",
  planned: "Planned",
  in_progress: "In progress",
  shipped: "Shipped",
  declined: "Declined",
  withdrawn: "Withdrawn",
};

// The forward-progress action for each status, plus "Decline" wherever
// backend/schemas/featureRequestSchema.js's admin-settable enum actually
// allows it (open and planned only — matches
// backend/models/FeatureRequest.js's own header comment on reachability).
// shipped/declined/withdrawn are terminal: no entry here at all.
const NEXT_ACTIONS = {
  open: [
    { status: "planned", label: "Plan", variant: "primary" },
    { status: "declined", label: "Decline", variant: "danger" },
  ],
  planned: [
    { status: "in_progress", label: "Start", variant: "primary" },
    { status: "declined", label: "Decline", variant: "danger" },
  ],
  in_progress: [{ status: "shipped", label: "Ship", variant: "primary" }],
};

export default function AdminFeatureRequestsPage() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("open");
  const [busyId, setBusyId] = useState(null);
  const [busyStatus, setBusyStatus] = useState(null);
  const [toast, setToast] = useState(null);
  const [retrying, setRetrying] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    fetchFeatureRequestsAdmin({ status: status === "all" ? undefined : status })
      .then((data) => setEntries(data.featureRequests || []))
      .catch(() => setToast({ type: "error", message: "Failed to load feature requests." }))
      .finally(() => setLoading(false));
  }, [status]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount pattern used throughout this codebase's admin pages (see AdminContributionsPage.jsx's identical effect).
    load();
  }, [load]);

  async function handleTransition(id, nextStatus) {
    setBusyId(id);
    setBusyStatus(nextStatus);
    try {
      const result = await updateFeatureRequestStatusAdmin(id, nextStatus);
      const rewardNote =
        nextStatus !== "shipped"
          ? ""
          : result.rewardStatus === "issued"
          ? " Reward issued."
          : result.rewardStatus === "skipped_unconfigured"
          ? " No reward amount configured — nothing issued."
          : result.rewardStatus === "failed"
          ? " Reward issuance failed — use \"Retry rewards\" below."
          : "";
      setToast({ type: "success", message: `Updated.${rewardNote}` });
      load();
    } catch (err) {
      setToast({ type: "error", message: err.message || "Failed to update status." });
    } finally {
      setBusyId(null);
      setBusyStatus(null);
    }
  }

  async function handleRetryRewards() {
    setRetrying(true);
    try {
      const result = await retryFeatureRequestRewardsAdmin();
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
      <PageMeta title="Feature Requests · Admin · Code Club" path="/admin/feature-requests" />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-[var(--foreground)]">Feature Requests</h1>
          <p className="text-[var(--muted-foreground)] text-sm mt-0.5">
            Move requests through the roadmap, or decline them.
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
            toast.type === "error"
              ? "bg-red-500/10 text-red-400"
              : "bg-[var(--theme-primary,#2dd4bf)]/10 text-[var(--theme-primary,#2dd4bf)]"
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
      ) : entries.length === 0 ? (
        <EmptyState icon="💡" title="No feature requests" description="Nothing in this view right now." />
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => (
            <FeatureRequestAdminRow
              key={entry._id}
              entry={entry}
              busy={busyId === entry._id}
              busyStatus={busyId === entry._id ? busyStatus : null}
              onTransition={(nextStatus) => handleTransition(entry._id, nextStatus)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function FeatureRequestAdminRow({ entry, busy, busyStatus, onTransition }) {
  const { ccId, title, description, status, voteCount, submittedBy, createdAt } = entry;
  const submitterLabel = submittedBy?.displayName || submittedBy?.email || "Unknown";
  const actions = NEXT_ACTIONS[status] || [];

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-semibold text-[var(--muted-foreground)]">{ccId}</span>
            <span
              className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                STATUS_STYLES[status] || "bg-[var(--surface-elevated)] text-[var(--muted-foreground)]"
              }`}
            >
              {STATUS_LABELS[status] || status}
            </span>
            <span className="text-[11px] text-[var(--muted-foreground)] inline-flex items-center gap-1">
              <ArrowBigUp size={13} strokeWidth={2} /> {voteCount ?? 0}
            </span>
          </div>
          <p className="text-[var(--foreground)] font-medium text-sm mt-1">{title}</p>
          <p className="text-[var(--muted-foreground)] text-sm mt-0.5">{description}</p>
          <p className="text-[var(--muted-foreground)] text-xs mt-1.5">
            {submitterLabel} · {formatVerificationDate(createdAt)}
          </p>
        </div>

        {actions.length > 0 && (
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {actions.map((action) => (
              <Button
                key={action.status}
                size="sm"
                variant={action.variant}
                onClick={() => onTransition(action.status)}
                disabled={busy}
                loading={busy && busyStatus === action.status}
              >
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}