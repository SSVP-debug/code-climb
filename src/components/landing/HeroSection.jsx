import Button from "../ui/Button";
import HeroTerminal from "./HeroTerminal";

const TRUST_SIGNALS = ["Free to use", "No credit card", "Google login in 10 sec"];

function HeroSection({ user }) {
  return (
    <section className="max-w-6xl mx-auto px-6 md:px-12 pt-16 md:pt-20 pb-16">
      <div className="grid md:grid-cols-2 gap-12 items-center">
        {/* Left — copy. Above the fold, so it's marked already-in-view
            rather than waiting on a scroll trigger like sections below. */}
        <div className="lp-reveal lp-in-view">
          <div className="inline-flex items-center gap-2 bg-ink-800 border border-ink-700 rounded-full px-4 py-1.5 text-xs font-mono-ui text-zinc-400 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-verdict-accept animate-pulse" />
            Built for placement season
          </div>

          <h1 className="text-4xl md:text-5xl font-bold leading-[1.1] mb-5 tracking-tight">
            DSA practice that
            <span className="text-verdict-accept"> actually keeps</span>
            <br />you coming back.
          </h1>

          <p className="text-zinc-400 text-lg leading-relaxed mb-8">
            Solve real interview problems, practice live AI mock interviews,
            and build a public solve history recruiters actually check —
            no overwhelm, just
            <strong className="text-white"> your Code Club.</strong>
          </p>

          <div className="flex flex-wrap gap-3 mb-10">
            <Button
              to={user ? "/dashboard" : "/portal"}
              variant="theme"
              size="lg"
              className="shadow-lg shadow-verdict-accept/10"
            >
              {user ? "Go to Dashboard →" : "Start for Free →"}
            </Button>
            <Button
              to={user ? "/problems" : "/login?role=student"}
              variant="secondary"
              size="lg"
            >
              Browse Problems
            </Button>
          </div>

          <div className="flex flex-wrap gap-4 font-mono-ui">
            {TRUST_SIGNALS.map((t) => (
              <span key={t} className="flex items-center gap-1.5 text-xs text-zinc-500">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <circle cx="6" cy="6" r="5.5" stroke="#2dd4bf" strokeWidth="1" />
                  <path d="M3.5 6L5.5 8L8.5 4.5" stroke="#2dd4bf" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Right — the signature moment: a live-running judge */}
        <div className="lp-reveal lp-in-view">
          <HeroTerminal />
        </div>
      </div>
    </section>
  );
}

export default HeroSection;