import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../../../services/api";
import SectionCard from "../../ui/layout/SectionCard";
import { breakDownMs } from "../../../utils/countdown";

function formatCountdown(msRemaining) {
  if (msRemaining <= 0) return null;
  const { days, hours, minutes } = breakDownMs(msRemaining);
  return { days, hours, minutes };
}

function ContestCountdownCard() {
  const [status, setStatus] = useState("loading"); // loading | success | empty | error
  const [contest, setContest] = useState(null);
  const [now, setNow] = useState(Date.now());

  const fetchNextContest = useCallback(async () => {
    setStatus("loading");
    try {
      const data = await apiFetch("/api/contests?status=upcoming&type=public");
      const next = data.contests?.[0] ?? null;
      setContest(next);
      setStatus(next ? "success" : "empty");
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    fetchNextContest();
  }, [fetchNextContest]);

  // Tick every minute — a contest countdown doesn't need second-level
  // precision, and this avoids 60x more re-renders than necessary.
  useEffect(() => {
    if (status !== "success") return;
    const interval = setInterval(() => setNow(Date.now()), 60 * 1000);
    return () => clearInterval(interval);
  }, [status]);

  const countdown =
    status === "success" && contest
      ? formatCountdown(new Date(contest.startsAt).getTime() - now)
      : null;

  return (
    <SectionCard
      title="Next Contest"
      action={
        <Link to="/club" className="text-xs text-green-400 hover:text-green-300">
          View Club →
        </Link>
      }
    >
      {status === "loading" && (
        <div className="animate-pulse space-y-2">
          <div className="h-4 w-2/3 bg-zinc-800 rounded" />
          <div className="h-6 w-1/2 bg-zinc-800 rounded" />
        </div>
      )}

      {status === "error" && (
        <p className="text-zinc-500 text-sm">Couldn't load contests right now.</p>
      )}

      {status === "empty" && (
        <div className="text-center py-2">
          <p className="text-zinc-400 text-sm">No contests scheduled right now.</p>
          <Link to="/club" className="text-green-400 hover:text-green-300 text-sm mt-1 inline-block">
            Check the Club →
          </Link>
        </div>
      )}

      {status === "success" && contest && (
        <>
          <p className="font-semibold truncate">{contest.title}</p>

          {countdown ? (
            <div className="flex items-baseline gap-2 mt-3 font-mono">
              <div className="text-center">
                <span className="text-2xl font-bold">{countdown.days}</span>
                <p className="text-[10px] text-zinc-500">days</p>
              </div>
              <span className="text-zinc-600">:</span>
              <div className="text-center">
                <span className="text-2xl font-bold">{countdown.hours}</span>
                <p className="text-[10px] text-zinc-500">hrs</p>
              </div>
              <span className="text-zinc-600">:</span>
              <div className="text-center">
                <span className="text-2xl font-bold">{countdown.minutes}</span>
                <p className="text-[10px] text-zinc-500">mins</p>
              </div>
            </div>
          ) : (
            <p className="text-green-400 text-sm mt-2">Starting soon — join now!</p>
          )}
        </>
      )}
    </SectionCard>
  );
}

export default ContestCountdownCard;