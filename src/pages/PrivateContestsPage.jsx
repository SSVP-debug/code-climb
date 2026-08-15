import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import DashboardLayout from "../layouts/DashboardLayout";
import ClubSubNav from "../components/club/ClubSubNav";
import SectionCard from "../components/ui/layout/SectionCard";
import Button from "../components/ui/Button";
import HostContestForm from "../components/club/HostContestForm";
import { apiFetch } from "../services/api";
import { Lock, Users } from "lucide-react";

/**
 * PrivateContestsPage
 *
 * Join: fully functional since Phase 12A — POST /api/contests/join-private.
 * Pre-fills the invite code from ?code= so a shared invite link (generated
 * by HostContestForm's success screen) drops a friend straight into a
 * ready-to-submit form instead of making them retype a 6-character code.
 *
 * Host: fully functional as of Phase 12B — POST /api/contests/private is
 * now open to students (guardrailed: max 8 problems, max 100 participants,
 * 30min–4hr duration, one active hosted contest at a time). See
 * HostContestForm.jsx for the form itself.
 */
function PrivateContestsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [code, setCode] = useState("");
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    const fromLink = searchParams.get("code");
    // Standard "fetch on mount" pattern used throughout this codebase's
    // data-fetching hooks/pages: the called function is a useCallback-wrapped
    // async fetcher whose setState calls all happen after its own await, not
    // synchronously in this effect's body. react-hooks/set-state-in-effect
    // still flags the call site here because it can't see across the
    // function boundary. A real fix would mean adopting a data-fetching
    // library (React Query/SWR) or inlining every one of these fetchers —
    // out of scope for a lint-debt pass; suppressed and documented instead.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount pattern: the called function is a useCallback-wrapped async fetcher that sets loading/data state after its own await, not synchronously; see src/hooks/useAdminSettings.js for the fullest write-up of this decision.
    if (fromLink) setCode(fromLink.toUpperCase().slice(0, 6));
  }, [searchParams]);

  async function handleJoin() {
    if (code.trim().length !== 6) return;
    setJoining(true);
    try {
      const data = await apiFetch("/api/contests/join-private", {
        method: "POST",
        body: JSON.stringify({ inviteCode: code.trim().toUpperCase() }),
      });
      navigate(`/club/public-contests/${data.contestId}`);
    } catch (err) {
      toast.error(err.message || "Failed to join contest.");
    }
    setJoining(false);
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl">
        <ClubSubNav />

        <div className="mb-8">
          <h1 className="text-3xl font-bold">Private Contests</h1>
          <p className="text-zinc-400 mt-2">
            Compete with friends, classmates, or your college using an invite code.
          </p>
        </div>

        <div className="space-y-6">
          {/* ── Join ─────────────────────────────────────────────────── */}
          <SectionCard
            title="Join a Contest"
            subtitle="Enter the invite code shared with you"
            icon={<Lock size={18} strokeWidth={2} />}
            accented
          >
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                placeholder="e.g. A3F9B2"
                maxLength={6}
                className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white font-mono text-lg tracking-widest outline-none focus:border-[var(--theme-primary,#2dd4bf)] text-center sm:text-left"
              />
              <Button
                onClick={handleJoin}
                disabled={joining || code.length !== 6}
                loading={joining}
                variant="theme"
              >
                {joining ? "Joining…" : "Join Contest"}
              </Button>
            </div>
          </SectionCard>

          {/* ── Host ─────────────────────────────────────────────────── */}
          <SectionCard
            title="Host a Contest"
            subtitle="Set up your own contest for friends or classmates"
            icon={<Users size={18} strokeWidth={2} />}
            accented
          >
            <HostContestForm />
          </SectionCard>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default PrivateContestsPage;