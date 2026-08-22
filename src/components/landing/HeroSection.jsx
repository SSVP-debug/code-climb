import Button from "../ui/Button";
import HeroTerminal from "./HeroTerminal";
import ConstellationBackground from "./ConstellationBackground";

const TRUST_SIGNALS = "Free to use · No credit card · Google login in 10 sec";

function HeroSection({ user }) {
  return (
    <section className="max-w-6xl mx-auto px-6 md:px-12 pt-16 md:pt-20 pb-16">
      <div className="grid md:grid-cols-2 gap-12 items-center">
        {/* Left — copy. Above the fold, so it's marked already-in-view
            rather than waiting on a scroll trigger like sections below. */}
        <div className="lp-reveal lp-in-view">
          <div className="inline-flex items-center gap-2 bg-ink-800 border border-ink-700 rounded-full px-4 py-1.5 text-xs font-mono-ui text-zinc-400 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-verdict-pending" />
            Placement season 2026 · batches open now
          </div>

          <h1 className="text-4xl md:text-5xl font-bold leading-[1.1] mb-5 tracking-tight">
            DSA practice that
            <span className="text-verdict-accept"> actually keeps</span>
            <br />you coming back.
          </h1>

          <p className="text-zinc-400 text-lg leading-relaxed mb-8">
            Solve real interview problems, practice live AI mock interviews,
            and build a solve history that's{" "}
            <span className="text-verdict-pending">verified</span>, not
            self-reported  {" "}
            <strong className="text-white">the kind recruiters actually check.</strong>
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

          <p className="text-xs text-zinc-500 font-mono-ui">{TRUST_SIGNALS}</p>
        </div>

        {/* Right — the signature moment: a live-running judge, with the
            skill-graph canvas confined to this one panel instead of
            wallpapering the whole page behind every section below. */}
        <div className="lp-reveal lp-in-view relative p-6 md:p-10 -m-6 md:-m-10">
          <ConstellationBackground />
          <HeroTerminal />
        </div>
      </div>
    </section>
  );
}

export default HeroSection;