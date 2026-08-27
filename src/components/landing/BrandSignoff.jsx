import { CheckCircle2, Code2 } from "lucide-react";
import Reveal from "./Reveal";

// Closing beat before the final CTA. Previously this rendered an
// oversized, unbadged "CodeClub" wordmark (no space, no logo mark) with
// py-24/py-36 section padding — both broke continuity with every other
// section on the page: the brand name reads "Code Club" everywhere else
// (Navbar, LandingNav, LandingFooter), and that much padding stacked on
// top of CtaSection's own py-20 left a huge dead gap between "Accepted."
// and the next heading. This keeps the confident sign-off moment but
// reuses the same icon-badge treatment as the nav/footer brand mark and
// brings spacing back in line with the rest of the page's sections
// (py-20, matching FeatureGrid/AudienceGrid/CompetitorComparison).
function BrandSignoff() {
  return (
    <section className="max-w-6xl mx-auto px-6 md:px-12 py-20 text-center">
      <Reveal>
        <p className="font-display text-base md:text-lg text-zinc-500 mb-6">
          Where solved problems compile into proof.
        </p>

        <div className="inline-flex items-center gap-3 md:gap-4 mb-8">
          <span
            className="w-10 h-10 md:w-14 md:h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{
              backgroundColor: "var(--theme-primary-alpha, rgba(45,212,191,0.12))",
              color: "var(--theme-primary, #2dd4bf)",
            }}
            aria-hidden="true"
          >
            <Code2 size={24} strokeWidth={2} />
          </span>
          <h2 className="font-display font-bold tracking-tight text-verdict-accept leading-none text-4xl sm:text-5xl md:text-7xl">
            Code Club
          </h2>
        </div>

        <div className="inline-flex items-center gap-2 text-xs md:text-sm font-mono-ui font-semibold px-3 py-1.5 rounded-full border bg-verdict-accept/10 text-verdict-accept border-verdict-accept/30">
          <CheckCircle2 size={14} strokeWidth={2.4} aria-hidden="true" />
          Accepted.
        </div>
      </Reveal>
    </section>
  );
}

export default BrandSignoff;