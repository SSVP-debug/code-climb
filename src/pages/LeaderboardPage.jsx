import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { useAppContext } from "../hooks/useAppContext";
import PageMeta from "../components/seo/PageMeta";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const MEDAL = { 1: "🥇", 2: "🥈", 3: "🥉" };
const DIFF_BADGE = "text-[10px] font-bold px-1.5 py-0.5 rounded-full";

function RankRow({ user, highlight = false }) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
      highlight
        ? "bg-green-500/10 border border-green-500/20"
        : "hover:bg-zinc-800/50"
    }`}>
      {/* Rank */}
      <span className={`w-8 text-center text-sm font-black ${
        user.rank <= 3 ? "text-lg" : "text-zinc-500"
      }`}>
        {MEDAL[user.rank] || `#${user.rank}`}
      </span>

      {/* Avatar */}
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-700 flex items-center justify-center text-xs font-bold text-black flex-shrink-0">
        {(user.displayName || "?").charAt(0).toUpperCase()}
      </div>

      {/* Name + college */}
      <div className="flex-1 min-w-0">
        <Link
          to={`/u/${user.username}`}
          className="font-semibold text-sm text-white hover:text-green-400 transition truncate block"
        >
          {user.displayName}
        </Link>
        {user.college && (
          <p className="text-[10px] text-zinc-500 truncate">{user.college}</p>
        )}
      </div>

      {/* Stats */}
      <div className="flex items-center gap-3 text-xs text-zinc-400">
        <span className={`${DIFF_BADGE} bg-green-500/10 text-green-400`}>{user.easy}E</span>
        <span className={`${DIFF_BADGE} bg-yellow-500/10 text-yellow-400`}>{user.medium}M</span>
        <span className={`${DIFF_BADGE} bg-red-500/10 text-red-400`}>{user.hard}H</span>
        {user.currentStreak > 0 && (
          <span className="text-orange-400 font-bold">🔥{user.currentStreak}</span>
        )}
        <span className="font-bold text-white w-16 text-right">{user.totalXP.toLocaleString()} XP</span>
      </div>
    </div>
  );
}

export default function LeaderboardPage() {
  const { theme } = useTheme();
  const { solvedProblems } = useAppContext();

  const [tab, setTab]           = useState("global");
  const [users, setUsers]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [domain, setDomain]     = useState("");
  const [domains, setDomains]   = useState([]);
  const [myRank, setMyRank]     = useState(null);
  const [page, setPage]         = useState(1);
  const [total, setTotal]       = useState(0);

  // Fetch available college domains for dropdown
  useEffect(() => {
    fetch(`${API_URL}/api/leaderboard/domains`)
      .then(r => r.json())
      .then(d => setDomains(d.domains || []))
      .catch(() => {});
  }, []);

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === "global") {
        const r = await fetch(`${API_URL}/api/leaderboard/global?page=${page}&limit=20`);
        const d = await r.json();
        setUsers(d.users || []);
        setTotal(d.total || 0);
      } else if (tab === "college" && domain) {
        const r = await fetch(`${API_URL}/api/leaderboard/college?domain=${encodeURIComponent(domain)}`);
        const d = await r.json();
        setUsers(d.users || []);
        setTotal(d.total || 0);
      }
    } catch {}
    setLoading(false);
  }, [tab, page, domain]);

  useEffect(() => { fetchLeaderboard(); }, [fetchLeaderboard]);

  const LIMIT = 20;
  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <PageMeta
        title="Leaderboard · Code Club"
        description="See the top DSA solvers on Code Club. Filter by college or view the global rankings."
        path="/leaderboard"
      />

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white mb-1">Leaderboard</h1>
        <p className="text-zinc-400 text-sm">
          {total > 0 ? `${total} students ranked` : "Rankings loading…"}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {["global", "college"].map(t => (
          <button
            key={t}
            onClick={() => { setTab(t); setPage(1); }}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
              tab === t
                ? "bg-green-600 text-white"
                : "bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800"
            }`}
          >
            {t === "global" ? "🌐 Global" : "🏫 College"}
          </button>
        ))}

        {/* College domain selector */}
        {tab === "college" && (
          <select
            value={domain}
            onChange={e => { setDomain(e.target.value); setPage(1); }}
            className="ml-2 bg-zinc-900 border border-zinc-700 text-zinc-300 text-sm rounded-xl px-3 py-2 outline-none flex-1"
          >
            <option value="">Select your college…</option>
            {domains.map(d => (
              <option key={d.domain} value={d.domain}>
                {d.domain} ({d.count} students)
              </option>
            ))}
          </select>
        )}
      </div>

      {/* List */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        {/* Column headers */}
        <div className="flex items-center gap-3 px-4 py-2 border-b border-zinc-800 text-[10px] text-zinc-600 uppercase tracking-widest">
          <span className="w-8">Rank</span>
          <span className="w-8" />
          <span className="flex-1">Student</span>
          <span className="text-right">Easy · Med · Hard · Streak · XP</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-16 text-zinc-500">
            {tab === "college" && !domain
              ? "Select a college above to see its leaderboard."
              : "No students found yet. Be the first!"}
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/50">
            {users.map(u => (
              <RankRow
                key={u.username}
                user={u}
                highlight={myRank === u.rank}
              />
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && tab === "global" && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 text-sm rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white disabled:opacity-40 transition"
          >
            ← Prev
          </button>
          <span className="text-sm text-zinc-500">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 text-sm rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white disabled:opacity-40 transition"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
