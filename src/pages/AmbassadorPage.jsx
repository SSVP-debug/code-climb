import { useEffect, useState } from "react";
import { apiFetch } from "../services/api";
import DashboardLayout from "../layouts/DashboardLayout";
import SectionCard from "../components/ui/layout/SectionCard";

export default function AmbassadorPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // One of: null (not applied), "pending", "approved", "rejected"
  const [status, setStatus] = useState(null);
  const [rejectionReason, setRejectionReason] = useState(null);

  // Dashboard data — only populated once status === "approved"
  const [dashboard, setDashboard] = useState(null);

  useEffect(() => {
    loadStatus();
  }, []);

  async function loadStatus() {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch("/api/ambassador/status");
      if (!data.hasApplied) {
        setStatus(null);
      } else {
        setStatus(data.status);
        setRejectionReason(data.rejectionReason);
        if (data.status === "approved") {
          const dash = await apiFetch("/api/ambassador/dashboard");
          setDashboard(dash);
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function claimMilestone(milestoneId) {
    try {
      await apiFetch("/api/ambassador/claim-milestone", {
        method: "POST",
        body: JSON.stringify({ milestoneId }),
      });
      const dash = await apiFetch("/api/ambassador/dashboard");
      setDashboard(dash);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Campus Ambassador Program</h1>
          <p className="text-zinc-500 mt-1 text-sm">
            Bring Code Club to your college. Earn bonus Pro days for every student you refer.
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl px-4 py-3 mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <SectionCard>
            <p className="text-zinc-500 text-sm">Loading…</p>
          </SectionCard>
        ) : status === "approved" && dashboard ? (
          <AmbassadorDashboard dashboard={dashboard} onClaim={claimMilestone} />
        ) : status ? (
          <StatusCard status={status} rejectionReason={rejectionReason} />
        ) : (
          <ApplicationForm onSubmitted={loadStatus} />
        )}
      </div>
    </DashboardLayout>
  );
}

// ── Not yet applied ──────────────────────────────────────────────────────
function ApplicationForm({ onSubmitted }) {
  const [form, setForm] = useState({ collegeName: "", collegeDomain: "", motivation: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await apiFetch("/api/ambassador/apply", {
        method: "POST",
        body: JSON.stringify(form),
      });
      onSubmitted();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const canSubmit = form.collegeName.trim() && form.collegeDomain.trim() && !submitting;

  return (
    <SectionCard title="Apply to become an ambassador">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs text-zinc-500 uppercase tracking-widest font-semibold mb-1">
            College name
          </label>
          <input
            value={form.collegeName}
            onChange={(e) => setForm((f) => ({ ...f, collegeName: e.target.value }))}
            placeholder="e.g. Marwadi University"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-green-500/50"
          />
        </div>

        <div>
          <label className="block text-xs text-zinc-500 uppercase tracking-widest font-semibold mb-1">
            College email domain
          </label>
          <input
            value={form.collegeDomain}
            onChange={(e) => setForm((f) => ({ ...f, collegeDomain: e.target.value }))}
            placeholder="e.g. marwadiuniversity.ac.in"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-green-500/50"
          />
        </div>

        <div>
          <label className="block text-xs text-zinc-500 uppercase tracking-widest font-semibold mb-1">
            Why do you want to be an ambassador? (optional)
          </label>
          <textarea
            value={form.motivation}
            onChange={(e) => setForm((f) => ({ ...f, motivation: e.target.value }))}
            rows={3}
            placeholder="A couple of sentences is plenty."
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-green-500/50 resize-none"
          />
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full py-3 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white rounded-xl font-semibold transition"
        >
          {submitting ? "Submitting…" : "Submit Application"}
        </button>
      </form>
    </SectionCard>
  );
}

// ── Pending / Rejected ───────────────────────────────────────────────────
function StatusCard({ status, rejectionReason }) {
  if (status === "pending") {
    return (
      <SectionCard>
        <p className="text-white font-semibold mb-1">Application under review</p>
        <p className="text-zinc-500 text-sm">
          We'll notify you once it's reviewed. This usually doesn't take long.
        </p>
      </SectionCard>
    );
  }

  return (
    <SectionCard>
      <p className="text-white font-semibold mb-1">Application not approved</p>
      <p className="text-zinc-500 text-sm">
        {rejectionReason || "No reason was given."}
      </p>
    </SectionCard>
  );
}

// ── Approved — dashboard ─────────────────────────────────────────────────
function AmbassadorDashboard({ dashboard, onClaim }) {
  const { collegeName, referralCode, shareUrl, referredCount, rewardDaysEarned, milestones } = dashboard;

  return (
    <div className="space-y-6">
      <SectionCard title={`Ambassador at ${collegeName}`}>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-zinc-500 text-sm">Your referral code</p>
            <p className="text-2xl font-bold text-green-400 mt-1">{referralCode}</p>
          </div>
          <div className="text-right">
            <p className="text-zinc-500 text-sm">Referred so far</p>
            <p className="text-2xl font-bold text-white mt-1">{referredCount}</p>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <input
            readOnly
            value={shareUrl}
            className="flex-1 min-w-0 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-zinc-300 text-sm outline-none"
          />
          <button
            onClick={() => navigator.clipboard.writeText(shareUrl)}
            className="flex-shrink-0 bg-zinc-800 hover:bg-zinc-700 transition px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
          >
            Copy
          </button>
        </div>

        <p className="text-xs text-zinc-600 mt-3">
          {rewardDaysEarned} bonus Pro day{rewardDaysEarned === 1 ? "" : "s"} earned so far.
        </p>
      </SectionCard>

      <SectionCard title="Milestones">
        <div className="space-y-3">
          {milestones.map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between gap-3 bg-zinc-800/50 rounded-xl px-4 py-3"
            >
              <div className="min-w-0">
                <p className="text-white font-semibold text-sm">{m.label}</p>
                <p className="text-zinc-500 text-xs mt-0.5">+{m.rewardDays} bonus days</p>
              </div>

              {m.claimed ? (
                <span className="flex-shrink-0 text-xs font-semibold text-green-400">Claimed</span>
              ) : m.achieved ? (
                <button
                  onClick={() => onClaim(m.id)}
                  className="flex-shrink-0 bg-green-600 hover:bg-green-500 transition px-4 py-2 rounded-lg text-xs font-semibold text-white"
                >
                  Claim
                </button>
              ) : (
                <span className="flex-shrink-0 text-xs text-zinc-500">Not yet reached</span>
              )}
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}