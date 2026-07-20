import Reveal from "./Reveal";

function StatsBar({ stats }) {
  return (
    <Reveal as="section" className="border-y border-ink-700 bg-ink-900/60 backdrop-blur-sm">
      <div className="max-w-4xl mx-auto px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-6">
        {stats.map((s) => (
          <div key={s.label} className="text-center">
            <p className="text-3xl font-bold text-white mb-1">{s.value}</p>
            <p className="text-xs text-zinc-500 font-mono-ui uppercase tracking-widest">{s.label}</p>
          </div>
        ))}
      </div>
    </Reveal>
  );
}

export default StatsBar;