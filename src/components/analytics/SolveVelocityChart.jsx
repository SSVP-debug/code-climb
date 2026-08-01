import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import SectionCard from "../ui/layout/SectionCard";
import EmptyState from "../ui/feedback/EmptyState";

function SolveVelocityChart({ velocityData }) {
  const { theme } = useTheme();
  const hasActivity = !velocityData.every((d) => d.solved === 0);
  const totalSolved = velocityData.reduce((sum, d) => sum + d.solved, 0);
  const gradientId = "velocityGradient";

  return (
    <SectionCard
      title="Solve Velocity"
      subtitle="Last 8 weeks"
      icon={<TrendingUp size={18} strokeWidth={2} />}
      accented
      action={
        hasActivity ? (
          <span className="text-xs text-zinc-500">
            <span className="text-white font-semibold">{totalSolved}</span> solved this period
          </span>
        ) : undefined
      }
    >
      {!hasActivity ? (
        <EmptyState
          icon={<TrendingUp size={28} strokeWidth={1.75} />}
          title="No recent activity to chart"
          description="Solve a problem this week to start your velocity trend."
          compact
        />
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={velocityData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={theme.colors.primary} stopOpacity={1} />
                <stop offset="100%" stopColor={theme.colors.primary} stopOpacity={0.5} />
              </linearGradient>
            </defs>
            <XAxis dataKey="week" tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip
              contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: 8, color: "#fff" }}
              labelStyle={{ color: "#a1a1aa" }}
              cursor={{ fill: "#27272a" }}
            />
            <Bar dataKey="solved" fill={`url(#${gradientId})`} radius={[4, 4, 0, 0]} maxBarSize={32} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </SectionCard>
  );
}

export default SolveVelocityChart;