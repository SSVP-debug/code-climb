import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../../../services/api";
import { useTheme } from "../../../hooks/useTheme";
import SectionCard from "../../ui/layout/SectionCard";
import { breakDownMs } from "../../../utils/countdown";
import { CalendarClock } from "lucide-react";

function formatCountdown(msRemaining) {
  if (msRemaining <= 0) return null;
  const { days, hours, minutes } = breakDownMs(msRemaining);
  return { days, hours, minutes };
}

function ContestCountdownCard() {
  const { theme } = useTheme();
  const [status, setStatus] = useState("loading"); // loading | success | empty | error
  const [contest, setContest] = useState(null);
  const [now, setNow] = useState(() => Date.now());

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
    // Standard "fetch on mount" pattern used throughout this codebase's
    // data-fetching hooks/pages: the called function is a useCallback-wrapped
    // async fetcher whose setState calls all happen after its own await, not
    // synchronously in this effect's body. react-hooks/set-state-in-effect
    // still flags the call site here because it can't see across the
    // function boundary. A real fix would mean adopting a data-fetching
    // library (React Query/SWR) or inlining every one of these fetchers —
    // out of scope for a lint-debt pass; suppressed and documented instead.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount pattern: the called function is a useCallback-wrapped async fetcher that sets loading/data state after its own await, not synchronously; see src/hooks/useAdminSettings.js for the fullest write-up of this decision.
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
      icon={<CalendarClock size={18} strokeWidth={2} />}
      accented
      action={
        <Link
          to="/club"
          className="text-xs hover:brightness-110 transition"
          style={{ color: theme.colors.primary }}
        >
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
          <Link
            to="/club"
            className="text-sm mt-1 inline-block hover:brightness-110 transition"
            style={{ color: theme.colors.primary }}
          >
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
            <p className="text-sm mt-2 font-medium" style={{ color: theme.colors.primary }}>
              Starting soon — join now!
            </p>
          )}
        </>
      )}
    </SectionCard>
  );
}

export default ContestCountdownCard;