import Reveal from "./Reveal";

/**
 * Proof Strip — Phase 3C rebuild of the former StatsBar.
 *
 * `stats` prop shape and the live-fetch logic behind it (`useLiveStats`
 * in LandingPage.jsx) are completely unchanged — only the presentation
 * changed here. Per the blueprint's color-restraint principle, this now
 * sits directly on the page's base ink-950 instead of its own
 * bg-ink-900/60 boxed strip, so it reads as a continuation of the Hero
 * rather than a new boxed SaaS component landing on the page — the four
 * stats are now separated by a hairline divider instead of a background
 * change. First real use of the `text-lp-label` token defined in
 * Phase 3A.
 */
function StatsBar({ stats }) {
  return (
    <Reveal as="section" className="px-6 py-14 md:px-12 md:py-16">
      <div className="mx-auto grid max-w-4xl grid-cols-2 gap-y-8 md:grid-cols-4 md:gap-y-0 md:divide-x md:divide-ink-800">
        {stats.map((s) => (
          <div key={s.label} className="px-4 text-center first:pl-0 last:pr-0">
            <p className="mb-1 text-2xl font-bold text-white md:text-3xl">{s.value}</p>
            <p className="font-mono-ui text-lp-label uppercase tracking-lp-label text-zinc-500">
              {s.label}
            </p>
          </div>
        ))}
      </div>
    </Reveal>
  );
}

export default StatsBar;