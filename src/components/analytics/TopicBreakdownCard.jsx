import { ListTree } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import SectionCard from "../ui/layout/SectionCard";
import EmptyState from "../ui/feedback/EmptyState";

function TopicBreakdownCard({ topicStats, strongestTopic }) {
  const { theme } = useTheme();

  const entries = Object.entries(topicStats).sort((a, b) => b[1] - a[1]);
  const max = entries.length > 0 ? entries[0][1] : 0;

  return (
    <SectionCard title="Topic Breakdown" icon={<ListTree size={18} strokeWidth={2} />} accented>
      {entries.length === 0 ? (
        <EmptyState
          icon={<ListTree size={28} strokeWidth={1.75} />}
          title="No topic data yet"
          description="Solve a problem to start building your topic breakdown."
          compact
        />
      ) : (
        <div className="space-y-3.5">
          {entries.map(([topic, count]) => {
            const widthPercent = max > 0 ? Math.max((count / max) * 100, 4) : 0;
            const isStrongest = topic === strongestTopic;
            return (
              <div key={topic}>
                <div className="flex items-baseline justify-between mb-1">
                  <span className={`text-sm ${isStrongest ? "text-white font-medium" : "text-zinc-300"}`}>
                    {topic}
                  </span>
                  <span className="text-xs text-zinc-500 flex-shrink-0 ml-2">{count}</span>
                </div>
                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${widthPercent}%`,
                      backgroundColor: isStrongest ? theme.colors.primary : `${theme.colors.primary}66`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {strongestTopic && (
        <p className="text-zinc-500 text-xs mt-4 pt-4 border-t border-zinc-800">
          {theme.words.strongestTopic}: <span className="text-white font-medium">{strongestTopic}</span>
        </p>
      )}
    </SectionCard>
  );
}

export default TopicBreakdownCard;