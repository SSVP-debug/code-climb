import SectionCard from "../ui/layout/SectionCard";
import { useAppContext } from "../../hooks/useAppContext";

function DailyMissionCard() {
  const {
    solvedProblems,
    totalXP,
  } = useAppContext();

  // -----------------------------
  // Temporary mission logic
  // (will move to backend later)
  // -----------------------------

  const solvedCount = solvedProblems.length;

  const missions = [
    {
      title: "Solve 2 Problems",
      completed: solvedCount >= 2,
    },
    {
      title: "Reach 50 XP",
      completed: totalXP >= 50,
    },
    {
      title: "Solve 5 Problems",
      completed: solvedCount >= 5,
    },
  ];

  const completed = missions.filter(
    (mission) => mission.completed
  ).length;

  const progress =
    (completed / missions.length) * 100;

  return (
    <SectionCard
      title="Today's Mission"
      subtitle="Small wins every day."
    >
      {/* Progress */}

      <div className="mb-4">

        <div className="flex items-center justify-between mb-2">

          <p className="text-sm text-zinc-400">
            Progress
          </p>

          <p className="text-sm font-medium">
            {completed}/{missions.length}
          </p>

        </div>

        <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">

          <div
            className="h-full bg-green-500 transition-all duration-500"
            style={{
              width: `${progress}%`,
            }}
          />

        </div>

      </div>

      {/* Mission List */}

      <div className="space-y-2">

        {missions.map((mission) => (
          <div
            key={mission.title}
            className="flex items-center gap-3"
          >
            <span className="text-lg">
              {mission.completed
                ? "✅"
                : "⬜"}
            </span>

            <p
              className={
                mission.completed
                  ? "text-zinc-300"
                  : "text-zinc-400"
              }
            >
              {mission.title}
            </p>
          </div>
        ))}

      </div>

      {/* Reward */}

      <div className="mt-4 pt-4 border-t border-zinc-800 flex items-center justify-between">

        <div>

          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Reward
          </p>

          <h3 className="font-semibold text-green-400 mt-1">
            +100 XP
          </h3>

        </div>

        {completed === missions.length && (
          <span className="text-green-400 font-semibold">
            Mission Complete 🎉
          </span>
        )}

      </div>

    </SectionCard>
  );
}

export default DailyMissionCard;