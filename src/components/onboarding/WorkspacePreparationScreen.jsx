import { useEffect, useState } from "react";
import { Check, Sparkles } from "lucide-react";
import { useTheme } from "../../hooks/useTheme";
import { useAppContext } from "../../hooks/useAppContext";

/**
 * WorkspacePreparationScreen — was the final step of the Welcome -> Quiz
 * -> Mission -> Focus -> Readiness onboarding flow (see
 * docs/002-first-session-onboarding-flow.md and the "refine first-session
 * experience" follow-up plan). That flow's orchestrator (formerly
 * OnboardingContainer.jsx) and its gate (formerly OnboardingGate.jsx) were
 * removed when the Daily Quiz Gate spec replaced the quiz step with a
 * stricter, server-backed, app-wide gate (see DailyQuizGuard.jsx) — this
 * component is currently unused/orphaned, kept in place as a standalone
 * piece in case the readiness-screen concept gets reused elsewhere. Not a
 * spinner: per the original plan's explicit copy guidance, this continues
 * the onboarding narrative ("Building today's coding session...") rather
 * than surfacing infra language ("Connecting...", "Loading server...").
 *
 * Auto-advances (calls onReady) once AppContext's isBackendReady flips
 * true — the user never has to click anything here. A MIN_DISPLAY_MS floor
 * exists so that on a warm backend (the common case once Render's cold
 * start isn't in play, or after the very first request of the day already
 * warmed it) this doesn't just flash for one frame; it always reads as an
 * intentional, if brief, part of the flow rather than a glitch.
 *
 * Per requirement: if the backend becomes ready WHILE an earlier step
 * (Welcome/Quiz/Mission/Focus) is still showing, nothing here fires early —
 * this component only mounts once the user reaches this step naturally.
 */

const MIN_DISPLAY_MS = 1200;

const CHECKLIST_ITEMS = [
  "Profile loaded",
  "Achievements synced",
  "Preparing today's challenges",
  "Loading your progress",
];

export default function WorkspacePreparationScreen({ onReady }) {
  const { theme } = useTheme();
  const { isBackendReady } = useAppContext();
  const primary = theme?.colors?.primary ?? "#2dd4bf";

  const [visibleCount, setVisibleCount] = useState(0);
  const [minDisplayElapsed, setMinDisplayElapsed] = useState(false);

  // Stagger the checklist items in for a premium, intentional feel instead
  // of dumping all four at once. Purely cosmetic — not tied to real
  // per-item network calls (there's only the one /api/init request behind
  // all of this), same spirit as the rest of this flow's presentational
  // steps (see DailyMission's comment on illustrative-only copy).
  useEffect(() => {
    if (visibleCount >= CHECKLIST_ITEMS.length) return;
    const timer = setTimeout(() => setVisibleCount((c) => c + 1), 280);
    return () => clearTimeout(timer);
  }, [visibleCount]);

  useEffect(() => {
    const timer = setTimeout(() => setMinDisplayElapsed(true), MIN_DISPLAY_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isBackendReady && minDisplayElapsed) {
      onReady();
    }
  }, [isBackendReady, minDisplayElapsed, onReady]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6">
      <div className="max-w-xl w-full text-center animate-[fadeIn_.4s_ease-out]">
        <div
          className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-8"
          style={{ backgroundColor: `${primary}1f`, color: primary }}
        >
          <Sparkles size={30} strokeWidth={2} aria-hidden="true" />
        </div>

        <h1 className="text-3xl font-bold mb-3 text-white">
          Building today's coding session...
        </h1>
        <p className="text-zinc-400 text-lg mb-10">
          Just a moment while everything's set up for you.
        </p>

        <ul className="space-y-3 text-left max-w-xs mx-auto" aria-live="polite">
          {CHECKLIST_ITEMS.map((item, i) => (
            <li
              key={item}
              className={`flex items-center gap-3 transition-opacity duration-300 ${
                i < visibleCount ? "opacity-100" : "opacity-0"
              }`}
            >
              <span
                className="flex items-center justify-center w-5 h-5 rounded-full shrink-0"
                style={{ backgroundColor: `${primary}1f`, color: primary }}
              >
                <Check size={13} strokeWidth={3} aria-hidden="true" />
              </span>
              <span className="text-zinc-300">{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}