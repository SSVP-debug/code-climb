import Reveal from "./Reveal";

// Deliberately no named competitors and no third-party price claims here —
// both are a liability for a small team (stale or wrong numbers read as
// false advertising) and read as less premium than simply stating Code
// Club's own value clearly.
function CompetitorComparison() {
  return (
    <section className="max-w-4xl mx-auto px-6 md:px-12 py-20">
      <Reveal className="text-center mb-10">
        <p className="text-xs text-verdict-accept font-mono-ui uppercase tracking-widest font-semibold mb-3">
          Where practice tools stop
        </p>
        <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
          Practice gets you reps. This gets you placed.
        </h2>
      </Reveal>

      <Reveal className="bg-ink-800 border border-ink-700 rounded-2xl p-8 md:p-10">
        <div className="grid md:grid-cols-2 gap-6 text-sm font-mono-ui">
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-widest mb-3 font-semibold">
              Individual practice tools
            </p>
            <ul className="space-y-2 text-zinc-400">
              <li className="flex items-center gap-2"><span className="text-verdict-reject">✗</span> No TPO readiness dashboard</li>
              <li className="flex items-center gap-2"><span className="text-verdict-reject">✗</span> No recruiter candidate search</li>
              <li className="flex items-center gap-2"><span className="text-verdict-reject">✗</span> No live AI mock interviews</li>
              <li className="flex items-center gap-2"><span className="text-verdict-reject">✗</span> Practice ends at the student</li>
            </ul>
          </div>
          <div className="border border-verdict-accept/30 bg-verdict-accept/5 rounded-xl p-5">
            <p className="text-xs text-verdict-accept uppercase tracking-widest mb-3 font-semibold">
              Code Club
            </p>
            <ul className="space-y-2 text-zinc-300">
              <li className="flex items-center gap-2"><span className="text-verdict-accept">✓</span> TPO readiness dashboard</li>
              <li className="flex items-center gap-2"><span className="text-verdict-accept">✓</span> Recruiter candidate search</li>
              <li className="flex items-center gap-2"><span className="text-verdict-accept">✓</span> Live AI mock interviews</li>
              <li className="flex items-center gap-2"><span className="text-verdict-accept">✓</span> Practice connects to placement</li>
            </ul>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

export default CompetitorComparison;