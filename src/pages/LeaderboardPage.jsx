import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { apiFetch } from "../services/api";
import PageMeta from "../components/seo/PageMeta";
import DashboardLayout from "../layouts/DashboardLayout";
import ClubSubNav from "../components/club/ClubSubNav";
import CollegeVerifyModal from "../components/profile/CollegeVerifyModal";
import { withAlpha } from "../themes/themeIcons";
import { Globe, GraduationCap, Flame } from "lucide-react";
import RankBadge from "../components/common/RankBadge";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

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
      <span className="w-8 flex justify-center">
        <RankBadge rank={user.rank} />
      </span>

      {/* Avatar */}
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
        style={{ backgroundColor: theme.colors.primary, color: "#09090b" }}
      >
        {(user.displayName || "?").charAt(0).toUpperCase()}
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <Link
          to={`/u/${user.username}`}
          className="font-semibold text-sm text-white hover:text-[var(--theme-primary,#2dd4bf)] transition truncate block"
        >
          {user.displayName}
        </Link>
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
  const [myRank, setMyRank]     = useState(null);
  const [page, setPage]         = useState(1);
  const [total, setTotal]       = useState(0);
  const [domain, setDomain]     = useState("");

  // Phase 12C: college verification gate state
  const [collegeVerified, setCollegeVerified] = useState(undefined); // undefined = not checked yet
  const [showVerifyModal, setShowVerifyModal] = useState(false);

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === "global") {
        const r = await fetch(`${API_URL}/api/leaderboard/global?page=${page}&limit=20`);
        const d = await r.json();
        setUsers(d.users || []);
        setTotal(d.total || 0);
      } else if (tab === "college") {
        // Requires auth + a verified college — derives domain server-side
        // from the caller's own record, so no domain param here at all.
        // apiFetch *throws* on non-2xx (it doesn't resolve to {error}) —
        // the 403 "not verified" gate response lands in the catch below.
        const d = await apiFetch("/api/leaderboard/college");
        setCollegeVerified(true);
        setDomain(d.domain || "");
        setUsers(d.users || []);
        setTotal(d.total || 0);
      }
    } catch {
      if (tab === "college") {
        setCollegeVerified(false);
        setUsers([]);
        setTotal(0);
      }
    }
    setLoading(false);
  }, [tab, page]);

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
            {tab === "college" && domain
              ? `${total} students at ${domain}`
              : total > 0 ? `${total} students ranked` : "Rankings loading…"}
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
        </div>

        {/* College tab, not verified — gate card (PRD's "clicking without
            verification shows a prompt" flow, as an inline card rather than
            an immediate popup so it isn't jarring on every tab click) */}
        {tab === "college" && collegeVerified === false ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: withAlpha(theme.colors.primary, "1f"), color: theme.colors.primary }}
            >
              <GraduationCap size={26} strokeWidth={2} aria-hidden="true" />
            </div>
            <h2 className="text-lg font-bold mb-2">Verify Your College Email</h2>
            <p className="text-zinc-400 text-sm max-w-sm mx-auto mb-6">
              Connect your official college email address to access your
              college leaderboard, participate in college-exclusive
              contests, and compete with your classmates.
            </p>
            <button
              onClick={() => setShowVerifyModal(true)}
              className="px-5 py-2.5 rounded-xl font-semibold text-sm transition hover:brightness-110"
              style={{ backgroundColor: theme.colors.primary, color: "#09090b" }}
            >
              Verify College Email
            </button>
          </div>
        ) : (
          <>
            {/* List */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
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
                  No students found yet. Be the first!
                </div>
              ) : (
                <div className="divide-y divide-zinc-800/50">
                  {users.map(u => (
                    <RankRow key={u.username} user={u} highlight={myRank === u.rank} theme={theme} />
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
                <span className="text-sm text-zinc-500">Page {page} of {totalPages}</span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 text-sm rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white disabled:opacity-40 transition"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}

        {showVerifyModal && (
          <CollegeVerifyModal
            onClose={() => setShowVerifyModal(false)}
            onSent={() => setShowVerifyModal(false)}
          />
        )}
      </div>
    </DashboardLayout>
  );
}