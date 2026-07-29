function DailyMissionCard({ submissions = [], currentStreak = 0 }) {
  // Real missions derived from data the app already has — no missions
  // backend exists (verified: no model, no route), so rather than build
  // one from scratch, these three track genuinely available signals:
  //   - solved / attempted today, from submission history (same "date"
  //     field — YYYY-MM-DD — the backend already stamps on every
  //     submission; see backend/controllers/submissionController.js)
  //   - current streak, the same value shown in the Navbar/profile
  // No XP reward numbers are shown since nothing in the backend actually
  // grants mission rewards — showing a fake "+50 XP" would repeat the
  // exact misleading-promise problem this card previously had.
  const today = new Date().toISOString().split("T")[0];
  const todaysSubmissions = submissions.filter((s) => s.date === today);
  const solvedToday = new Set(
    todaysSubmissions
      .filter((s) => s.status === "Accepted")
      .map((s) => s.problemSlug)
  ).size;
  const attemptsToday = todaysSubmissions.length;

  const SOLVE_TARGET = 2;
  const ATTEMPT_TARGET = 3;
  const STREAK_TARGET = 7;

  const missions = [
    {
      label: `Solve ${SOLVE_TARGET} Problems`,
      progress: solvedToday,
      total: SOLVE_TARGET,
      done: solvedToday >= SOLVE_TARGET,
    },
    {
      label: `Submit ${ATTEMPT_TARGET} Times`,
      progress: attemptsToday,
      total: ATTEMPT_TARGET,
      done: attemptsToday >= ATTEMPT_TARGET,
    },
    {
      label: `Reach a ${STREAK_TARGET} Day Streak`,
      progress: Math.min(currentStreak, STREAK_TARGET),
      total: STREAK_TARGET,
      done: currentStreak >= STREAK_TARGET,
    },
  ];

  const completedCount = missions.filter((m) => m.done).length;

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
              <span className="text-[10px] text-zinc-500 font-medium tabular-nums">
                {Math.min(mission.progress, mission.total)}/{mission.total}
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
        <p className="text-xs text-zinc-500">Today's Progress</p>
        <p className="text-sm font-bold text-verdict-accept">
          {completedCount}/{missions.length} complete
        </p>
      </div>

    </div>
  );
}

export default DailyMissionCard;