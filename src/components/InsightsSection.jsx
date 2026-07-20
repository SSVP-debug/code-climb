import { Flame, TrendingUp, Target, AlertTriangle } from "lucide-react";

function InsightCard({ Icon, label, value, valueClass, description }) {
  return (
    <div className="bg-ink-900 p-6 rounded-2xl border border-ink-700">
      <h3 className="text-sm font-semibold text-zinc-400 mb-3 flex items-center gap-2">
        <Icon size={16} strokeWidth={2} aria-hidden="true" />
        {label}
      </h3>

      <p className={`text-3xl font-bold ${valueClass}`}>
        {value}
      </p>

      <p className="text-zinc-400 mt-2">
        {description}
      </p>
    </div>
  );
}

function InsightsSection() {
  return (
    <div className="mt-10">

      <h2 className="text-2xl font-semibold mb-6">
        Progress Insights
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        <InsightCard
          Icon={Flame}
          label="Current Streak"
          value="14 Days"
          valueClass="text-orange-400"
          description="You’re solving consistently this week."
        />

        <InsightCard
          Icon={TrendingUp}
          label="Weekly Growth"
          value="+12%"
          valueClass="text-verdict-accept"
          description="Better performance than last week."
        />

        <InsightCard
          Icon={Target}
          label="Strongest Topic"
          value="Arrays"
          valueClass="text-blue-400"
          description="Excellent problem-solving consistency."
        />

        <InsightCard
          Icon={AlertTriangle}
          label="Needs Practice"
          value="Graphs"
          valueClass="text-verdict-reject"
          description="Accuracy is dropping in this topic."
        />

      </div>

    </div>
  );
}

export default InsightsSection;