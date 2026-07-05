import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../services/api";

function countdown(endsAt) {
  const ms = new Date(endsAt) - Date.now();
  if (ms <= 0) return "Ended";
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return h > 0 ? `${h}h ${m}m` : `${m}m ${s}s`;
}

function StatusBadge({ status }) {
  const styles = {
    upcoming: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    active:   "bg-green-500/10  text-green-400  border-green-500/20",
    ended:    "bg-zinc-800      text-zinc-500   border-zinc-700",
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
    const data = await apiFetch(`/api/contests/${contest._id}/join`, { method: "POST" });
    setJoining(false);
    if (data.error) return alert(data.error);
    onJoin();
    navigate(`/contests/${contest._id}`);
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-2xl p-5 transition">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-white truncate">{contest.title}</h3>
          {contest.description && (
            <p className="text-zinc-500 text-xs mt-1 line-clamp-2">{contest.description}</p>
          )}
        </div>
        <div className="ml-3 flex-shrink-0">
          <StatusBadge status={contest.status} />
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs text-zinc-500 mb-4">
        <span>🧩 {contest.problemCount} problems</span>
        <span>👥 {contest.participantCount} joined</span>
        {contest.status === "active" && (
          <span className="text-orange-400 font-semibold">⏱ {time}</span>
        )}
        {contest.status === "upcoming" && (
          <span>Starts {new Date(contest.startsAt).toLocaleDateString()}</span>
        )}
      </div>

      {contest.status === "active" && (
        <div className="flex gap-2">
          <button onClick={handleJoin} disabled={joining}
            className="flex-1 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition">
            {joining ? "Joining…" : "Join & Compete"}
          </button>
          <button onClick={() => navigate(`/contests/${contest._id}`)}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-sm transition">
            Leaderboard
          </button>
        </div>
      )}
      {contest.status === "upcoming" && (
        <p className="text-center text-zinc-600 text-xs py-1">
          Starts {new Date(contest.startsAt).toLocaleString()}
        </p>
      )}
      {contest.status === "ended" && (
        <button onClick={() => navigate(`/contests/${contest._id}`)}
          className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-sm transition">
          View Results
        </button>
      )}
    </div>
  );
}

function JoinPrivateModal({ onClose, onJoined }) {
  const [code, setCode]       = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleJoin() {
    if (!code.trim()) return;
    setLoading(true);
    const data = await apiFetch("/api/contests/join-private", {
      method: "POST",
      body: JSON.stringify({ inviteCode: code.trim().toUpperCase() }),
    });
    setLoading(false);
    if (data.error) return alert(data.error);
    onJoined();
    onClose();
    navigate(`/contests/${data.contestId}`);
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center px-4" onClick={onClose}>
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-white mb-1">Join Private Contest</h3>
        <p className="text-zinc-500 text-sm mb-4">Enter the invite code shared by your college.</p>
        <input
          value={code}
          onChange={e => setCode(e.target.value.toUpperCase())}
          placeholder="e.g. A3F9B2"
          maxLength={6}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white font-mono text-lg tracking-widest outline-none focus:border-green-500/50 text-center mb-4"
        />
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2 rounded-xl text-sm bg-zinc-800 text-zinc-400">Cancel</button>
          <button onClick={handleJoin} disabled={loading || code.length !== 6}
            className="flex-1 py-2 rounded-xl text-sm bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-semibold">
            {loading ? "Joining…" : "Join"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ContestsPage() {
  const [contests, setContests] = useState([]);
  const [tab, setTab]           = useState("active,upcoming");
  const [loading, setLoading]   = useState(true);
  const [showPrivate, setShowPrivate] = useState(false);

  function fetchContests() {
    setLoading(true);
    apiFetch(`/api/contests?status=${tab}&type=public`)
      .then(d => { setContests(d.contests || []); setLoading(false); });
  }

  useEffect(() => { fetchContests(); }, [tab]);

  return (
    <div className="min-h-screen bg-black px-4 py-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black text-white">Contests</h1>
            <p className="text-zinc-500 text-sm">Compete, rank, win.</p>
          </div>
          <button onClick={() => setShowPrivate(true)}
            className="px-4 py-2 bg-zinc-900 border border-zinc-700 hover:border-zinc-500 text-zinc-300 rounded-xl text-sm font-medium transition">
            🔐 Join Private Contest
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { label: "Live & Upcoming", value: "active,upcoming" },
            { label: "Past",            value: "ended" },
          ].map(t => (
            <button key={t.value} onClick={() => setTab(t.value)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                tab === t.value ? "bg-green-600 text-white" : "bg-zinc-900 border border-zinc-800 text-zinc-400"
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : contests.length === 0 ? (
          <div className="text-center py-20 text-zinc-600">
            <p className="text-4xl mb-3">🏆</p>
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

      {showPrivate && (
        <JoinPrivateModal onClose={() => setShowPrivate(false)} onJoined={fetchContests} />
      )}
    </div>
  );
}
