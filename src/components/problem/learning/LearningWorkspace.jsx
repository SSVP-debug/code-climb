import ContinueLearningCard from "./ContinueLearningCard";
import DailyMissionCard from "./DailyMissionCard";
import LearningProgressCard from "./LearningProgressCard";

function LearningWorkspace({ problems = [], solvedCount = 0, progress = 0 }) {
  return (
    <div className="p-4 flex flex-col gap-4">

      {/* Panel header */}
      <div className="flex items-center gap-2 pt-1">
        <h2 className="text-sm font-bold text-white">Where am I</h2>
        <span className="text-[9px] font-bold bg-green-500 text-black px-1.5 py-0.5 rounded-full uppercase tracking-wide">
          NEW
        </span>
      </div>
      <p className="text-zinc-500 text-xs -mt-3">
        Your learning hub. Track, reflect and improve.
      </p>

      {/* Stats row — 3 cards with clear borders */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Solved",   value: solvedCount,        color: "text-white"      },
          { label: "Progress", value: `${progress}%`,     color: "text-green-400"  },
          { label: "Vaults",   value: problems.length,    color: "text-white"      },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            className="bg-zinc-900 border border-zinc-700 rounded-xl p-3 text-center"
          >
            <p className={`text-lg font-bold leading-none tabular-nums ${color}`}>
              {value}
            </p>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wide mt-1">
              {label}
            </p>
          </div>
        ))}
      </div>

      {/* Cards */}
      <ContinueLearningCard />
      <DailyMissionCard />
      <LearningProgressCard
        solvedCount={solvedCount}
        total={problems.length}
        progress={progress}
      />

    </div>
  );
}

export default LearningWorkspace;
