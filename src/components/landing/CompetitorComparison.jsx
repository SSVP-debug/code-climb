import { Terminal, ShieldCheck, BadgeCheck } from "lucide-react";
import Reveal from "./Reveal";

// Filename/export name kept as CompetitorComparison for this phase, even
// though — per the Phase 1 audit — this was never really a competitor
// comparison; it's Code Club's Solve → Verify → Prove pipeline. A rename
// to VerificationSection.jsx is a reasonable follow-up for a dedicated
// cleanup pass, but isn't bundled into this phase's already-scoped
// rebuild (minimal footprint, no touch to LandingPage.jsx's import).
//
// Rebuilt for Phase 3E ("Verification", blueprint position 06) — the
// direct payoff of Product Demonstration: the acceptance just watched
// happening is what becomes provable. Per blueprint §12, role colors
// (teal/sky/violet) are scoped to the Opportunities section only, so —
// unlike the pre-redesign version, which individually role-tinted each
// stage — all three stages here share one restrained accent. Content is
// also refocused onto the verification mechanism itself (what actually
// happens to a solve) rather than what a TPO or recruiter later does
// with it, since that's Opportunities' job, not this section's.
const STAGES = [
  {
    id: "solve",
    Icon: Terminal,
    index: "01",
    title: "Solve",
    body: "You write and run code against the problem's public test cases — same as any online judge.",
  },
  {
    id: "verify",
    Icon: ShieldCheck,
    index: "02",
    title: "Verify",
    body: "On submit, the server checks your solution against hidden test cases it never exposes to the browser. The verdict is set there — not on your machine.",
  },
  {
    id: "prove",
    Icon: BadgeCheck,
    index: "03",
    title: "Prove",
    body: "An accepted solve becomes a permanent, verifiable entry on your profile — not a box you checked yourself.",
  },
];

function CompetitorComparison() {
  return (
    <Reveal as="section" className="bg-[var(--surface)] px-6 py-20 md:px-12 md:py-28">
      <div className="mx-auto max-w-2xl text-center">
        <p className="mb-4 font-mono-ui text-lp-label uppercase tracking-lp-label text-[var(--muted-foreground)]">
          Verification
        </p>
        <h2 className="text-lp-h2-spine font-display font-bold tracking-tight text-[var(--foreground)]">
          Solve. Verify. Prove.
        </h2>
        <p className="mt-4 text-[var(--muted-foreground)]">
          Every accepted solve goes through the same three steps — nothing
          about it is self-reported.
        </p>
      </div>

      <div className="mx-auto mt-14 grid max-w-4xl gap-4 md:mt-16 md:grid-cols-3">
        {STAGES.map((s) => (
          <div
            key={s.id}
            className="rounded-2xl border border-[var(--border-strong)] bg-[var(--background)] p-6"
          >
            <span
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-verdict-accept/10 text-[var(--accent-text)]"
              aria-hidden="true"
            >
              <s.Icon size={20} strokeWidth={2} />
            </span>
            <p className="mt-4 font-mono-ui text-xs text-[var(--muted-foreground)]">{s.index}</p>
            <h3 className="mt-1 font-display text-lg font-semibold text-[var(--foreground)]">{s.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-[var(--muted-foreground)]">{s.body}</p>
          </div>
        ))}
      </div>
    </Reveal>
  );
}

export default CompetitorComparison;