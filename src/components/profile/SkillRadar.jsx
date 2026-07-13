import { useMemo } from "react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
} from "recharts";
import SectionCard from "../ui/layout/SectionCard";
import EmptyState from "../ui/feedback/EmptyState";

/**
 * SkillRadar
 *
 * Same data source and chart config as the "Topic Coverage" radar on
 * Analytics.jsx (kept in sync deliberately — this is the glance view,
 * Analytics is the deep-dive, both showing topicStats is intentional,
 * not duplication to fix).
 */
function SkillRadar({ topicStats = {} }) {
  const radarData = useMemo(() => {
    const entries = Object.entries(topicStats || {})
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
    return entries.map(([topic, count]) => ({
      topic: topic.length > 12 ? topic.slice(0, 12) + "…" : topic,
      count,
    }));
  }, [topicStats]);

  return (
    <SectionCard title="Skill Radar" icon="🕸️">
      {radarData.length < 3 ? (
        <EmptyState
          icon="🕸️"
          title="Not enough data yet"
          description="Solve problems across at least 3 topics to unlock your radar."
          compact
        />
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <RadarChart data={radarData}>
            <PolarGrid stroke="#27272a" />
            <PolarAngleAxis dataKey="topic" tick={{ fill: "#71717a", fontSize: 10 }} />
            <Radar
              name="Solved"
              dataKey="count"
              stroke="#22c55e"
              fill="#22c55e"
              fillOpacity={0.15}
              strokeWidth={2}
            />
          </RadarChart>
        </ResponsiveContainer>
      )}
    </SectionCard>
  );
}

export default SkillRadar;