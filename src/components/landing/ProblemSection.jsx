import Reveal from "./Reveal";

// First-draft placeholder copy — not yet reviewed/approved. Grounded in the
// product's actual mechanism (server-verified solves), not fabricated
// numbers or claims. Flagged for review in the Phase 3C report.
const PROBLEMS = [
  {
    index: "01",
    title: "Verified",
    detail: "Accepted solutions are tested against hidden test cases.",
  },
  {
    index: "02",
    title: "Provable",
    detail:
      "A student's profile should reflect demonstrated problem-solving, not self-reported claims.",
  },
  {
    index: "03",
    title: "Discoverable",
    detail:
      "Demonstrated problem-solving can become part of a student's technical identity.",
  },
];

/**
 * The Problem — one short beat between the Proof Strip and Product
 * Demonstration: names the pain the rest of the page's narrative spine
 * exists to answer. Deliberately brief — this is the setup, not the
 * pitch.
 *
 * Asymmetric two-column composition on desktop — an offset heading
 * column against a wider, offset statement column with a deliberate
 * empty gutter between them (12-col grid: col-span-5, then col-span-6
 * starting at col 7). The three points are now individual bordered
 * cards rather than a hairline-divided list, matching the card language
 * used across the rest of the page.
 */
function ProblemSection() {
  return (
    <Reveal as="section" className="px-6 py-20 md:px-12 md:py-28">
      <div className="mx-auto grid max-w-5xl gap-10 md:grid-cols-12 md:items-center md:gap-8">
        <div className="md:col-span-5">
          <p className="mb-4 font-mono-ui text-lp-label uppercase tracking-lp-label text-[var(--muted-foreground)]">
            The problem
          </p>
          <h2 className="text-lp-h2-spine font-display font-bold tracking-tight text-[var(--foreground)]">
            Anyone can say they solved it.
            <br />
            Proving it is different.
          </h2>
          <p className="mt-4 max-w-sm text-[var(--muted-foreground)]">
            Most platforms take your word for it — a checklist you fill in
            yourself, with nothing behind it once someone actually asks.
          </p>
        </div>

        <div className="flex flex-col gap-3 md:col-span-6 md:col-start-7">
          {PROBLEMS.map((p) => (
            <div
              key={p.index}
              className="flex gap-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-5 py-5"
            >
              <span className="font-mono-ui text-sm text-[var(--accent-text)]">{p.index}</span>
              <div>
                <p className="font-display font-semibold text-[var(--foreground)]">{p.title}</p>
                <p className="mt-1.5 text-[var(--muted-foreground)]">{p.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Reveal>
  );
}

export default ProblemSection;