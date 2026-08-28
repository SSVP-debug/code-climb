import Button from "../ui/Button";
import Reveal from "./Reveal";

// Final CTA — Phase 3J, rebuilt (blueprint position 12).
//
// Closing beat of the narrative spine (Problem -> Product Demonstration
// -> Verification -> Themed Practice -> Feature Constellation ->
// Community -> Opportunities -> CTA). Introduces nothing new — it
// restates the one mechanism the whole page has been arguing for
// (hidden test cases, server-side, no exceptions) and asks for the same
// action Hero already offered, once the visitor has the full argument
// behind them.
//
// text-lp-h1 (the largest token in the type scale) used deliberately —
// per this phase's typography brief, Final CTA gets "the strongest
// existing landing typography without creating a new scale," which
// means reusing Hero's own size rather than the spine sections' h2.
//
// Auth-aware behavior and copy kept identical to Hero's own primary CTA
// (`user ? "/dashboard" : "/portal"`) rather than inventing new routing
// logic — same destination, same fallback, still the "10 seconds" claim
// grounded in a literal one-click Google sign-in (services/auth.js).
// No fabricated urgency, member counts, or countdowns.
function CtaSection({ user }) {
  return (
    <Reveal
      as="section"
      className="border-t border-ink-700 bg-ink-900/60 px-6 py-24 text-center md:px-12 md:py-32"
    >
      <div className="mx-auto max-w-2xl">
        <p className="mb-5 font-mono-ui text-lp-label uppercase tracking-lp-label text-zinc-500">
          Get started
        </p>
        <h2 className="text-lp-h1 font-display font-bold tracking-tight text-white">
          Prove it. Don&apos;t just say it.
        </h2>
        <p className="mt-5 text-zinc-400">
          Every problem here is graded the same way — hidden test cases,
          checked server-side, no exceptions. Start building a solve
          history that means something.
        </p>

        <div className="mt-9">
          <Button
            to={user ? "/dashboard" : "/portal"}
            variant="theme"
            size="xl"
            className="shadow-xl shadow-verdict-accept/10"
          >
            {user ? "Go to Dashboard →" : "Start Solving — Free →"}
          </Button>
        </div>

        <p className="mt-5 font-mono-ui text-xs text-zinc-600">
          Google sign-in · Ready in 10 seconds
        </p>
      </div>
    </Reveal>
  );
}

export default CtaSection;