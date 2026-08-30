function StatCard({ title, value, color }) {
  return (
    <div className="bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)]">
      
      <h2 className="text-[var(--muted-foreground)] text-sm mb-2">
        {title}
      </h2>

      <p className={`text-4xl font-bold ${color}`}>
        {value}
      </p>

    </div>
  );
}

export default StatCard;