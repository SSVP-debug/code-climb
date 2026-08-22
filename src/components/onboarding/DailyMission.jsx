import { Target, Flame, Timer } from "lucide-react";
import Button from "../ui/Button";
import { useTheme } from "../../hooks/useTheme";
import { useAppContext } from "../../hooks/useAppContext";

/**
 * DailyMission — step 4 of the first-session onboarding flow
 * (docs/002-first-session-onboarding-flow.md). Currently unused/orphaned —
 * the flow's orchestrator + gate were removed when the Daily Quiz Gate
 * spec replaced the old quiz step with DailyQuizGuard.jsx; kept as a
 * standalone component in case it's reused elsewhere. Three small, achievable
 * goals meant to give purpose before entering the platform. The streak
 * goal's copy depends on whether the user already has one going — asking
 * someone with no streak yet to "maintain" one that doesn't exist would
 * read as broken, so we swap to "Start your streak" when `currentStreak`
 * is 0.
 *
 * The other two goals are static, illustrative copy per the spec — "Beat
 * yesterday's runtime" is not backed by a real runtime lookup; doing that
 * would need a new backend query against submissionService.js and is out
 * of scope for this plan.
 */
export default function DailyMission({ onContinue }) {
  const { theme } = useTheme();
  const primary = theme?.colors?.primary ?? "#2dd4bf";
  const { currentStreak } = useAppContext();

  const goals = [
    {
      icon: Target,
      label: "Solve 2 problems",
    },
    {
      icon: Flame,
      label: currentStreak > 0 ? "Maintain your streak" : "Start your streak",
    },
    {
      icon: Timer,
      label: "Beat yesterday's runtime",
    },
  ];

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6">
      <div className="max-w-xl w-full text-center animate-[fadeIn_.4s_ease-out]">
        <p className="text-sm font-semibold uppercase tracking-wide mb-2" style={{ color: primary }}>
          Today's Mission
        </p>
        <h1 className="text-3xl font-bold mb-10 text-white">
          Three small goals for today
        </h1>

        <div className="space-y-3 mb-10 text-left">
          {goals.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-4 px-5 py-4 rounded-xl border border-zinc-800 bg-zinc-900/50"
            >
              <span
                className="flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0"
                style={{ backgroundColor: `${primary}1f`, color: primary }}
              >
                <Icon size={18} strokeWidth={2} aria-hidden="true" />
              </span>
              <span className="text-white font-medium">{label}</span>
            </div>
          ))}
        </div>

        <Button
          variant="primary"
          size="lg"
          onClick={onContinue}
          className="focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
        >
          See Today's Focus
        </Button>
      </div>
    </div>
  );
}