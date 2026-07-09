function ActivityHeatmap({
  activityDates = [],
}) {
  const days = [];

  for (let i = 89; i >= 0; i--) {
    const date = new Date();

    date.setDate(
      date.getDate() - i
    );

    const dateString =
      date
        .toISOString()
        .split("T")[0];

    days.push({
      date: dateString,

      active:
        activityDates.includes(
          dateString
        ),
    });
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">
          Activity Heatmap
        </h2>

        <span className="text-xs text-zinc-500">
          Last 90 days
        </span>
      </div>

      <div className="flex flex-wrap gap-1">

        {days.map((day) => (
          <div
            key={day.date}
            title={day.date}
            className={`w-4 h-4 rounded transition-colors ${day.active
              ? "bg-green-500"
              : "bg-zinc-800"
              }`}
          />
        ))}

      </div>
      <div className="flex items-center justify-end gap-2 mt-5 text-xs text-zinc-500">
        <span>Less</span>

        <div className="w-3 h-3 rounded bg-zinc-800" />
        <div className="w-3 h-3 rounded bg-green-500/40" />
        <div className="w-3 h-3 rounded bg-green-500" />

        <span>More</span>
      </div>

    </div>
  );
}

export default ActivityHeatmap;