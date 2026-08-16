import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { apiFetch } from "../services/api";
import { useTheme } from "../hooks/useTheme";
import { withAlpha } from "../themes/themeIcons";
import DashboardLayout from "../layouts/DashboardLayout";
import ClubSubNav from "../components/club/ClubSubNav";
import Button from "../components/ui/Button";
import { Copy, Shuffle, Trophy, Check, Users } from "lucide-react";

const POLL_INTERVAL_MS = 7000; // 5–10s confirmed range

function formatCountdown(endsAt) {
  const diff = new Date(endsAt).getTime() - Date.now();
  if (diff <= 0) return "00:00:00";
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  const s = Math.floor((diff % 60_000) / 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function BattleRoomDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();

  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timer, setTimer] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [starting, setStarting] = useState(false);
  const pollRef = useRef(null);

  const fetchRoom = useCallback(async () => {
    try {
      const data = await apiFetch(`/api/battle-rooms/${id}`);
      setRoom(data);
    } catch (err) {
      toast.error(err.message || "Failed to load Battle Room.");
      navigate("/club/battle-rooms");
    }
    setLoading(false);
  }, [id, navigate]);

  // Standard "fetch on mount" pattern used throughout this codebase's
  // data-fetching hooks/pages: the called function is a useCallback-wrapped
  // async fetcher whose setState calls all happen after its own await, not
  // synchronously in this effect's body. react-hooks/set-state-in-effect
  // still flags the call site here because it can't see across the
  // function boundary. A real fix would mean adopting a data-fetching
  // library (React Query/SWR) or inlining every one of these fetchers —
  // out of scope for a lint-debt pass; suppressed and documented instead.
  // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount pattern: the called function is a useCallback-wrapped async fetcher that sets loading/data state after its own await, not synchronously; see src/hooks/useAdminSettings.js for the fullest write-up of this decision.
  useEffect(() => { fetchRoom(); }, [fetchRoom]);

  // Poll while the room is still in play — stop once it's ended, no point
  // hitting the API for a finished match's results screen.
  useEffect(() => {
    if (!room || room.status === "ended") return;
    pollRef.current = setInterval(fetchRoom, POLL_INTERVAL_MS);
    return () => clearInterval(pollRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- room is deliberately excluded: fetchRoom returns a NEW room object every poll, so depending on the whole `room` reference (as the rule suggests) would tear down and restart this interval on every single successful poll, defeating the point of scoping to just the status transition that actually matters here.
  }, [room?.status, fetchRoom]);

  useEffect(() => {
    if (!room || room.status !== "active") return;
    const t = setInterval(() => setTimer(formatCountdown(room.endsAt)), 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- same reasoning as the poll effect above: room's object identity changes every fetch even when status/endsAt don't, so depending on the whole reference would restart this timer far more often than needed.
  }, [room?.status, room?.endsAt]);

  async function assignTeam(userId, teamIndex) {
    setAssigning(true);
    try {
      const data = await apiFetch(`/api/battle-rooms/${id}/assign-teams`, {
        method: "POST",
        body: JSON.stringify({ mode: "manual", assignments: [{ userId, teamIndex }] }),
      });
      setRoom(data);
    } catch (err) {
      toast.error(err.message || "Failed to assign team.");
    }
    setAssigning(false);
  }

  async function randomize() {
    setAssigning(true);
    try {
      const data = await apiFetch(`/api/battle-rooms/${id}/assign-teams`, {
        method: "POST",
        body: JSON.stringify({ mode: "random" }),
      });
      setRoom(data);
      toast.success("Teams randomized");
    } catch (err) {
      toast.error(err.message || "Failed to randomize teams.");
    }
    setAssigning(false);
  }

  async function startMatch() {
    setStarting(true);
    try {
      const data = await apiFetch(`/api/battle-rooms/${id}/start`, { method: "POST" });
      setRoom(data);
      toast.success("Match started!");
    } catch (err) {
      toast.error(err.message || "Failed to start match.");
    }
    setStarting(false);
  }

  if (loading || !room) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-32">
          <div
            className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: theme.colors.primary, borderTopColor: "transparent" }}
          />
        </div>
      </DashboardLayout>
    );
  }

  const { title, status, teams, roster, problemSlugs, isHost, myTeamIndex, mySolvedSlugs, isJoined, inviteCode } = room;
  const unassigned = roster.filter((r) => r.teamIndex == null);
  const teamRoster = [0, 1].map((idx) => roster.filter((r) => r.teamIndex === idx));
  const winner = status === "ended" ? (teams[0].score === teams[1].score ? null : teams[0].score > teams[1].score ? 0 : 1) : null;

  return (
    <DashboardLayout>
      <div className="max-w-4xl">
        <ClubSubNav />

        <div className="mb-6">
          <h1 className="text-2xl font-black text-white">{title}</h1>
          <p className="text-zinc-500 text-sm mt-1 capitalize">
            {status === "lobby" ? "Waiting to start" : status === "active" ? "Match in progress" : "Match ended"}
          </p>
        </div>

        {/* ══════════════════════ LOBBY ══════════════════════ */}
        {status === "lobby" && (
          <div className="space-y-6">
            {isHost && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex items-center justify-between flex-wrap gap-3">
                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Invite Code</p>
                  <p className="text-2xl font-mono font-black tracking-widest">{inviteCode}</p>
                </div>
                <button
                  onClick={() => { navigator.clipboard.writeText(inviteCode); toast.success("Code copied"); }}
                  className="p-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition"
                >
                  <Copy size={16} aria-hidden="true" />
                </button>
              </div>
            )}

            {!isJoined && (
              <p className="text-center text-zinc-500 text-sm py-2">
                You're viewing this room but haven't joined it yet.
              </p>
            )}

            {/* Unassigned roster — host sees assign buttons */}
            {unassigned.length > 0 && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                <p className="text-sm font-semibold text-zinc-300 mb-3">
                  Waiting for a team ({unassigned.length})
                </p>
                <div className="space-y-2">
                  {unassigned.map((m) => (
                    <div key={m.userId} className="flex items-center justify-between gap-3 bg-zinc-800 rounded-xl px-3 py-2">
                      <span className="text-sm truncate">{m.displayName}</span>
                      {isHost && (
                        <div className="flex gap-1.5 flex-shrink-0">
                          <button
                            disabled={assigning}
                            onClick={() => assignTeam(m.userId, 0)}
                            className="text-xs px-2.5 py-1 rounded-lg bg-zinc-700 hover:bg-zinc-600 transition disabled:opacity-50"
                          >
                            → {teams[0].name}
                          </button>
                          <button
                            disabled={assigning}
                            onClick={() => assignTeam(m.userId, 1)}
                            className="text-xs px-2.5 py-1 rounded-lg bg-zinc-700 hover:bg-zinc-600 transition disabled:opacity-50"
                          >
                            → {teams[1].name}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {isHost && (
                  <button
                    onClick={randomize}
                    disabled={assigning}
                    className="mt-3 text-xs flex items-center gap-1.5 text-zinc-400 hover:text-white transition disabled:opacity-50"
                  >
                    <Shuffle size={12} aria-hidden="true" /> Randomize everyone
                  </button>
                )}
              </div>
            )}

            {/* Two team columns */}
            <div className="grid sm:grid-cols-2 gap-4">
              {[0, 1].map((idx) => (
                <div key={idx} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                  <p className="font-bold mb-3">{teams[idx].name} <span className="text-zinc-500 font-normal text-sm">({teamRoster[idx].length})</span></p>
                  <div className="space-y-1.5">
                    {teamRoster[idx].length === 0 ? (
                      <p className="text-zinc-600 text-sm">No one yet</p>
                    ) : teamRoster[idx].map((m) => (
                      <div key={m.userId} className="flex items-center justify-between text-sm bg-zinc-800/60 rounded-lg px-3 py-1.5">
                        <span className="truncate">{m.displayName}</span>
                        {isHost && (
                          <button
                            onClick={() => assignTeam(m.userId, null)}
                            className="text-zinc-500 hover:text-red-400 text-xs flex-shrink-0"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {isHost && (
              <Button
                onClick={startMatch}
                disabled={starting || teamRoster[0].length === 0 || teamRoster[1].length === 0}
                loading={starting}
                variant="theme"
                className="w-full"
              >
                {starting ? "Starting…" : "Start Match"}
              </Button>
            )}
          </div>
        )}

        {/* ══════════════════════ ACTIVE ══════════════════════ */}
        {status === "active" && (
          <div className="space-y-6">
            <div className="flex items-center justify-center">
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-3 text-center">
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Time Remaining</p>
                <p className="text-2xl font-mono font-bold text-orange-400">{timer || formatCountdown(room.endsAt)}</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {[0, 1].map((idx) => (
                <div
                  key={idx}
                  className="rounded-2xl p-5 border"
                  style={
                    myTeamIndex === idx
                      ? { backgroundColor: withAlpha(theme.colors.primary, "0d"), borderColor: withAlpha(theme.colors.primary, "33") }
                      : { backgroundColor: "#18181b", borderColor: "#27272a" }
                  }
                >
                  <div className="flex items-center justify-between">
                    <p className="font-bold">{teams[idx].name}</p>
                    {myTeamIndex === idx && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: withAlpha(theme.colors.primary, "1f"), color: theme.colors.primary }}>
                        Your Team
                      </span>
                    )}
                  </div>
                  <p className="text-3xl font-black mt-2" style={{ color: theme.colors.primary }}>{teams[idx].score}</p>
                  <p className="text-xs text-zinc-500 mt-1">{teams[idx].solvedSlugs.length}/{problemSlugs.length} solved</p>
                </div>
              ))}
            </div>

            {isJoined && myTeamIndex != null && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                <p className="px-4 py-2.5 border-b border-zinc-800 text-xs font-semibold text-zinc-400 uppercase tracking-widest">
                  Problems
                </p>
                {problemSlugs.map((slug, i) => {
                  const solvedByTeam = teams[myTeamIndex].solvedSlugs.includes(slug);
                  const solvedByMe = mySolvedSlugs.includes(slug);
                  return (
                    <Link
                      key={slug}
                      to={`/problems/${slug}?battleRoom=${room._id}`}
                      className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800/50 hover:bg-zinc-800/40 transition last:border-0"
                    >
                      <span
                        className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={
                          solvedByTeam
                            ? { backgroundColor: theme.colors.primary, color: "#09090b" }
                            : { backgroundColor: "#27272a", color: "#71717a" }
                        }
                      >
                        {i + 1}
                      </span>
                      <span className="text-sm text-zinc-300 font-mono truncate flex-1">{slug}</span>
                      {solvedByMe && <Check size={14} className="text-green-400 flex-shrink-0" aria-hidden="true" />}
                      {solvedByTeam && !solvedByMe && (
                        <span className="text-[10px] text-zinc-500 flex-shrink-0">teammate solved</span>
                      )}
                    </Link>
                  );
                })}
              </div>
            )}
            {(!isJoined || myTeamIndex == null) && (
              <p className="text-center text-zinc-500 text-sm py-4">
                You're not on a team in this match — spectating only.
              </p>
            )}
          </div>
        )}

        {/* ══════════════════════ ENDED ══════════════════════ */}
        {status === "ended" && (
          <div className="space-y-6">
            <div className="text-center py-4">
              {winner === null ? (
                <>
                  <Users size={40} className="mx-auto mb-2 text-zinc-500" aria-hidden="true" />
                  <p className="text-xl font-bold">It's a tie!</p>
                </>
              ) : (
                <>
                  <Trophy size={40} className="mx-auto mb-2" style={{ color: theme.colors.primary }} aria-hidden="true" />
                  <p className="text-xl font-bold">{teams[winner].name} wins!</p>
                </>
              )}
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {[0, 1].map((idx) => (
                <div
                  key={idx}
                  className="rounded-2xl p-5 border"
                  style={
                    winner === idx
                      ? { backgroundColor: withAlpha(theme.colors.primary, "0d"), borderColor: withAlpha(theme.colors.primary, "33") }
                      : { backgroundColor: "#18181b", borderColor: "#27272a" }
                  }
                >
                  <p className="font-bold mb-1">{teams[idx].name}</p>
                  <p className="text-3xl font-black" style={{ color: theme.colors.primary }}>{teams[idx].score}</p>
                  <p className="text-xs text-zinc-500 mb-3">{teams[idx].solvedSlugs.length}/{problemSlugs.length} problems solved</p>

                  <div className="space-y-1">
                    {teamRoster[idx].map((m) => (
                      <div key={m.userId} className="flex items-center justify-between text-sm bg-zinc-800/60 rounded-lg px-3 py-1.5">
                        <span className="truncate">{m.displayName}</span>
                        <span className="text-zinc-500 text-xs flex-shrink-0">{m.solvedSlugs.length} solved</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}