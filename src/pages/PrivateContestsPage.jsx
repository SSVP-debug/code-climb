import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import DashboardLayout from "../layouts/DashboardLayout";
import ClubSubNav from "../components/club/ClubSubNav";
import SectionCard from "../components/ui/layout/SectionCard";
import Button from "../components/ui/Button";
import { apiFetch } from "../services/api";
import { Lock, Users, ShieldCheck } from "lucide-react";

/**
 * PrivateContestsPage (Phase 12A)
 *
 * Join: fully functional today — POST /api/contests/join-private already
 * exists and works (this form replaces the modal that used to live inside
 * ContestsPage.jsx; moved here since Private Contests now has its own page).
 *
 * Host: intentionally a guardrails preview, not a working form. Creating a
 * private contest is still `requireRole("tpo","admin")` on the backend —
 * opening it to verified students is Phase 12B's job. Shipping a form here
 * that calls an endpoint students get a 403 from would be a worse
 * experience than an honest "here's what's coming" card.
 */
function PrivateContestsPage() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [joining, setJoining] = useState(false);

  async function handleJoin() {
    if (code.trim().length !== 6) return;
    setJoining(true);
    const data = await apiFetch("/api/contests/join-private", {
      method: "POST",
      body: JSON.stringify({ inviteCode: code.trim().toUpperCase() }),
    });
    setJoining(false);

    if (data.error) {
      toast.error(data.error);
      return;
    }
    navigate(`/club/public-contests/${data.contestId}`);
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

          {/* ── Host (preview, not functional yet) ──────────────────── */}
          <SectionCard
            title="Host a Contest"
            subtitle="Coming soon — set up your own contest for friends or classmates"
            icon={<Users size={18} strokeWidth={2} />}
          >
            <div className="flex items-start gap-3 bg-zinc-800/60 rounded-xl p-4 mb-4">
              <ShieldCheck size={18} className="text-zinc-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-sm text-zinc-400">
                Hosting will require a verified account. Once live, contests
                you host can have up to <strong className="text-zinc-300">100 participants</strong>,{" "}
                <strong className="text-zinc-300">8 problems</strong>, and run for{" "}
                <strong className="text-zinc-300">30 minutes to 4 hours</strong> — one active
                hosted contest at a time.
              </p>
            </div>
            <Button variant="secondary" disabled>
              Host a Contest — Coming Soon
            </Button>
          </SectionCard>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default PrivateContestsPage;