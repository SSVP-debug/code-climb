import { useAppContext } from "../../../hooks/useAppContext";
import SectionCard from "../../ui/layout/SectionCard";

function WeeklyGoalSection() {
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
      title="🎯 Weekly Goal"
      subtitle="Stay consistent this week."
    >
      <div className="space-y-5">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-zinc-400">
              {weeklySolved} / {weeklyGoal} Problems
            </span>

            <span className="text-green-400 font-medium">
              {progress.toFixed(0)}%
            </span>
          </div>

          <div className="w-full h-3 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all duration-700"
              style={{
                width: `${progress}%`,
              }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-zinc-400">
            {remaining === 0
              ? "🎉 Weekly goal completed!"
              : `${remaining} problem${
                  remaining > 1 ? "s" : ""
                } remaining`}
          </p>

          <button className="text-sm text-green-400 hover:text-green-300 transition-colors">
            Continue →
          </button>
        </div>
      </div>
    </SectionCard>
  );
}

export default WeeklyGoalSection;