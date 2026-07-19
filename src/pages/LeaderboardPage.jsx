import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import PageMeta from "../components/seo/PageMeta";
import DashboardLayout from "../layouts/DashboardLayout";
import ClubSubNav from "../components/club/ClubSubNav";
import { withAlpha } from "../themes/themeIcons";
import { Globe, GraduationCap, Flame } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const MEDAL = { 1: "🥇", 2: "🥈", 3: "🥉" };
const DIFF_BADGE = "text-[10px] font-bold px-1.5 py-0.5 rounded-full";

function RankRow({ user, highlight = false, theme }) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-xl transition-colors hover:bg-zinc-800/50"
      style={
        highlight
          ? {
              backgroundColor: withAlpha(theme.colors.primary, "1a"),
              border: `1px solid ${withAlpha(theme.colors.primary, "33")}`,
            }
          : undefined
      }
    >
      {/* Rank */}
      <span className={`w-8 text-center text-sm font-black ${
        user.rank <= 3 ? "text-lg" : "text-zinc-500"
      }`}>
        {MEDAL[user.rank] || `#${user.rank}`}
      </span>

      {/* Avatar */}
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
        style={{ backgroundColor: theme.colors.primary, color: "#09090b" }}
      >
        {(user.displayName || "?").charAt(0).toUpperCase()}
      </div>

      {/* Name + college */}
      <div className="flex-1 min-w-0">
        <Link
          to={`/u/${user.username}`}
          className="font-semibold text-sm text-white hover:text-[var(--theme-primary,#2dd4bf)] transition truncate block"
        >
          {user.displayName}
        </Link>
        {user.college && (
          <p className="text-[10px] text-zinc-500 truncate">{user.college}</p>
        )}
      </div>

      {/* Stats — difficulty badges stay semantic green/yellow/red regardless
          of theme, same rule as everywhere else in the app */}
      <div className="flex items-center gap-3 text-xs text-zinc-400">
        <span className={`${DIFF_BADGE} bg-green-500/10 text-green-400`}>{user.easy}E</span>
        <span className={`${DIFF_BADGE} bg-yellow-500/10 text-yellow-400`}>{user.medium}M</span>
        <span className={`${DIFF_BADGE} bg-red-500/10 text-red-400`}>{user.hard}H</span>
        {user.currentStreak > 0 && (
          <span className="text-orange-400 font-bold flex items-center gap-0.5">
            <Flame size={12} strokeWidth={2.5} aria-hidden="true" />{user.currentStreak}
          </span>
        )}
        <span className="font-bold text-white w-16 text-right">{user.totalXP.toLocaleString()} XP</span>
      </div>
    </div>
  );
}

export default function LeaderboardPage() {
  const { theme } = useTheme();

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
    <DashboardLayout>
      <div className="max-w-3xl">
        <PageMeta
          title="Leaderboard · Code Club"
          description="See the top DSA solvers on Code Club. Filter by college or view the global rankings."
          path="/club/leaderboard"
        />

        <ClubSubNav />

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-white mb-1">Leaderboard</h1>
          <p className="text-zinc-400 text-sm">
            {total > 0 ? `${total} students ranked` : "Rankings loading…"}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { id: "global", label: "Global", icon: Globe },
            { id: "college", label: "College", icon: GraduationCap },
          ].map(({ id, label, icon: Icon }) => {
            const active = tab === id;
            return (
              <button
                key={id}
                onClick={() => { setTab(id); setPage(1); }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition ${
                  active ? "text-white" : "bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800"
                }`}
                style={active ? { backgroundColor: theme.colors.primary, color: "#09090b" } : undefined}
              >
                <Icon size={14} strokeWidth={2} aria-hidden="true" />
                {label}
              </button>
            );
          })}

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
              <div
                className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
                style={{ borderColor: theme.colors.primary, borderTopColor: "transparent" }}
              />
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
                  theme={theme}
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
    </DashboardLayout>
  );
}