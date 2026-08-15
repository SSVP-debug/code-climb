import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer } from "recharts";
import { Radar as RadarIcon } from "lucide-react";
import { useTheme } from "../../hooks/useTheme";
import SectionCard from "../ui/layout/SectionCard";

function TopicCoverageRadar({ radarData }) {
  const { theme } = useTheme();

  if (radarData.length < 3) return null;

  return (
    <SectionCard title="Topic Coverage" icon={<RadarIcon size={18} strokeWidth={2} />} accented>
      <ResponsiveContainer width="100%" height={260}>
        <RadarChart data={radarData}>
          <PolarGrid stroke="#27272a" />
          <PolarAngleAxis dataKey="topic" tick={{ fill: "#71717a", fontSize: 10 }} />
          <Radar
            name="Solved"
            dataKey="count"
            stroke={theme.colors.primary}
            fill={theme.colors.primary}
            fillOpacity={0.18}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>
    </SectionCard>
  );
}

export default TopicCoverageRadar;