import { Compass } from "lucide-react";
import Button from "../ui/Button";
import { useTheme } from "../../hooks/useTheme";

/**
 * TodaysFocus — step 5 (final) of the first-session onboarding flow
 * (docs/002-first-session-onboarding-flow.md). Currently unused/orphaned —
 * the flow's orchestrator + gate were removed when the Daily Quiz Gate
 * spec replaced the old quiz step with DailyQuizGuard.jsx; kept as a
 * standalone component in case it's reused elsewhere. A fun, presentation-only
 * reveal of one topic for today. Per the spec's own future-extension note,
 * "subtly highlighting" this topic elsewhere in the UI (e.g. ProblemsPage
 * filters) is a deliberate scope cut for a future plan — this component
 * only renders the topic name.
 */
export default function TodaysFocus({ topic, onContinue }) {
  const { theme } = useTheme();
  const primary = theme?.colors?.primary ?? "#2dd4bf";

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6">
      <div className="max-w-xl text-center animate-[fadeIn_.4s_ease-out]">
        <div
          className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-8 animate-[fadeIn_.4s_ease-out]"
          style={{ backgroundColor: `${primary}1f`, color: primary }}
        >
          <Compass size={30} strokeWidth={2} aria-hidden="true" />
        </div>

        <p className="text-sm font-semibold uppercase tracking-wide mb-3 text-zinc-500">
          Today's Focus
        </p>

        <h1 className="text-4xl font-bold mb-4" style={{ color: primary }}>
          {topic}
        </h1>

        <p className="text-zinc-400 text-lg mb-10">
          Keep an eye out for it as you practice today.
        </p>

        <Button
          variant="primary"
          size="lg"
          onClick={onContinue}
          className="focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
        >
          Start Coding
        </Button>
      </div>
    </div>
  );
}