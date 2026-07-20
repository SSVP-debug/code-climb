import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

function SolveVelocityChart({ velocityData }) {
  const hasActivity = !velocityData.every((d) => d.solved === 0);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
      <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest mb-4">
        Solve Velocity (last 8 weeks)
      </h3>
      {!hasActivity ? (
        <p className="text-zinc-600 text-sm text-center py-8">
          No recent activity to chart. Start solving!
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={velocityData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <XAxis dataKey="week" tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip
              contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: 8, color: "#fff" }}
              labelStyle={{ color: "#a1a1aa" }}
              cursor={{ fill: "#27272a" }}
            />
            <Bar dataKey="solved" fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={32} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export default SolveVelocityChart;
