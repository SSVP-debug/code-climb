import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowBigUp, Lightbulb, Pencil, X, Trash2 } from "lucide-react";
import PageMeta from "../components/seo/PageMeta";
import DashboardLayout from "../layouts/DashboardLayout";
import Button from "../components/ui/Button";
import EmptyState from "../components/ui/feedback/EmptyState";
import { formatVerificationDate } from "../utils/formatVerificationDate";
import {
  submitFeatureRequest,
  fetchFeatureRequests,
  fetchMyFeatureRequests,
  voteFeatureRequest,
  editFeatureRequest,
  withdrawFeatureRequest,
} from "../services/featureRequestApi";

/**
 * FeatureRequestsPage — student/recruiter/TPO-facing (any authenticated
 * role, per Bunny's own scoping decision — Feature Requests is not
 * student-only, unlike Contribution/Credits) public suggestion board for
 * Phase 5. Structurally mirrors RewardsStorePage.jsx: one page, two tabs
 * ("Board" / "My Requests"), same toast/busyId pattern, same overlay/panel
 * convention AdminContributionsPage.jsx's reject-reason modal already
 * established, reused here for the submission form and edit form both.
 *
 * The public board (tab "board") shows every non-withdrawn request,
 * sorted by votes by default — matches backend/services/featureRequests.js's
 * listFeatureRequests() default. "My Requests" (tab "mine") shows the
 * caller's own full history, withdrawn included, with edit/withdraw
 * actions on rows still "open".
 */

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

const TABS = [
  { value: "board", label: "Board" },
  { value: "mine", label: "My Requests" },
];

