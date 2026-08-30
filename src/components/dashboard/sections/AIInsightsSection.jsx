import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "../../../services/api";
import { useTheme } from "../../../hooks/useTheme";
import SectionCard from "../../ui/layout/SectionCard";
import EmptyState from "../../ui/feedback/EmptyState";
import { Sparkles, Brain } from "lucide-react";

// How long (ms) the Refresh button is disabled after a successful fetch
const REFRESH_COOLDOWN = 2 * 60 * 1000; // 2 minutes

function InsightCard({ label, value, accent = false }) {
  const { theme } = useTheme();
  return (
    <div
      className="rounded-xl p-4 bg-[var(--surface-elevated)]"
      style={accent ? { backgroundColor: `${theme.colors.primary}14` } : undefined}
    >
      <p className="text-[var(--muted-foreground)] text-xs uppercase tracking-wider mb-2">{label}</p>
      <p className="text-sm leading-relaxed text-[var(--foreground)]">{value}</p>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-[var(--surface-elevated)] rounded-xl p-4 animate-pulse">
      <div className="h-3 w-24 bg-[var(--border-strong)] rounded mb-3" />
      <div className="h-4 w-full bg-[var(--border-strong)] rounded mb-2" />
      <div className="h-4 w-3/4 bg-[var(--border-strong)] rounded" />
    </div>
  );
}

function AIInsightsSection() {
  const { theme } = useTheme();

  const [status, setStatus] = useState("idle"); // idle | loading | success | empty | error
  const [insights, setInsights] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [cooldownUntil, setCooldownUntil] = useState(0);
  // Ticks once a second while a cooldown is active, so canRefresh/
  // secondsLeft below stay accurate — previously these called Date.now()
  // directly during render (flagged as an impure render call), which also
  // meant they were frozen at whatever they were during this component's
  // last render for some unrelated reason; nothing ever forced a
  // re-render as the cooldown counted down, so the refresh button could
  // stay stuck disabled well past the real 2-minute cooldown.
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (cooldownUntil <= Date.now()) return;
    const interval = setInterval(() => {
      const nowMs = Date.now();
      setNow(nowMs);
      if (nowMs >= cooldownUntil) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldownUntil]);

  const canRefresh = now >= cooldownUntil;

  const fetchInsights = useCallback(async () => {
    setStatus("loading");
    setErrorMsg("");

    try {
      const data = await apiFetch("/api/insights");

      if (data.insights === null) {
        setStatus("empty");
      } else {
        setInsights(data.insights);
        setStatus("success");
        setCooldownUntil(Date.now() + REFRESH_COOLDOWN);
      }
    } catch (err) {
      setErrorMsg(err.message || "Something went wrong. Try again.");
      setStatus("error");
    }
  }, []);

  // Auto-fetch on mount
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
    fetchInsights();
  }, [fetchInsights]);

  const secondsLeft = Math.max(
    0,
    Math.ceil((cooldownUntil - now) / 1000)
  );

  return (
    <SectionCard
      title={theme.words.aiInsights}
      icon={<Sparkles size={18} strokeWidth={2} />}
      accented
      action={
        (status === "success" || status === "error") && (
          <button
            onClick={fetchInsights}
            disabled={!canRefresh || status === "loading"}
            className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-primary,#2dd4bf)] rounded"
            title={!canRefresh ? `Available in ${secondsLeft}s` : "Refresh insights"}
          >
            <svg
              className={`w-3.5 h-3.5 ${status === "loading" ? "animate-spin" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            {!canRefresh && status === "success"
              ? `${secondsLeft}s`
              : "Refresh"}
          </button>
        )
      }
    >

      {/* Loading */}
      {status === "loading" && (
        <div className="space-y-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      )}

      {/* Empty state — not enough data yet */}
      {status === "empty" && (
        <EmptyState
          icon={<Brain size={28} strokeWidth={1.75} />}
          title="Not enough data yet"
          description="Solve a few problems first — your personalised insights will appear here."
          compact
        />
      )}

      {/* Error state */}
      {status === "error" && (
        <div className="bg-[var(--surface-elevated)] border border-red-900/40 rounded-xl p-4">
          <p className="text-red-400 text-sm mb-3">{errorMsg}</p>
          <button
            onClick={fetchInsights}
            className="text-xs bg-[var(--border-strong)] hover:opacity-80 text-[var(--foreground)] px-3 py-1.5 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-primary,#2dd4bf)]"
          >
            Try again
          </button>
        </div>
      )}

      {/* Success */}
      {status === "success" && insights && (
        <div className="space-y-3">
          <InsightCard
            label={theme.words.strongestTopic}
            value={insights.strongestArea}
            accent
          />
          <InsightCard
            label={theme.words.weakestTopic}
            value={insights.weakestArea}
          />
          <InsightCard
            label={theme.words.recommendation}
            value={insights.nextStep}
          />
          <InsightCard
            label={theme.words.coachNote}
            value={insights.encouragement}
          />
        </div>
      )}

      {/* AI attribution */}
      {status === "success" && (
        <p className="text-[var(--muted-foreground)] text-xs mt-4 text-right">
          Powered by Claude
        </p>
      )}
    </SectionCard>
  );
}

export default AIInsightsSection;