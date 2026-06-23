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
    <div className="mt-10">

      <h2 className="text-2xl font-bold mb-4">
        Activity Heatmap
      </h2>

      <div className="flex flex-wrap gap-1">

        {days.map((day) => (
          <div
            key={day.date}
            title={day.date}
            className={`w-4 h-4 rounded-sm ${
              day.active
                ? "bg-green-500"
                : "bg-zinc-800"
            }`}
          />
        ))}

      </div>

    </div>
  );
}

export default ActivityHeatmap;