export default function FeatureRequestsPage() {
  const [tab, setTab] = useState("board");
  const [sort, setSort] = useState("votes");
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    const request = tab === "board" ? fetchFeatureRequests({ sort }) : fetchMyFeatureRequests();
    request
      .then((data) => setEntries(data.featureRequests || []))
      .catch(() => setToast({ type: "error", message: "Failed to load feature requests." }))
      .finally(() => setLoading(false));
  }, [tab, sort]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount/tab-change pattern used throughout this codebase (see RewardsStorePage.jsx's identical effect).
    load();
  }, [load]);

  async function handleVote(id) {
    setBusyId(id);
    try {
      await voteFeatureRequest(id);
      load();
    } catch (err) {
      setToast({ type: "error", message: err.message || "Failed to vote." });
    } finally {
      setBusyId(null);
    }
  }

  async function handleWithdraw(id) {
    setBusyId(id);
    try {
      await withdrawFeatureRequest(id);
      setToast({ type: "success", message: "Withdrawn." });
      load();
    } catch (err) {
      setToast({ type: "error", message: err.message || "Failed to withdraw." });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <DashboardLayout>
      <PageMeta title="Feature Requests · Code Club" path="/feature-requests" />

      <div className="max-w-3xl mx-auto">
        <Link
          to="/club"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition mb-4"
        >
          <ArrowLeft size={15} strokeWidth={2} aria-hidden="true" />
          Back to Club
        </Link>

        <div className="flex items-center justify-between mb-6 gap-3">
          <div>
            <h1 className="text-2xl font-bold text-[var(--foreground)]">Feature Requests</h1>
            <p className="text-[var(--muted-foreground)] mt-1 text-sm">
              Suggest something for Code Club, or vote on what's already been proposed.
            </p>
          </div>
          <Button size="sm" onClick={() => setShowSubmitForm(true)}>
            New request
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

        <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
          <div className="flex flex-wrap items-center gap-2">
            {TABS.map((t) => (
              <button
                key={t.value}
                onClick={() => setTab(t.value)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full transition ${
                  tab === t.value ? "bg-white text-black" : "bg-[var(--surface)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === "board" && (
            <div className="flex items-center gap-2">
              {[
                { value: "votes", label: "Top" },
                { value: "recent", label: "New" },
              ].map((s) => (
                <button
                  key={s.value}
                  onClick={() => setSort(s.value)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-full transition ${
                    sort === s.value ? "bg-[var(--surface-elevated)] text-[var(--foreground)]" : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-[var(--theme-primary,#2dd4bf)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : entries.length === 0 ? (
          <EmptyState
            icon={<Lightbulb size={28} strokeWidth={2} aria-hidden="true" />}
            title={tab === "board" ? "No feature requests yet" : "You haven't submitted anything yet"}
            description={
              tab === "board"
                ? "Be the first to suggest something for Code Club."
                : "Anything you submit shows up here, along with its status."
            }
            actionLabel="New request"
            onAction={() => setShowSubmitForm(true)}
          />
        ) : (
          <div className="space-y-2">
            {entries.map((entry) => (
              <FeatureRequestRow
                key={entry._id}
                entry={entry}
                showVote={tab === "board"}
                busy={busyId === entry._id}
                onVote={() => handleVote(entry._id)}
                onEdit={() => setEditTarget(entry)}
                onWithdraw={() => handleWithdraw(entry._id)}
              />
            ))}
          </div>
        )}
      </div>

      {showSubmitForm && (
        <SubmitPanel
          onClose={() => setShowSubmitForm(false)}
          onSubmitted={() => {
            setShowSubmitForm(false);
            setToast({ type: "success", message: "Submitted." });
            load();
          }}
        />
      )}

      {editTarget && (
        <EditPanel
          entry={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={() => {
            setEditTarget(null);
            setToast({ type: "success", message: "Updated." });
            load();
          }}
        />
      )}
    </DashboardLayout>
  );
}

function FeatureRequestRow({ entry, showVote, busy, onVote, onEdit, onWithdraw }) {
  const { title, description, status, voteCount, hasVoted, createdAt } = entry;

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 flex items-start gap-3">
      {showVote && (
        <button
          onClick={onVote}
          disabled={busy}
          className={`flex-shrink-0 flex flex-col items-center justify-center gap-0.5 w-12 py-1.5 rounded-lg border transition ${
            hasVoted
              ? "bg-[var(--theme-primary,#2dd4bf)]/10 border-[var(--theme-primary,#2dd4bf)]/40 text-[var(--theme-primary,#2dd4bf)]"
              : "bg-[var(--surface-elevated)]/50 border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          } disabled:opacity-50`}
        >
          <ArrowBigUp size={18} strokeWidth={2} fill={hasVoted ? "currentColor" : "none"} />
          <span className="text-xs font-bold">{voteCount ?? 0}</span>
        </button>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
              STATUS_STYLES[status] || "bg-[var(--surface-elevated)] text-[var(--muted-foreground)]"
            }`}
          >
            {STATUS_LABELS[status] || status}
          </span>
          {!showVote && (
            <span className="text-[11px] text-[var(--muted-foreground)] inline-flex items-center gap-1">
              <ArrowBigUp size={13} strokeWidth={2} /> {voteCount ?? 0}
            </span>
          )}
        </div>
        <p className="text-[var(--foreground)] font-medium text-sm mt-1">{title}</p>
        <p className="text-[var(--muted-foreground)] text-sm mt-0.5 line-clamp-2">{description}</p>
        <p className="text-[var(--muted-foreground)] text-xs mt-1.5">{formatVerificationDate(createdAt)}</p>
      </div>

      {!showVote && status === "open" && (
        <div className="flex-shrink-0 flex items-center gap-1.5">
          <button
            onClick={onEdit}
            disabled={busy}
            className="p-2 rounded-lg bg-[var(--surface-elevated)]/50 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition disabled:opacity-50"
            aria-label="Edit"
          >
            <Pencil size={14} strokeWidth={2} />
          </button>
          <button
            onClick={onWithdraw}
            disabled={busy}
            className="p-2 rounded-lg bg-[var(--surface-elevated)]/50 text-[var(--muted-foreground)] hover:text-red-400 transition disabled:opacity-50"
            aria-label="Withdraw"
          >
            <Trash2 size={14} strokeWidth={2} />
          </button>
        </div>
      )}
    </div>
  );
}

// ── Submission panel ─────────────────────────────────────────────────────
// Same overlay/panel convention AdminContributionsPage.jsx's reject-reason
// modal and RewardsStorePage.jsx's shipping-address panel already
// established — not a new modal pattern.
function SubmitPanel({ onClose, onSubmitted }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await submitFeatureRequest({ title: title.trim(), description: description.trim() });
      onSubmitted();
    } catch (err) {
      setError(err.message || "Failed to submit.");
    } finally {
      setSubmitting(false);
    }
  }

  const canSubmit = title.trim() && description.trim() && !submitting;

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-sm bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between mb-1.5">
          <h2 className="text-[var(--foreground)] font-bold text-base">New feature request</h2>
          <button onClick={onClose} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
            <X size={16} strokeWidth={2} />
          </button>
        </div>
        <p className="text-[var(--muted-foreground)] text-sm mb-3">
          What would you like Code Club to add or change?
        </p>
        <form onSubmit={handleSubmit} className="space-y-2">
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Short, specific title"
            maxLength={200}
            className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--theme-primary,#2dd4bf)]/50"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what you'd like to see, and why it'd help."
            rows={4}
            maxLength={5000}
            className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--theme-primary,#2dd4bf)]/50 resize-none"
          />
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg px-3 py-2">
              {error}
            </div>
          )}
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" size="sm" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={!canSubmit} loading={submitting}>
              Submit
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Edit panel ────────────────────────────────────────────────────────────
// Only ever opened for a row still "open" (see FeatureRequestRow above —
// the edit button doesn't render otherwise), but the backend's own atomic
// ownership+status guard (backend/services/featureRequests.js's
// editFeatureRequest()) is the real enforcement, not this UI gate.
function EditPanel({ entry, onClose, onSaved }) {
  const [title, setTitle] = useState(entry.title);
  const [description, setDescription] = useState(entry.description);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await editFeatureRequest(entry._id, {
        title: title.trim(),
        description: description.trim(),
      });
      onSaved();
    } catch (err) {
      setError(err.message || "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  const canSave = title.trim() && description.trim() && !saving;

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-sm bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between mb-1.5">
          <h2 className="text-[var(--foreground)] font-bold text-base">Edit request</h2>
          <button onClick={onClose} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
            <X size={16} strokeWidth={2} />
          </button>
        </div>
        <p className="text-[var(--muted-foreground)] text-sm mb-3">Only possible while your request is still open.</p>
        <form onSubmit={handleSave} className="space-y-2">
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--theme-primary,#2dd4bf)]/50"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            maxLength={5000}
            className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--theme-primary,#2dd4bf)]/50 resize-none"
          />
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg px-3 py-2">
              {error}
            </div>
          )}
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" size="sm" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={!canSave} loading={saving}>
              Save
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}