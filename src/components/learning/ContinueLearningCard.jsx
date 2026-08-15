import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../../services/api";
import { getLastVisitedProblem } from "../../utils/recentProblem";
import { useAppContext } from "../../hooks/useAppContext";
import { CheckCircle2, Hexagon } from "lucide-react";

// This card only ever needs one problem's title/topic/slug — it used to
// statically import the full ~7k-line problem catalog (src/data/problems.js)
// just to .find() a single slug out of it, which meant every page rendering
// this card shipped all 250 problems in the main bundle for one lookup.
// GET /api/problems/:slug already exists and returns exactly this shape
// (audit finding, Aug 2026 — see problems-bundle-bloat note).
function ContinueLearningCard() {
  const { solvedProblems } = useAppContext();

  const lastSlug = getLastVisitedProblem();
  const [lastProblem, setLastProblem] = useState(null);

  useEffect(() => {
    if (!lastSlug) return;

    let cancelled = false;

    apiFetch(`/api/problems/${lastSlug}`)
      .then((problem) => {
        if (!cancelled) setLastProblem(problem);
      })
      .catch((err) => {
        // Non-breaking: card just falls back to the "no problem in
        // progress" state below rather than surfacing an error — this is
        // a nice-to-have dashboard card, not a critical data path.
        console.warn("[ContinueLearningCard] Failed to load last problem:", err.message);
        if (!cancelled) setLastProblem(null);
      });

    return () => { cancelled = true; };
  }, [lastSlug]);

  // Gated on lastSlug too, not just lastProblem — if lastSlug goes away
  // (e.g. cleared elsewhere) we don't want to keep showing a lastProblem
  // value fetched for a slug that's no longer current. This also means
  // the effect above never needs to synchronously null lastProblem out
  // for the "no slug" case (which is what react-hooks/set-state-in-effect
  // was flagging) — the render just ignores stale state instead.
  const activeProblem = lastSlug ? lastProblem : null;
  const alreadySolved = activeProblem && solvedProblems.includes(activeProblem.slug);

  return (
    <div className="bg-ink-900 border border-ink-700 rounded-xl p-4">

      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Continue Learning
        </p>
        <Link
          to="/problems"
          className="text-xs text-verdict-accept hover:brightness-110 transition"
        >
          View all
        </Link>
      </div>

      {activeProblem ? (
        <Link
          to={`/problems/${activeProblem.slug}`}
          className="flex items-center gap-3 group"
        >
          <div className="w-9 h-9 rounded-lg bg-ink-800 flex items-center justify-center flex-shrink-0">
            {alreadySolved ? (
              <CheckCircle2 size={18} strokeWidth={2} className="text-verdict-accept" aria-hidden="true" />
            ) : (
              <Hexagon size={18} strokeWidth={2} className="text-zinc-500" aria-hidden="true" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-zinc-300 group-hover:text-white truncate transition-colors">
              {activeProblem.title}
            </p>
            <p className="text-xs text-zinc-500 mt-0.5">
              {alreadySolved ? "Already solved · revisit" : `Resume · ${activeProblem.topic}`}
            </p>
          </div>
        </Link>
      ) : (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-ink-800 flex items-center justify-center flex-shrink-0">
            <Hexagon size={18} strokeWidth={2} className="text-zinc-500" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-zinc-300 truncate">
              No problem in progress
            </p>
            <p className="text-xs text-zinc-500 mt-0.5">
              Start one from Browse
            </p>
          </div>
        </div>
      )}

    </div>
  );
}

export default ContinueLearningCard;