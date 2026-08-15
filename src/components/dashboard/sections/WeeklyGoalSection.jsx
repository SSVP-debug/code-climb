import { Link } from "react-router-dom";
import { useAppContext } from "../../../hooks/useAppContext";
import { useTheme } from "../../../hooks/useTheme";
import SectionCard from "../../ui/layout/SectionCard";
import { Target, PartyPopper } from "lucide-react";

function WeeklyGoalSection() {
  const { theme } = useTheme();
  const { weeklySolved, weeklyGoal } = useAppContext();

  const progress = Math.min(
    (weeklySolved / weeklyGoal) * 100,
    100
  );

  const remaining = Math.max(
    weeklyGoal - weeklySolved,
    0
  );

  return (
    <SectionCard
      title="Weekly Goal"
      subtitle="Stay consistent this week."
      icon={<Target size={18} strokeWidth={2} />}
      accented
    >
      <div className="space-y-5">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-zinc-400">
              {weeklySolved} / {weeklyGoal} Problems
            </span>

            <span
              className="font-medium"
              style={{ color: theme.colors.primary }}
            >
              {progress.toFixed(0)}%
            </span>
          </div>

          <div className="w-full h-3 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${progress}%`,
                backgroundColor: theme.colors.primary,
              }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-zinc-400 flex items-center gap-1.5">
            {remaining === 0 ? (
              <>
                <PartyPopper size={14} aria-hidden="true" />
                Weekly goal completed!
              </>
            ) : (
              `${remaining} problem${
                remaining > 1 ? "s" : ""
              } remaining`
            )}
          </p>

          <Link
            to="/problems"
            className="text-sm transition-colors hover:brightness-110"
            style={{ color: theme.colors.primary }}
          >
            Continue →
          </Link>
        </div>
      </div>
    </SectionCard>
  );
}

export default WeeklyGoalSection;