import Reveal from "./Reveal";

/**
 * Proof Strip — now a row of individual stat cards rather than plain
 * hairline-divided columns, giving each number its own tinted box
 * instead of blending into one continuous strip. `stats` prop shape and
 * the live-fetch logic behind it (`useLiveStats` in LandingPage.jsx) are
 * completely unchanged — only the presentation changed here.
 */
function StatsBar({ stats }) {
  return (
    <Reveal as="section" className="px-6 py-14 md:px-12 md:py-16">
      <div className="mx-auto grid max-w-4xl grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-6 text-center"
          >
            <p className="mb-1 text-2xl font-bold text-[var(--accent-text)] md:text-3xl">{s.value}</p>
            <p className="font-mono-ui text-lp-label uppercase tracking-lp-label text-[var(--muted-foreground)]">
              {s.label}
            </p>
          </div>
        ))}
      </div>
    </Reveal>
  );
}

export default StatsBar;