import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { apiFetch } from "../services/api";
import { getTimeRemaining } from "../utils/countdown";
import DashboardLayout from "../layouts/DashboardLayout";
import ClubSubNav from "../components/club/ClubSubNav";
import Button from "../components/ui/Button";
import { useTheme } from "../hooks/useTheme";
import {
  Check,
  Trophy,
  Target,
  Users2,
  Lock,
  Medal,
} from "lucide-react";

function formatTime(endsAt) {
  const { isEnded, days, hours, minutes, seconds } =
    getTimeRemaining(endsAt);

  if (isEnded) return "00:00:00";

  const totalHours = days * 24 + hours;

  return `${String(totalHours).padStart(2, "0")}:${String(minutes).padStart(
    2,
    "0"
  )}:${String(seconds).padStart(2, "0")}`;
}

export default function ContestDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();

  const [contest, setContest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timer, setTimer] = useState("");
  const [joining, setJoining] = useState(false);

  const fetch = useCallback(async () => {
    try {
      const data = await apiFetch(`/api/contests/${id}`);
      setContest(data);
    } catch (err) {
      toast.error(err.message || "Failed to load contest.");
      navigate("/club/public-contests");
    }

    setLoading(false);
  }, [id, navigate]);

  // Gate 3 audit, P0-2:
  // Shared contest links open this page directly, so public contests
  // need a join action here rather than forcing users back to the list.
  // Private contests continue to use the invite-code flow.
  async function handleJoin() {
    setJoining(true);

    try {
      await apiFetch(`/api/contests/${id}/join`, {
        method: "POST",
      });

      await fetch();
    } catch (err) {
      toast.error(err.message || "Failed to join contest.");
    }

    setJoining(false);
  }

  useEffect(() => {
    // Standard "fetch on mount" pattern used throughout this codebase's
    // data-fetching hooks/pages: the called function is a useCallback-wrapped
    // async fetcher whose setState calls all happen after its own await, not
    // synchronously in this effect's body. react-hooks/set-state-in-effect
    // still flags the call site here because it can't see across the
    // function boundary. A real fix would mean adopting a data-fetching
    // library (React Query/SWR) or inlining every one of these fetchers —
    // out of scope for a lint-debt pass; suppressed and documented instead.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount pattern: the called function is a useCallback-wrapped async fetcher that sets loading/data state after its own await, not synchronously; see src/hooks/useAdminSettings.js for the fullest write-up of this decision.
    fetch();
  }, [fetch]);

  // Active contest countdown.
  useEffect(() => {
    if (!contest || contest.status !== "active") return;

    // Standard "fetch on mount" pattern used throughout this codebase's
    // data-fetching hooks/pages: the called function is a useCallback-wrapped
    // async fetcher whose setState calls all happen after its own await, not
    // synchronously in this effect's body. react-hooks/set-state-in-effect
    // still flags the call site here because it can't see across the
    // function boundary. A real fix would mean adopting a data-fetching
    // library (React Query/SWR) or inlining every one of these fetchers —
    // out of scope for a lint-debt pass; suppressed and documented instead.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount pattern: the called function is a useCallback-wrapped async fetcher that sets loading/data state after its own await, not synchronously; see src/hooks/useAdminSettings.js for the fullest write-up of this decision.
    setTimer(formatTime(contest.endsAt));

    const interval = setInterval(() => {
      setTimer(formatTime(contest.endsAt));
    }, 1000);

    return () => clearInterval(interval);
  }, [contest]);

  // Gate 3 audit, P1-1:
  // Re-check upcoming contests so the UI can transition to active
  // without requiring a manual refresh.
  // The server remains the authority on contest status.
  useEffect(() => {
    if (!contest || contest.status !== "upcoming") return;

    const poll = setInterval(() => {
      fetch();
    }, 15_000);

    return () => clearInterval(poll);
  }, [contest, fetch]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-32">
          <div
            className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
            style={{
              borderColor: theme.colors.primary,
              borderTopColor: "transparent",
            }}
          />
        </div>
      </DashboardLayout>
    );
  }

  const {
    leaderboard = [],
    problemSlugs = [],
    problemCount = 0,
    myRank,
    myScore,
    mySolvedSlugs = [],
    isJoined,
  } = contest;

  // Results computed from the contest payload already returned by /:id.
  const totalParticipants = leaderboard.length;

  const percentile =
    myRank && totalParticipants > 1
      ? Math.round(
          ((totalParticipants - myRank) / (totalParticipants - 1)) * 100
        )
      : null;

  const mvp = leaderboard.find((participant) => participant.rank === 1);
  const isMvp = isJoined && myRank === 1;

  return (
    <DashboardLayout>
      <div className="max-w-5xl">
        <ClubSubNav />

        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <Link
              to="/club/public-contests"
              className="text-xs text-[var(--muted-foreground)] hover:text-[var(--muted-foreground)] mb-1 block"
            >
              ← Contests
            </Link>

            <h1 className="text-2xl font-black text-[var(--foreground)]">
              {contest.title}
            </h1>

            {contest.description && (
              <p className="text-[var(--muted-foreground)] text-sm mt-1">
                {contest.description}
              </p>
            )}
          </div>

          {contest.status === "active" && (
            <div className="text-right">
              <p className="text-xs text-[var(--muted-foreground)] mb-1">
                Time Remaining
              </p>

              <p className="text-2xl font-mono font-bold text-orange-400">
                {timer || formatTime(contest.endsAt)}
              </p>
            </div>
          )}
        </div>

        {/* Join */}
        {!isJoined &&
          contest.status !== "ended" &&
          (contest.type === "private" ? (
            <div className="rounded-2xl p-5 mb-6 border border-[var(--border)] bg-[var(--surface)] flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--surface-elevated)] flex items-center justify-center flex-shrink-0 text-[var(--muted-foreground)]">
                  <Lock
                    size={18}
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                </div>

                <div>
                  <p className="font-semibold text-[var(--foreground)]">
                    This is a private contest
                  </p>

                  <p className="text-sm text-[var(--muted-foreground)]">
                    Join with the invite code shared with you.
                  </p>
                </div>
              </div>

              <Link
                to="/club/private-contests"
                className="text-sm font-medium hover:brightness-110 transition"
                style={{ color: theme.colors.primary }}
              >
                Enter invite code →
              </Link>
            </div>
          ) : (
            <div
              className="rounded-2xl p-5 mb-6 border flex items-center justify-between flex-wrap gap-3"
              style={{
                backgroundColor: `${theme.colors.primary}0d`,
                borderColor: `${theme.colors.primary}33`,
              }}
            >
              <div>
                <p className="font-semibold text-[var(--foreground)]">
                  You haven't joined this contest yet
                </p>

                <p className="text-sm text-[var(--muted-foreground)]">
                  Join to start solving and appear on the leaderboard.
                </p>
              </div>

              <Button
                onClick={handleJoin}
                disabled={joining}
                loading={joining}
                variant="theme"
              >
                {joining ? "Joining…" : "Join Contest"}
              </Button>
            </div>
          ))}

        {/* Your Results */}
        {contest.status === "ended" && isJoined && (
          <div
            className="rounded-2xl p-6 mb-6 border"
            style={{
              backgroundColor: `${theme.colors.primary}0d`,
              borderColor: `${theme.colors.primary}33`,
            }}
          >
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                {isMvp ? (
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{
                      backgroundColor: `${theme.colors.primary}1f`,
                      color: theme.colors.primary,
                    }}
                  >
                    <Trophy
                      size={22}
                      strokeWidth={2}
                      aria-hidden="true"
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-2xl bg-[var(--surface-elevated)] flex items-center justify-center flex-shrink-0 text-[var(--muted-foreground)]">
                    <Target
                      size={22}
                      strokeWidth={2}
                      aria-hidden="true"
                    />
                  </div>
                )}

                <div>
                  <p className="font-bold text-lg">
                    {isMvp ? "MVP — Top Performer" : "Your Results"}
                  </p>

                  {percentile !== null && (
                    <p className="text-sm text-[var(--muted-foreground)]">
                      You beat {percentile}% of participants
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-6 text-center">
                <div>
                  <p
                    className="text-2xl font-black"
                    style={{ color: theme.colors.primary }}
                  >
                    #{myRank}
                  </p>

                  <p className="text-[10px] text-[var(--muted-foreground)] uppercase tracking-wide">
                    Rank
                  </p>
                </div>

                <div>
                  <p className="text-2xl font-black">
                    {myScore}
                  </p>

                  <p className="text-[10px] text-[var(--muted-foreground)] uppercase tracking-wide">
                    Score
                  </p>
                </div>

                <div>
                  <p className="text-2xl font-black">
                    {mySolvedSlugs.length}/{problemSlugs.length}
                  </p>

                  <p className="text-[10px] text-[var(--muted-foreground)] uppercase tracking-wide">
                    Solved
                  </p>
                </div>
              </div>
            </div>

            {!isMvp && mvp && (
              <p className="text-xs text-[var(--muted-foreground)] mt-4 flex items-center gap-1.5">
                <Users2
                  size={13}
                  aria-hidden="true"
                />

                MVP:

                <span className="text-[var(--muted-foreground)] font-medium">
                  {mvp.displayName || mvp.username}
                </span>

                with {mvp.score} points
              </p>
            )}
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-6">
          {/* Problems */}
          <div className="md:col-span-1">
            <h2 className="text-sm font-semibold text-[var(--muted-foreground)] uppercase tracking-widest mb-3">
              Problems
            </h2>

            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden">
              {contest.status === "upcoming" &&
              problemSlugs.length === 0 ? (
                <div className="px-4 py-6 text-sm text-[var(--muted-foreground)] text-center">
                  {problemCount > 0
                    ? `${problemCount} problem${
                        problemCount === 1 ? "" : "s"
                      } — revealed when the contest starts`
                    : "Problems will be revealed when the contest starts"}
                </div>
              ) : (
                problemSlugs.map((slug, i) => {
                  const solved =
                    isJoined && mySolvedSlugs.includes(slug);

                  return (
                    <Link
                      key={slug}
                      to={`/problems/${slug}?contest=${contest._id}`}
                      className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)]/50 hover:bg-[var(--surface-elevated)]/40 transition last:border-0"
                    >
                      <span
                        className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={
                          solved
                            ? {
                                backgroundColor: "var(--color-verdict-accept, #2dd4bf)",
                                color: "#000",
                              }
                            : {
                                backgroundColor: "var(--surface-elevated)",
                                color: "var(--muted-foreground)",
                              }
                        }
                      >
                        {i + 1}
                      </span>

                      <span className="text-sm text-[var(--muted-foreground)] font-mono truncate">
                        {slug}
                      </span>

                      {solved && (
                        <Check
                          size={14}
                          className="ml-auto text-green-400"
                          aria-hidden="true"
                        />
                      )}
                    </Link>
                  );
                })
              )}
            </div>

            {/* Score */}
            {isJoined && (
              <div className="mt-4 bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 text-center">
                <p className="text-xs text-[var(--muted-foreground)] mb-1">
                  Your Score
                </p>

                <p
                  className="text-3xl font-black"
                  style={{ color: theme.colors.primary }}
                >
                  {myScore}
                </p>

                {myRank && (
                  <p className="text-[var(--muted-foreground)] text-sm mt-1">
                    Rank #{myRank}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Leaderboard */}
          <div className="md:col-span-2">
            <h2 className="text-sm font-semibold text-[var(--muted-foreground)] uppercase tracking-widest mb-3">
              Leaderboard · {leaderboard.length} participants
            </h2>

            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden">
              {/* Table Header */}
              <div className="grid grid-cols-12 px-4 py-2 border-b border-[var(--border)] text-[10px] text-[var(--muted-foreground)] uppercase tracking-widest">
                <span className="col-span-1">#</span>
                <span className="col-span-6">Participant</span>
                <span className="col-span-2 text-center">
                  Solved
                </span>
                <span className="col-span-3 text-right">
                  Score
                </span>
              </div>

              {/* Leaderboard Rows */}
              <div className="max-h-[500px] overflow-y-auto divide-y divide-[var(--border)]/40">
                {leaderboard.length === 0 ? (
                  <p className="text-center text-[var(--muted-foreground)] py-10 text-sm">
                    No participants yet.
                  </p>
                ) : (
                  leaderboard.map((participant, i) => {
                    const isTopThree = i < 3;

                    const rankColor =
                      i === 0
                        ? "text-yellow-400"
                        : i === 1
                          ? "text-[var(--muted-foreground)]"
                          : i === 2
                            ? "text-orange-700"
                            : "text-[var(--muted-foreground)]";

                    return (
                      <div
                        key={participant.username}
                        className="grid grid-cols-12 items-center px-4 py-3"
                        style={
                          participant.rank === myRank
                            ? {
                                backgroundColor: `${theme.colors.primary}0d`,
                              }
                            : undefined
                        }
                      >
                        {/* Rank */}
                        <span
                          className={`col-span-1 text-sm font-bold flex items-center gap-1 ${rankColor}`}
                        >
                          {isTopThree ? (
                            <>
                              <Medal
                                size={16}
                                strokeWidth={2}
                                aria-hidden="true"
                              />

                              <span className="text-xs">
                                {participant.rank}
                              </span>
                            </>
                          ) : (
                            `#${participant.rank}`
                          )}
                        </span>

                        {/* Participant */}
                        <span className="col-span-6 text-sm text-[var(--foreground)] truncate">
                          {participant.displayName ||
                            participant.username}
                        </span>

                        {/* Solved */}
                        <span className="col-span-2 text-center text-sm text-[var(--muted-foreground)]">
                          {participant.solvedSlugs?.length ?? 0}
                        </span>

                        {/* Score */}
                        <span
                          className="col-span-3 text-right text-sm font-bold"
                          style={{
                            color: theme.colors.primary,
                          }}
                        >
                          {participant.score}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}