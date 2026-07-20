function DailyMissionCard() {
  // Placeholder missions — replace with real API data.
  const missions = [
    { label: "Solve 2 Problems", progress: 0, total: 2, xp: 50, done: false },
    { label: "Reach 50 XP", progress: 0, total: 50, xp: 30, done: false },
    { label: "Maintain 7 Day Streak", progress: 0, total: 7, xp: 20, done: false },
  ];

  return (
    <div className="bg-ink-900 border border-ink-700 rounded-xl p-4">

      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Today's Mission
        </p>
        <p className="text-[10px] text-zinc-500">Resets in 24h</p>
      </div>

      <div className="flex flex-col gap-3">
        {missions.map((mission) => (
          <div key={mission.label}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <div
                  className={`w-3.5 h-3.5 rounded-full border flex-shrink-0 ${
                    mission.done
                      ? "bg-verdict-accept border-verdict-accept"
                      : "border-zinc-600"
                  }`}
                />
                <p className="text-xs text-zinc-300">{mission.label}</p>
              </div>
              <span className="text-[10px] text-zinc-500 font-medium">
                +{mission.xp} XP
              </span>
            </div>
            <div className="h-1 bg-ink-800 rounded-full overflow-hidden ml-5">
              <div
                className="h-full bg-verdict-accept rounded-full transition-all"
                style={{
                  width: `${
                    mission.total > 0
                      ? Math.min((mission.progress / mission.total) * 100, 100)
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-ink-700 flex items-center justify-between">
        <p className="text-xs text-zinc-500">Total Reward</p>
        <p className="text-sm font-bold text-verdict-accept">+100 XP</p>
      </div>

    </div>
  );
}

export default DailyMissionCard;