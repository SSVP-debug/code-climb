/**
 * ActivityHeatmap
 *
 * Shared by the private Profile page AND the public /u/:username page.
 * Deliberately does NOT call useTheme() itself — on the public page, the
 * person viewing it might not be the profile owner (could be a recruiter,
 * or another student with a different universe selected), so reading
 * "the current viewer's theme" would color someone else's profile with
 * the wrong person's colors. Profile.jsx passes accentColor explicitly
 * (the owner's own theme) since it's the profile owner viewing their own
 * page; PublicProfile.jsx passes nothing and gets the same green it
 * always has.
 */
function ActivityHeatmap({
  activityDates = [],
  accentColor = "#2dd4bf",
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
    <div className="relative overflow-hidden bg-zinc-900 border border-zinc-800 rounded-2xl p-6">

      <div
        aria-hidden="true"
        className="absolute top-0 left-0 right-0 h-1"
        style={{ backgroundColor: accentColor }}
      />

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
            className="w-4 h-4 rounded transition-colors"
            style={{ backgroundColor: day.active ? accentColor : "#27272a" }}
          />
        ))}

      </div>
      <div className="flex items-center justify-end gap-2 mt-5 text-xs text-zinc-500">
        <span>Less</span>

        <div className="w-3 h-3 rounded bg-zinc-800" />
        <div className="w-3 h-3 rounded" style={{ backgroundColor: `${accentColor}66` }} />
        <div className="w-3 h-3 rounded" style={{ backgroundColor: accentColor }} />

        <span>More</span>
      </div>

    </div>
  );
}

export default ActivityHeatmap;