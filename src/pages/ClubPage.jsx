import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import SectionCard from "../components/ui/layout/SectionCard";
import Button from "../components/ui/Button";
import { apiFetch } from "../services/api";
import { useTheme } from "../context/ThemeContext";
import { withAlpha } from "../themes/themeIcons";
import { Trophy, Swords, Lock, Users, ArrowRight, GraduationCap } from "lucide-react";
import RankBadge from "../components/common/RankBadge";

/**
 * ClubPage — the community hub (Phase 12A).
 *
 * Deliberately stays a hub, not a single long page (Bunny's routing
 * decision) — Leaderboard, Public Contests, and Private Contests each get
 * their own dedicated route under /club/*. This page shows summary
 * previews + quick actions and links out.
 *
 * The "active private contests" preview is intentionally an empty-state
 * CTA, not live data — there's no "contests I've joined" endpoint yet
 * (GET /api/contests only filters by status/type, not by participant).
 * Faking that card with placeholder numbers would look like a real
 * feature that silently does nothing; an honest CTA doesn't.
 */
function ClubPage() {
  const { theme } = useTheme();
  const [topThree, setTopThree] = useState([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);

  const [contests, setContests] = useState([]);
  const [contestsLoading, setContestsLoading] = useState(true);

  useEffect(() => {
    apiFetch("/api/leaderboard/global?limit=3")
      .then((d) => setTopThree(d.users || []))
      .catch(() => {})
      .finally(() => setLeaderboardLoading(false));

    apiFetch("/api/contests?status=active,upcoming&type=public")
      .then((d) => setContests((d.contests || []).slice(0, 3)))
      .catch(() => {})
      .finally(() => setContestsLoading(false));
  }, []);

  return (
    <DashboardLayout>
      <div className="max-w-5xl space-y-8">
        <div>
          <h1 className="text-4xl font-bold">Club</h1>
          <p className="text-zinc-400 mt-2">
            Where the Code Club community competes, connects, and grows.
          </p>
        </div>

        {/* ── Leaderboard preview ─────────────────────────────────────── */}
        <SectionCard
          title="Leaderboard"
          subtitle="Top performers right now"
          icon={<Trophy size={18} strokeWidth={2} />}
          accented
          action={
            <Link
              to="/club/leaderboard"
              className="text-sm hover:brightness-110 transition inline-flex items-center gap-1"
              style={{ color: theme.colors.primary }}
            >
              View full leaderboard <ArrowRight size={14} aria-hidden="true" />
            </Link>
          }
        >
          {leaderboardLoading ? (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-12 bg-zinc-800 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : topThree.length === 0 ? (
            <p className="text-zinc-500 text-sm py-2">
              No rankings yet — be the first to solve a problem.
            </p>
          ) : (
            <div className="space-y-2">
              {topThree.map((user) => (
                <Link
                  key={user.username}
                  to={`/u/${user.username}`}
                  className="flex items-center gap-3 bg-zinc-800 hover:bg-zinc-800/70 rounded-xl px-4 py-2.5 transition"
                >
                  <span className="w-6 flex justify-center flex-shrink-0">
                    <RankBadge rank={user.rank} size={22} />
                  </span>
                  <span className="font-medium text-sm truncate flex-1">
                    {user.displayName}
                  </span>
                  <span className="text-xs text-zinc-400 flex-shrink-0">
                    {user.totalXP.toLocaleString()} XP
                  </span>
                </Link>
              ))}
            </div>
          )}
        </SectionCard>

        <div className="grid md:grid-cols-2 gap-6">
          {/* ── Public Contests preview ─────────────────────────────── */}
          <SectionCard
            title="Public Contests"
            subtitle="Compete live, race the clock"
            icon={<Swords size={18} strokeWidth={2} />}
            accented
          >
            {contestsLoading ? (
              <div className="space-y-2">
                {[0, 1].map((i) => (
                  <div key={i} className="h-14 bg-zinc-800 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : contests.length === 0 ? (
              <p className="text-zinc-500 text-sm py-2">
                No contests live or upcoming right now.
              </p>
            ) : (
              <div className="space-y-2 mb-4">
                {contests.map((c) => (
                  <Link
                    key={c._id}
                    to={`/club/public-contests/${c._id}`}
                    className="block bg-zinc-800 hover:bg-zinc-800/70 rounded-xl px-4 py-2.5 transition"
                  >
                    <p className="text-sm font-medium truncate">{c.title}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {c.isActive ? "Live now" : `Starts ${new Date(c.startsAt).toLocaleDateString()}`}
                      {" · "}{c.problemCount} problems
                    </p>
                  </Link>
                ))}
              </div>
            )}
            <Button to="/club/public-contests" variant="theme" size="sm">
              Browse all contests
            </Button>
          </SectionCard>

          {/* ── Private Contests hub ────────────────────────────────── */}
          <SectionCard
            title="Private Contests"
            subtitle="Host or join with friends"
            icon={<Lock size={18} strokeWidth={2} />}
            accented
          >
            <p className="text-zinc-500 text-sm mb-4">
              Have an invite code from a friend or your college? Join instantly —
              or set up your own contest to run.
            </p>
            <div className="flex gap-2">
              <Button to="/club/private-contests" variant="theme" size="sm" className="flex-1">
                Join with code
              </Button>
              <Button to="/club/private-contests" variant="secondary" size="sm" className="flex-1">
                Host a contest
              </Button>
            </div>
          </SectionCard>
        </div>

        {/* ── Battle Rooms teaser ──────────────────────────────────────── */}
        <SectionCard
          title="Battle Rooms"
          subtitle="Team vs. team, live"
          icon={<Users size={18} strokeWidth={2} />}
        >
          <p className="text-zinc-500 text-sm mb-1">
            Real-time team competitions are coming to Code Club — assign
            problems to teammates and race another team to the finish.
          </p>
          <Link
            to="/club/battle-rooms"
            className="text-sm hover:brightness-110 transition inline-flex items-center gap-1 mt-2"
            style={{ color: theme.colors.primary }}
          >
            Learn more <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </SectionCard>

        {/* ── Ambassador ───────────────────────────────────────────────── */}
        <Link
          to="/ambassador"
          className="group flex items-center gap-4 bg-zinc-900 border border-zinc-800 rounded-2xl p-5 hover:border-[var(--theme-primary,#2dd4bf)] transition"
        >
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              backgroundColor: withAlpha(theme.colors.primary, "1f"),
              color: theme.colors.primary,
            }}
          >
            <GraduationCap size={20} strokeWidth={2} aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold">Ambassador Program</p>
            <p className="text-zinc-500 text-sm">Bring Code Club to your campus and earn rewards for it.</p>
          </div>
          <ArrowRight
            size={16}
            className="text-zinc-500 group-hover:text-[var(--theme-primary,#2dd4bf)] transition flex-shrink-0"
            aria-hidden="true"
          />
        </Link>
      </div>
    </DashboardLayout>
  );
}

export default ClubPage;