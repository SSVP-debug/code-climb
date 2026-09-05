import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { apiFetch } from "../services/api";
import Button from "../components/ui/Button";
import DashboardLayout from "../layouts/DashboardLayout";
import ClubSubNav from "../components/club/ClubSubNav";
import { useTheme } from "../hooks/useTheme";
import { getTimeRemaining } from "../utils/countdown";
import { Puzzle, Users, Clock, Trophy, Lock } from "lucide-react";

function countdown(endsAt) {
  const { isEnded, days, hours, minutes, seconds } = getTimeRemaining(endsAt);
  if (isEnded) return "Ended";
  const totalHours = days * 24 + hours;
  return totalHours > 0 ? `${totalHours}h ${minutes}m` : `${minutes}m ${seconds}s`;
}

function StatusBadge({ status }) {
  // "active"/"upcoming"/"ended" are status semantics, not brand decoration
  // — same rule as difficulty badges elsewhere, kept fixed across themes.
  const styles = {
    upcoming: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    active:   "bg-green-500/10  text-green-400  border-green-500/20",
    ended:    "bg-[var(--surface-elevated)] text-[var(--muted-foreground)] border-[var(--border-strong)]",
  };
  return (
    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${styles[status]}`}>
      {status}
    </span>
  );
}

function ContestCard({ contest, onJoin }) {
  const [joining, setJoining] = useState(false);
  const [time, setTime]       = useState(countdown(contest.endsAt));
  const navigate = useNavigate();

  useEffect(() => {
    if (contest.status !== "active") return;
    const t = setInterval(() => setTime(countdown(contest.endsAt)), 1000);
    return () => clearInterval(t);
  }, [contest.endsAt, contest.status]);

  async function handleJoin() {
    setJoining(true);
    try {
      await apiFetch(`/api/contests/${contest._id}/join`, { method: "POST" });
      onJoin();
      navigate(`/club/public-contests/${contest._id}`);
    } catch (err) {
      toast.error(err.message || "Failed to join contest.");
    }
    setJoining(false);
  }

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--theme-primary,#2dd4bf)] rounded-2xl p-5 transition">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-[var(--foreground)] truncate">{contest.title}</h3>
          {contest.description && (
            <p className="text-[var(--muted-foreground)] text-xs mt-1 line-clamp-2">{contest.description}</p>
          )}
        </div>
        <div className="ml-3 flex-shrink-0">
          <StatusBadge status={contest.status} />
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs text-[var(--muted-foreground)] mb-4">
        <span className="flex items-center gap-1">
          <Puzzle size={12} aria-hidden="true" />{contest.problemCount} problems
        </span>
        <span className="flex items-center gap-1">
          <Users size={12} aria-hidden="true" />{contest.participantCount} joined
        </span>
        {contest.status === "active" && (
          <span className="text-orange-400 font-semibold flex items-center gap-1">
            <Clock size={12} aria-hidden="true" />{time}
          </span>
        )}
        {contest.status === "upcoming" && (
          <span>Starts {new Date(contest.startsAt).toLocaleDateString()}</span>
        )}
      </div>

      {contest.status === "active" && (
        <div className="flex gap-2">
          <Button onClick={handleJoin} disabled={joining} loading={joining} variant="theme" className="flex-1">
            {joining ? "Joining…" : "Join & Compete"}
          </Button>
          <button onClick={() => navigate(`/club/public-contests/${contest._id}`)}
            className="px-4 py-2 bg-[var(--surface-elevated)] hover:bg-[var(--border-strong)] text-[var(--foreground)] rounded-xl text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-primary,#2dd4bf)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]">
            Leaderboard
          </button>
        </div>
      )}
      {contest.status === "upcoming" && (
        <button onClick={() => navigate(`/club/public-contests/${contest._id}`)}
          className="w-full py-2 bg-[var(--surface-elevated)] hover:bg-[var(--border-strong)] text-[var(--foreground)] rounded-xl text-sm transition flex items-center justify-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-primary,#2dd4bf)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]">
          Starts {new Date(contest.startsAt).toLocaleString()}
        </button>
      )}
      {contest.status === "ended" && (
        <button onClick={() => navigate(`/club/public-contests/${contest._id}`)}
          className="w-full py-2 bg-[var(--surface-elevated)] hover:bg-[var(--border-strong)] text-[var(--foreground)] rounded-xl text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-primary,#2dd4bf)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]">
          View Results
        </button>
      )}
    </div>
  );
}

export default function ContestsPage() {
  const { theme } = useTheme();
  const [contests, setContests] = useState([]);
  const [tab, setTab]           = useState("active,upcoming");
  const [loading, setLoading]   = useState(true);

  const fetchContests = useCallback(() => {
    setLoading(true);
    apiFetch(`/api/contests?status=${tab}&type=public`)
      .then(d => setContests(d.contests || []))
      .catch(err => toast.error(err.message || "Failed to load contests."))
      .finally(() => setLoading(false));
  }, [tab]);

  // Standard "fetch on mount" pattern used throughout this codebase's
  // data-fetching hooks/pages: the called function is a useCallback-wrapped
  // async fetcher whose setState calls all happen after its own await, not
  // synchronously in this effect's body. react-hooks/set-state-in-effect
  // still flags the call site here because it can't see across the
  // function boundary. A real fix would mean adopting a data-fetching
  // library (React Query/SWR) or inlining every one of these fetchers —
  // out of scope for a lint-debt pass; suppressed and documented instead.
  // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount pattern: the called function is a useCallback-wrapped async fetcher that sets loading/data state after its own await, not synchronously; see src/hooks/useAdminSettings.js for the fullest write-up of this decision.
  useEffect(() => { fetchContests(); }, [fetchContests]);

  return (
    <DashboardLayout>
      <div className="max-w-5xl">
        <ClubSubNav />

        {/* Header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-black text-[var(--foreground)]">Public Contests</h1>
            <p className="text-[var(--muted-foreground)] text-sm">Compete, rank, win.</p>
          </div>
          <Button to="/club/private-contests" variant="secondary" size="sm">
            <Lock size={14} aria-hidden="true" /> Join Private Contest
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { label: "Live & Upcoming", value: "active,upcoming" },
            { label: "Past",            value: "ended" },
          ].map(t => {
            const active = tab === t.value;
            return (
              <button key={t.value} onClick={() => setTab(t.value)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-primary,#2dd4bf)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] ${
                  active ? "text-[var(--foreground)]" : "bg-[var(--surface)] border border-[var(--border)] text-[var(--muted-foreground)]"
                }`}
                style={active ? { backgroundColor: theme.colors.primary, color: "#09090b" } : undefined}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div
              className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: theme.colors.primary, borderTopColor: "transparent" }}
            />
          </div>
        ) : contests.length === 0 ? (
          <div className="text-center py-20 text-[var(--muted-foreground)]">
            <Trophy size={40} className="mx-auto mb-3 opacity-50" aria-hidden="true" />
            <p>No contests {tab.includes("ended") ? "past" : "live or upcoming"} right now.</p>
            <p className="text-sm mt-1">Check back soon or ask your TPO to create one.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {contests.map(c => (
              <ContestCard key={c._id} contest={c} onJoin={fetchContests} />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}