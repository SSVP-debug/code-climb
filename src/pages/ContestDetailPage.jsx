import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { apiFetch } from "../services/api";

function formatTime(endsAt) {
  const ms = new Date(endsAt) - Date.now();
  if (ms <= 0) return "00:00:00";
  const h = String(Math.floor(ms / 3600000)).padStart(2,"0");
  const m = String(Math.floor((ms % 3600000) / 60000)).padStart(2,"0");
  const s = String(Math.floor((ms % 60000) / 1000)).padStart(2,"0");
  return `${h}:${m}:${s}`;
}

export default function ContestDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contest, setContest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timer, setTimer]     = useState("");

  const fetch = useCallback(() => {
    apiFetch(`/api/contests/${id}`).then(d => {
      if (d.error) return navigate("/contests");
      setContest(d);
      setLoading(false);
    });
  }, [id]);

  useEffect(() => { fetch(); }, [fetch]);

  useEffect(() => {
    if (!contest || contest.status !== "active") return;
    const t = setInterval(() => setTimer(formatTime(contest.endsAt)), 1000);
    return () => clearInterval(t);
  }, [contest]);

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const { leaderboard = [], problemSlugs = [], myRank, myScore, isJoined } = contest;

  return (
    <div className="min-h-screen bg-black px-4 py-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link to="/contests" className="text-xs text-zinc-500 hover:text-zinc-300 mb-1 block">← Contests</Link>
            <h1 className="text-2xl font-black text-white">{contest.title}</h1>
            {contest.description && <p className="text-zinc-500 text-sm mt-1">{contest.description}</p>}
          </div>
          {contest.status === "active" && (
            <div className="text-right">
              <p className="text-xs text-zinc-500 mb-1">Time Remaining</p>
              <p className="text-2xl font-mono font-bold text-orange-400">{timer || formatTime(contest.endsAt)}</p>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Problems panel */}
          <div className="md:col-span-1">
            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest mb-3">Problems</h2>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
              {problemSlugs.map((slug, i) => {
                const solved = isJoined && (leaderboard.find(p => p.userId === contest.myId)?.solvedSlugs || []).includes(slug);
                return (
                  <Link key={slug} to={`/problems/${slug}`}
                    className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800/50 hover:bg-zinc-800/40 transition last:border-0">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      solved ? "bg-green-500 text-black" : "bg-zinc-800 text-zinc-500"
                    }`}>{i + 1}</span>
                    <span className="text-sm text-zinc-300 font-mono truncate">{slug}</span>
                    {solved && <span className="ml-auto text-green-400 text-xs">✓</span>}
                  </Link>
                );
              })}
            </div>

            {isJoined && (
              <div className="mt-4 bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-center">
                <p className="text-xs text-zinc-500 mb-1">Your Score</p>
                <p className="text-3xl font-black text-green-400">{myScore}</p>
                {myRank && <p className="text-zinc-500 text-sm mt-1">Rank #{myRank}</p>}
              </div>
            )}
          </div>

          {/* Leaderboard */}
          <div className="md:col-span-2">
            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest mb-3">
              Leaderboard · {leaderboard.length} participants
            </h2>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
              <div className="grid grid-cols-12 px-4 py-2 border-b border-zinc-800 text-[10px] text-zinc-600 uppercase tracking-widest">
                <span className="col-span-1">#</span>
                <span className="col-span-6">Participant</span>
                <span className="col-span-2 text-center">Solved</span>
                <span className="col-span-3 text-right">Score</span>
              </div>
              <div className="max-h-[500px] overflow-y-auto divide-y divide-zinc-800/40">
                {leaderboard.length === 0 ? (
                  <p className="text-center text-zinc-600 py-10 text-sm">No participants yet.</p>
                ) : leaderboard.map((p, i) => (
                  <div key={p.username}
                    className={`grid grid-cols-12 items-center px-4 py-3 ${p.rank === myRank ? "bg-green-500/5" : ""}`}>
                    <span className={`col-span-1 text-sm font-bold ${
                      i === 0 ? "text-yellow-400" : i === 1 ? "text-zinc-400" : i === 2 ? "text-orange-700" : "text-zinc-600"
                    }`}>
                      {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${p.rank}`}
                    </span>
                    <span className="col-span-6 text-sm text-white truncate">{p.displayName || p.username}</span>
                    <span className="col-span-2 text-center text-sm text-zinc-400">{p.solvedSlugs?.length ?? 0}</span>
                    <span className="col-span-3 text-right text-sm font-bold text-green-400">{p.score}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
