import { useMemo } from "react";
import { useAppContext } from "../../../hooks/useAppContext";
import { useTheme } from "../../../hooks/useTheme";
import SectionCard from "../../ui/layout/SectionCard";
import { Activity } from "lucide-react";

const DAYS_TO_SHOW = 91; // ~13 weeks, matches the "last 90 days" framing

/**
 * ActivityHeatmapCard
 *
 * Built entirely from `activityDates` (already in AppContext — populated
 * client-side in markProblemSolved() and persisted via PUT /api/progress).
 * No new backend endpoint needed.
 *
 * `activityDates` is a deduped array of "YYYY-MM-DD" strings — one entry
 * per day the user solved something, no per-day count. So this heatmap is
 * intentionally binary (active / inactive), not intensity-shaded like
 * GitHub's. Faking intensity levels from data that doesn't have them would
 * misrepresent activity — worth wiring up a real per-day solve count later
 * if that matters, but that *would* need a backend change, unlike this.
 */
function ActivityHeatmapCard() {
  const { activityDates } = useAppContext();
  const { theme } = useTheme();

  const { weeks, activeCount } = useMemo(() => {
    const activeSet = new Set(activityDates || []);

    // Build the last DAYS_TO_SHOW days, then pad the front so the grid
    // starts on a Sunday — same convention as GitHub's heatmap, makes the
    // weekday rows line up.
    const today = new Date();
    const cells = [];

    for (let i = DAYS_TO_SHOW - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const iso = date.toISOString().split("T")[0];
      cells.push({ date: iso, active: activeSet.has(iso) });
    }

    const leadingBlanks = cells[0]
      ? new Date(cells[0].date).getDay()
      : 0;
    const padded = [
      ...Array.from({ length: leadingBlanks }, () => null),
      ...cells,
    ];

    const weekCols = [];
    for (let i = 0; i < padded.length; i += 7) {
      weekCols.push(padded.slice(i, i + 7));
    }

    return {
      weeks: weekCols,
      activeCount: cells.filter((c) => c.active).length,
    };
  }, [activityDates]);

  return (
    <SectionCard
      title="Activity"
      subtitle={`${activeCount} active day${activeCount === 1 ? "" : "s"} in the last ${DAYS_TO_SHOW} days`}
      icon={<Activity size={18} strokeWidth={2} />}
      accented
      className="lg:col-span-2"
    >
      <div className="flex gap-1 overflow-x-auto pb-1">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="flex flex-col gap-1">
            {week.map((day, dayIndex) =>
              day ? (
                <div
                  key={day.date}
                  title={day.date}
                  className="w-3 h-3 rounded-sm"
                  style={{
                    backgroundColor: day.active ? theme.colors.primary : "#27272a",
                  }}
                />
              ) : (
                <div key={`blank-${dayIndex}`} className="w-3 h-3" />
              )
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 mt-4 text-xs text-zinc-500">
        <span>Less</span>
        <div className="w-3 h-3 rounded-sm bg-zinc-800" />
        <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: theme.colors.primary }} />
        <span>More</span>
      </div>
    </SectionCard>
  );
}

export default ActivityHeatmapCard;