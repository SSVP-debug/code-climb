import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "../../../services/api";
import { useTheme } from "../../../context/ThemeContext";
import SectionCard from "../../ui/layout/SectionCard";
import EmptyState from "../../ui/feedback/EmptyState";

// How long (ms) the Refresh button is disabled after a successful fetch
const REFRESH_COOLDOWN = 2 * 60 * 1000; // 2 minutes

function InsightCard({ label, value, accent = false }) {
  return (
    <div className={`rounded-xl p-4 ${accent ? "bg-zinc-700/60" : "bg-zinc-800"}`}>
      <p className="text-zinc-400 text-xs uppercase tracking-wider mb-2">{label}</p>
      <p className="text-sm leading-relaxed text-zinc-100">{value}</p>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-zinc-800 rounded-xl p-4 animate-pulse">
      <div className="h-3 w-24 bg-zinc-700 rounded mb-3" />
      <div className="h-4 w-full bg-zinc-700 rounded mb-2" />
      <div className="h-4 w-3/4 bg-zinc-700 rounded" />
    </div>
  );
}

function AIInsightsSection() {
  const { theme } = useTheme();

  const [status, setStatus] = useState("idle"); // idle | loading | success | empty | error
  const [insights, setInsights] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [cooldownUntil, setCooldownUntil] = useState(0);

  const canRefresh = Date.now() >= cooldownUntil;

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
    fetchInsights();
  }, [fetchInsights]);

  const secondsLeft = Math.max(
    0,
    Math.ceil((cooldownUntil - Date.now()) / 1000)
  );

  return (
    <SectionCard
      title={theme.words.aiInsights}
      action={
        (status === "success" || status === "error") && (
          <button
            onClick={fetchInsights}
            disabled={!canRefresh || status === "loading"}
            className="text-xs text-zinc-400 hover:text-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
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
          message="Solve a few problems first — your personalised insights will appear here."
          compact
        />
      )}

      {/* Error state */}
      {status === "error" && (
        <div className="bg-zinc-800 border border-red-900/40 rounded-xl p-4">
          <p className="text-red-400 text-sm mb-3">{errorMsg}</p>
          <button
            onClick={fetchInsights}
            className="text-xs bg-zinc-700 hover:bg-zinc-600 text-zinc-200 px-3 py-1.5 rounded-lg transition-colors"
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
        <p className="text-zinc-600 text-xs mt-4 text-right">
          Powered by Claude
        </p>
      )}
    </SectionCard>
  );
}

export default AIInsightsSection;
