import { CheckCircle2 } from "lucide-react";
import Reveal from "./Reveal";

// Closing beat, deliberately static — no scroll-pinning, no per-frame
// crossfade math. A confident, oversized wordmark earns its place once
// (this is the only place on the page the brand name gets this large),
// and the line underneath borrows the same "Accepted" verdict vocabulary
// as HeroTerminal and the Solve → Verify → Discovered pipeline above it,
// so the page's own language closes it out instead of a decorative flourish.
function BrandSignoff() {
  return (
    <section className="max-w-6xl mx-auto px-6 md:px-12 py-24 md:py-36 text-center">
      <Reveal>
        <p className="font-display text-base md:text-lg text-zinc-500 mb-4 md:mb-6">
          Where solved problems compile into proof.
        </p>

        <h2 className="font-display font-bold tracking-tight text-verdict-accept leading-[0.85] text-[16vw] sm:text-[13vw] md:text-8xl lg:text-9xl">
          CodeClub
        </h2>

        <div className="mt-8 md:mt-10 inline-flex items-center gap-2 text-xs md:text-sm font-mono-ui font-semibold px-3 py-1.5 rounded-full border bg-verdict-accept/10 text-verdict-accept border-verdict-accept/30">
          <CheckCircle2 size={14} strokeWidth={2.4} aria-hidden="true" />
          Accepted.
        </div>
      </Reveal>
    </section>
  );
}

export default BrandSignoff;