function DailyGoal({ dailySolved }) {

  return (
    <div className="mt-10 bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)]">

      <div className="flex items-center justify-between mb-4">

        <h2 className="text-2xl font-semibold">
          Daily Goal
        </h2>

        <p className="text-[var(--theme-primary,#2dd4bf)] font-semibold">
          {dailySolved} / 5 Completed
        </p>

      </div>

      <div className="w-full bg-[var(--surface-elevated)] rounded-full h-4 overflow-hidden">

        <div
          className="bg-[var(--theme-primary,#2dd4bf)] h-full transition-all"
          style={{
            width: `${Math.min(
              (dailySolved / 5) * 100,
              100
            )}%`,
          }}
        ></div>

      </div>

      <p className="text-[var(--muted-foreground)] mt-4">
        Complete 5 problems today to maintain momentum.
      </p>

    </div>
  );
}

export default DailyGoal;