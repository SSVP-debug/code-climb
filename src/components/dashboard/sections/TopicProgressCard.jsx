import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useAppContext } from "../../../hooks/useAppContext";
import SectionCard from "../../ui/layout/SectionCard";
import EmptyState from "../../ui/feedback/EmptyState";
import { Tags } from "lucide-react";

// Same accent palette used by Analytics.jsx's charts, extended with a
// neutral tone for the "Others" bucket so it reads as grouped overflow
// rather than another real topic.
const SLICE_COLORS = ["#22c55e", "#3b82f6", "#eab308", "#a855f7", "#71717a"];
const MAX_SLICES = 4; // top 4 topics + "Others" if there's a remainder

/**
 * TopicProgressCard
 *
 * Built entirely from `topicStats` (already in AppContext — a
 * { [topic]: solvedCount } map populated client-side in
 * markProblemSolved() and persisted via PUT /api/progress). No new
 * backend endpoint needed — Analytics.jsx already derives its Topic
 * Coverage radar chart from the same field.
 */
function TopicProgressCard() {
  const { topicStats } = useAppContext();

  const { slices, total } = useMemo(() => {
    const entries = Object.entries(topicStats || {}).sort(
      (a, b) => b[1] - a[1]
    );

    const totalSolved = entries.reduce((sum, [, count]) => sum + count, 0);

    const top = entries.slice(0, MAX_SLICES);
    const rest = entries.slice(MAX_SLICES);
    const restTotal = rest.reduce((sum, [, count]) => sum + count, 0);

    const data = top.map(([topic, count]) => ({ name: topic, value: count }));
    if (restTotal > 0) {
      data.push({ name: "Others", value: restTotal });
    }

    return { slices: data, total: totalSolved };
  }, [topicStats]);

  if (total === 0) {
    return (
      <SectionCard title="Topic Progress" icon={<Tags size={18} strokeWidth={2} />} accented>
        <EmptyState
          icon={<Tags size={28} strokeWidth={1.75} />}
          title="No topics yet"
          description="Solve a problem and its topic will show up here."
          compact
        />
      </SectionCard>
    );
  }

  return (
    <SectionCard title="Topic Progress" icon={<Tags size={18} strokeWidth={2} />} accented>
      <div className="flex items-center gap-4">
        <div className="w-28 h-28 flex-shrink-0 relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={slices}
                dataKey="value"
                innerRadius={34}
                outerRadius={54}
                paddingAngle={2}
                stroke="none"
              >
                {slices.map((slice, index) => (
                  <Cell key={slice.name} fill={SLICE_COLORS[index % SLICE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: 8, color: "#fff" }}
                labelStyle={{ color: "#a1a1aa" }}
                formatter={(value, name) => [`${value} solved`, name]}
              />
            </PieChart>
          </ResponsiveContainer>

          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-lg font-bold">{total}</span>
            <span className="text-[10px] text-zinc-500">solved</span>
          </div>
        </div>

        <div className="flex-1 min-w-0 space-y-1.5">
          {slices.map((slice, index) => (
            <div key={slice.name} className="flex items-center justify-between gap-2 text-xs">
              <span className="flex items-center gap-1.5 min-w-0 text-zinc-400 truncate">
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: SLICE_COLORS[index % SLICE_COLORS.length] }}
                />
                <span className="truncate">{slice.name}</span>
              </span>
              <span className="text-zinc-500 flex-shrink-0">
                {Math.round((slice.value / total) * 100)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </SectionCard>
  );
}

export default TopicProgressCard;