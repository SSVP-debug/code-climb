import { CheckCircle2, Clock, Flame, Shield, FileText } from "lucide-react";
import { useTheme } from "../../hooks/useTheme";

function StatCard({ label, value, icon: Icon, valueColor }) {
  const { theme } = useTheme();
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
      <div className="flex items-center gap-2.5 mb-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${theme.colors.primary}1a`, color: theme.colors.primary }}
        >
          <Icon size={16} strokeWidth={2} aria-hidden="true" />
        </div>
        <p className="text-zinc-400 text-xs uppercase tracking-wide">{label}</p>
      </div>
      <p className={`text-2xl font-bold ${valueColor || "text-white"}`}>{value}</p>
    </div>
  );
}

function AnalyticsStatsGrid({ acceptanceRate, averageRuntime, currentStreak, longestStreak, totalSubmissions }) {
  const { theme } = useTheme();

  // Same red/amber/green thresholds already used for verdict coloring
  // elsewhere (statusMessages.js) — acceptance rate is just another verdict
  // ratio, so it gets the same visual language rather than inventing new
  // color rules for this one metric.
  const rateValue = Number(acceptanceRate);
  const rateColor =
    rateValue >= 70 ? "text-green-400" : rateValue >= 40 ? "text-yellow-400" : "text-red-400";

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      <StatCard
        label={theme.words.acceptanceRate}
        value={`${acceptanceRate}%`}
        icon={CheckCircle2}
        valueColor={rateColor}
      />
      <StatCard label={theme.words.averageRuntime} value={`${averageRuntime} ms`} icon={Clock} />
      <StatCard label="Current Streak" value={currentStreak} icon={Flame} />
      <StatCard label="Best Streak" value={longestStreak} icon={Shield} />
      <StatCard label={theme.words.totalSubmissions} value={totalSubmissions} icon={FileText} />
    </div>
  );
}

export default AnalyticsStatsGrid;