function StatCard({ title, value, color }) {
  return (
    <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
      
      <h2 className="text-zinc-400 text-sm mb-2">
        {title}
      </h2>

      <p className={`text-4xl font-bold ${color}`}>
        {value}
      </p>

    </div>
  );
}

export default StatCard;