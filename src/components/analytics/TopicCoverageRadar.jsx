import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer } from "recharts";

function TopicCoverageRadar({ radarData }) {
  if (radarData.length < 3) return null;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
      <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest mb-4">
        Topic Coverage
      </h3>
      <ResponsiveContainer width="100%" height={260}>
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
    </div>
  );
}

export default TopicCoverageRadar;
