import { useEffect, useRef, useState } from "react";
import Reveal from "./Reveal";
import HeroTerminal from "./HeroTerminal";
import ConstellationBackground from "./ConstellationBackground";

/**
 * Continuously tracks whether `ref`'s element is in the viewport — unlike
 * `useScrollReveal` (one-shot: fires once, then unobserves), this keeps
 * reporting as the element enters and leaves. Used only here, not folded
 * into the shared hook, because nothing else on the page currently needs
 * ongoing (not one-shot) visibility tracking.
 *
 * The reason it exists: HeroTerminal's type→run→accept cycle and
 * ConstellationBackground's canvas loop both start on mount and never
 * stop, regardless of scroll position — a gap the Phase 1 audit flagged
 * explicitly. Rather than editing either component (both stay reused
 * exactly as they were), this section conditionally mounts/unmounts them
 * based on `inView`, which starts and cleanly stops their internal
 * timers/RAF loop for free via each component's own unmount cleanup.
 */
function useInViewport(threshold = 0.35) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return [ref, inView];
}

/**
 * Product Demonstration — Phase 3D, new section.
 *
 * Answers "what does Code Club actually feel like to use?" by showing the
 * real six-stage loop — Problem → Write Code → Run → Hidden Tests →
 * Accepted → Proof — as one continuous vertical composition instead of a
 * feature-card grid. The middle four stages are HeroTerminal's existing
 * type/run/accept cycle, reused untouched; the two bookends this section
 * adds are the "Problem" and "Proof" context rows, since HeroTerminal
 * only ever showed the code/run/verdict part of the loop, not what comes
 * immediately before or after it.
 *
 * The one hand-drawn annotation the blueprint reserved for this section
 * (pointing at the verdict badge) lives here, desktop/tablet only — it's
 * the only such annotation anywhere on the page.
 *
 * Explicitly illustrative, not live data: the whole demonstration block
 * is aria-hidden with a plain-language sr-only summary standing in for
 * it, and it's captioned on-screen as illustrative so a sighted visitor
 * doesn't mistake it for their own or someone else's real submission.
 *
 * Theme note (Phase 1): everything inside the aria-hidden block below —
 * the Problem/Proof chips, connecting lines, terminal placeholder, and
 * the hand-drawn annotation — is one continuous code-mockup apparatus
 * built from the same ink-800/900/700 vocabulary as HeroTerminal, and is
 * kept an intentional dark surface in both Black and White Mode rather
 * than migrated: it visually reads as a single unit, and lighting the
 * chips while the terminal in the middle stays dark (it must, since it's
 * HeroTerminal itself) would split that unit apart. Only the section's
 * own heading/subhead/caption outside that block use the semantic theme
 * tokens.
 */
function ProductDemonstration() {
  const [panelRef, inView] = useInViewport();

  return (
    <Reveal as="section" className="px-6 py-20 md:px-12 md:py-28">
      <div className="mx-auto max-w-5xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-4 font-mono-ui text-lp-label uppercase tracking-lp-label text-[var(--muted-foreground)]">
            See the proof in action
          </p>
          <h2 className="text-lp-h2-spine font-display font-bold tracking-tight text-[var(--foreground)]">
            This is what "verified" looks like.
          </h2>
          <p className="mt-4 text-[var(--muted-foreground)]">
            What happens between hitting Run and a solve becoming part of
            your proof — shown step by step, not as a live submission.
          </p>
          <p className="sr-only">
            Demonstration of the Code Club workflow: a problem prompt
            appears, code is written and run, hidden test cases are
            checked on the server, and an accepted solution is added to
            the student&apos;s verified profile as proof.
          </p>
        </div>

        <div ref={panelRef} className="mx-auto mt-14 max-w-xl md:mt-16">
          <div aria-hidden="true">
            <div className="mb-3 flex items-center justify-between rounded-xl border border-ink-800 bg-ink-900/60 px-4 py-3 font-mono-ui text-xs">
              <span className="uppercase tracking-lp-label text-zinc-500">Problem</span>
              <span className="text-zinc-300">Two Sum · Arrays, Hashing · Easy</span>
            </div>

            <div className="ml-4 h-3 w-px bg-ink-800" />

            <div className="relative min-h-[400px] p-3 md:p-4">
              {inView ? (
                <>
                  <ConstellationBackground />
                  <HeroTerminal />
                </>
              ) : (
                <div className="h-[380px] rounded-2xl border border-ink-700 bg-ink-800/60" />
              )}

              <div className="pointer-events-none absolute -right-6 top-8 hidden lg:block">
                <svg width="88" height="56" viewBox="0 0 88 56" fill="none">
                  <path
                    d="M4 4C38 4 66 18 78 46"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    className="text-zinc-600"
                  />
                  <path
                    d="M70 42L78 46L76 37"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-zinc-600"
                  />
                </svg>
                <p className="mt-1 max-w-[9.5rem] font-mono-ui text-[11px] leading-snug text-zinc-500">
                  Set server-side — never by the browser
                </p>
              </div>
            </div>

            <div className="ml-4 h-3 w-px bg-ink-800" />

            <div className="mt-3 flex items-center justify-between rounded-xl border border-ink-800 bg-ink-900/60 px-4 py-3 font-mono-ui text-xs">
              <span className="uppercase tracking-lp-label text-zinc-500">Proof</span>
              <span className="text-verdict-accept">Added to your verified profile</span>
            </div>
          </div>

          <p className="mt-4 text-center font-mono-ui text-[11px] text-[var(--muted-foreground)]">
            Illustrative walkthrough — not a live submission.
          </p>
        </div>
      </div>
    </Reveal>
  );
}

export default ProductDemonstration;