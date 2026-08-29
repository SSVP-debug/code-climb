import Button from "../ui/Button";

const TRUST_SIGNALS = "Free to use · No credit card · Google login in 10 sec";

/**
 * Hero — single-column, centered, editorial (blueprint §7).
 *
 * Copy leads with the product's actual differentiator (verified solves →
 * provable profile) instead of a retention framing.
 *
 * No code/terminal visual here by design — the live type → run → accept
 * cycle lives in its own Product Demonstration section further down,
 * where it gets a full section's attention budget instead of competing
 * with the H1 for the first three seconds. HeroTerminal.jsx and
 * ConstellationBackground.jsx are unrelated/untouched and reserved for
 * that section's use.
 *
 * Auth-aware CTA destinations/labels are unchanged from the pre-redesign
 * version.
 */
function HeroSection({ user }) {
  return (
    <section className="px-6 pt-24 pb-20 md:px-12 md:pb-28 md:pt-32 lg:pt-36">
      <div className="lp-reveal lp-in-view mx-auto max-w-2xl text-center">
        <p className="mb-6 inline-flex items-center justify-center gap-2 font-mono-ui text-lp-eyebrow uppercase tracking-lp-eyebrow text-[var(--muted-foreground)]">
          <span className="h-1.5 w-1.5 rounded-full bg-verdict-pending" />
          Placement season 2026 — batches open now
        </p>

        <h1 className="text-lp-h1 font-display font-bold tracking-tight text-[var(--foreground)]">
          Every solve, <span className="text-[var(--accent-text)]">verified.</span>
          <br />
          Every profile, provable.
        </h1>

        <p className="mt-6 text-lg leading-relaxed text-[var(--muted-foreground)]">
          Code Club checks every submission server-side, so your solve
          history means something to the people looking at it.
        </p>

        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
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

        <p className="mt-5 font-mono-ui text-xs text-[var(--muted-foreground)]">{TRUST_SIGNALS}</p>
      </div>
    </section>
  );
}

export default HeroSection;