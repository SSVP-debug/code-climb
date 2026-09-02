import { useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../../services/api";

/**
 * AIHintPanel
 *
 * The Claude-powered AI hint flow (POST /api/hints/:slug). This is separate
 * from HintSystem, which only shows static, pre-written hints for problems
 * that have them — AIHintPanel works for every problem, on demand.
 *
 * Levels are progressive, same UX shape as HintSystem: level 1 is a nudge,
 * level 2 names the approach, level 3 is a step-by-step walkthrough.
 * Free tier is capped at 3 hints/day server-side (backend/routes/hints.js);
 * a 402 response means the daily limit was hit, surfaced here with a link
 * to /pricing rather than a raw error.
 */
function AIHintPanel({ slug }) {
  const [hintLevel, setHintLevel] = useState(0); // 0 = none requested yet
  const [hintText, setHintText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [upgradeUrl, setUpgradeUrl] = useState(null);

  async function requestHint(level) {
    if (loading) return;
    setLoading(true);
    setError("");
    setUpgradeUrl(null);

    try {
      const data = await apiFetch(`/api/hints/${slug}`, {
        method: "POST",
        body: JSON.stringify({ level }),
      });

      if (data?.hint) {
        setHintText(data.hint);
        setHintLevel(level);
      } else {
        setError("No hint was returned. Try again.");
      }
    } catch (err) {
      // apiFetch throws with the backend's `error` message, e.g. the
      // "Free plan includes 3 hints/day" 402 case — surface it directly.
      setError(err.message || "Could not load hint. Try again.");
      if (err.message?.toLowerCase().includes("upgrade")) {
        setUpgradeUrl("/pricing");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <h3 className="text-lg font-semibold text-[var(--foreground)]">AI Hint</h3>
        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--theme-primary,#2dd4bf)] bg-[var(--theme-primary,#2dd4bf)]/10 border border-[var(--theme-primary,#2dd4bf)]/20 px-1.5 py-0.5 rounded">
          Claude
        </span>
      </div>

      {/* Level picker */}
      <div className="flex gap-2 mb-3">
        {[1, 2, 3].map((level) => (
          <button
            key={level}
            onClick={() => requestHint(level)}
            disabled={loading}
            className={`flex-1 text-sm px-3 py-2 rounded-xl border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              hintLevel === level
                ? "border-[var(--theme-primary,#2dd4bf)]/40 bg-[var(--theme-primary,#2dd4bf)]/10 text-[var(--theme-primary,#2dd4bf)]"
                : "border-[var(--border-strong)] text-[var(--muted-foreground)] hover:border-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }`}
          >
            {level === 1 && "Nudge"}
            {level === 2 && "Approach"}
            {level === 3 && "Walkthrough"}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] px-1 py-2">
          <div className="w-3.5 h-3.5 border-2 border-[var(--border-strong)] border-t-transparent rounded-full animate-spin" />
          Thinking…
        </div>
      )}

      {/* Hint result */}
      {!loading && hintText && !error && (
        <div className="flex gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)]/60 px-4 py-3">
          <span className="shrink-0 mt-0.5 w-5 h-5 rounded-full bg-[var(--theme-primary,#2dd4bf)]/10 border border-[var(--theme-primary,#2dd4bf)]/20 flex items-center justify-center text-[10px] font-bold text-[var(--theme-primary,#2dd4bf)]">
            {hintLevel}
          </span>
          <p className="text-sm text-[var(--muted-foreground)] leading-relaxed whitespace-pre-wrap">
            {hintText}
          </p>
        </div>
      )}

      {/* Error / upsell */}
      {!loading && error && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
          <p className="text-sm text-amber-400">{error}</p>
          {upgradeUrl && (
            <Link
              to={upgradeUrl}
              className="inline-block mt-2 text-xs font-semibold text-[var(--theme-primary,#2dd4bf)] hover:brightness-110"
            >
              View Pro plans →
            </Link>
          )}
        </div>
      )}
    </section>
  );
}

export default AIHintPanel;