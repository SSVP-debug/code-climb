import Button from "../ui/Button";

const TRUST_SIGNALS = "Free to use · No credit card · Google login in 10 sec";

const CODE_PREVIEW = `def twoSum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []`;

/**
 * A single, frozen "Accepted" verdict card — the Hero's one visual anchor.
 *
 * Deliberately NOT the animated HeroTerminal. Blueprint §7 moves the live
 * type → run → accept cycle into its own Product Demonstration section
 * (Phase 3D), where it gets a full section's attention budget instead of
 * competing with the H1 for the first three seconds. HeroTerminal.jsx and
 * ConstellationBackground.jsx are untouched and unchanged — still exactly
 * as they were — and simply aren't rendered by the Hero anymore; they're
 * reserved for that later reuse. This card borrows their visual
 * vocabulary (window chrome, verdict badge, runtime/memory row) without
 * any of their timers or canvas loop, per Phase 2 reference (A): a
 * confident static composition over a generic-feeling animation.
 *
 * Purely illustrative — every fact it shows is already stated in the H1
 * and subhead — so the whole thing is aria-hidden rather than have a
 * screen reader narrate a fake code file.
 *
 * Theme note (Phase 1): intentional dark surface, unchanged in White
 * Mode — same reasoning as HeroTerminal, which this borrows its visual
 * vocabulary from. The surrounding Hero copy (H1/subhead/eyebrow/trust
 * signal, below) uses the semantic theme tokens; this card does not.
 */
function ProofCard() {
  return (
    <div aria-hidden="true" className="relative w-full">
      <span className="absolute -top-3 -right-3 z-10 rotate-3 rounded-full border border-verdict-accept/30 bg-ink-900 px-3 py-1 font-mono-ui text-[11px] tracking-wide text-verdict-accept shadow-lg shadow-black/40 md:-top-4 md:-right-5">
        Verified server-side
      </span>

      <div className="overflow-hidden rounded-2xl border border-ink-700 bg-ink-800 font-mono-ui shadow-2xl shadow-black/30 rotate-1">
        <div className="flex items-center gap-2 border-b border-ink-700 bg-ink-900 px-4 py-3">
          <span className="h-3 w-3 rounded-full bg-verdict-reject/60" />
          <span className="h-3 w-3 rounded-full bg-verdict-pending/60" />
          <span className="h-3 w-3 rounded-full bg-verdict-accept/60" />
          <span className="ml-3 text-xs text-zinc-500">two-sum.py</span>
          <span className="ml-auto rounded-full border border-verdict-accept/30 bg-verdict-accept/10 px-2 py-0.5 text-xs font-semibold text-verdict-accept">
            Accepted
          </span>
        </div>

        <pre className="overflow-x-auto p-5 text-sm leading-relaxed text-zinc-300">
          <code>{CODE_PREVIEW}</code>
        </pre>

        <div className="flex items-center justify-between border-t border-ink-700 bg-ink-900 px-5 py-3 text-xs">
          <span className="text-zinc-500">Runtime: 48ms · Memory: 14.0 MB</span>
          <span className="font-semibold text-verdict-accept">+50 XP earned</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Hero — Phase 3B redesign.
 *
 * Single-column, centered, editorial (blueprint §7) rather than the
 * pre-redesign two-column copy/terminal split — the eye no longer has to
 * choose between reading the H1 and watching an animation in the same
 * three seconds. Copy leads with the product's actual differentiator
 * (verified solves → provable profile) instead of a retention framing.
 *
 * The one deliberate asymmetric/bleed moment: the ProofCard sits in its
 * own wider container and, from `md` up, is pushed toward the right edge
 * rather than centered under the text — plus the small floating
 * "Verified server-side" chip breaks the card's own top-right corner.
 * That's the section's only out-of-layout gesture; everything else stays
 * centered and quiet on purpose (Phase 2 design philosophy: selective,
 * not everywhere). On mobile the card simply centers full-width — the
 * asymmetry is desktop-space only, not fought for on a narrow viewport.
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

      <div className="lp-reveal lp-in-view mx-auto mt-16 max-w-5xl md:mt-20 md:flex md:justify-end">
        <div className="mx-auto w-full md:mx-0 md:mr-4 md:max-w-lg lg:mr-10">
          <ProofCard />
        </div>
      </div>
    </section>
  );
}

export default HeroSection;