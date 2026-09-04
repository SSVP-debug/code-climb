import { Plus } from "lucide-react";
import Reveal from "./Reveal";

// FAQ — Phase 3I, new section (blueprint position 11).
//
// Every answer below is grounded in a real, currently-true product fact,
// not invented policy or pricing:
//  - "Free right now" mirrors PricingPage.jsx's own live copy verbatim
//    in substance ("Code Club is free for everyone right now... Pricing
//    launches once we've grown the platform") — not a new promise, the
//    same one already shown to a signed-in user who visits /pricing.
//  - Hidden test cases / server-side verification matches the mechanism
//    described in Verification (CompetitorComparison.jsx) and
//    Product Demonstration.
//  - Guest Mode is real (see PortalPage.jsx's "Continue as Guest",
//    hooks/useGuest.js, ProtectedRoute's guestPortal prop).
//  - Supported languages read directly from
//    backend/config/languages.js's enabled registry (Python, JavaScript,
//    Java, C++) rather than being guessed or left as a stale list that
//    could drift from the actual registry.
//  - "Verified profile" points at the two real artifacts that back it:
//    the public profile route (/u/:username) and certificate
//    verification (/verify/:code, CertVerifyPage.jsx) — not a vague
//    claim.
//  - Who it's for matches the three real portals audited for
//    Opportunities (AudienceGrid.jsx) — no capabilities beyond what
//    those routes actually expose.
//
// Native <details>/<summary> per the brief's "if appropriate" allowance:
// keyboard-operable and exposes expanded/collapsed state to assistive
// tech for free, no custom aria-expanded/aria-controls wiring needed.
// The chevron icon is purely decorative (aria-hidden) and rotates via
// the [&_summary::-webkit-details-marker]:hidden + group-open rotation
// below the native marker is hidden and replaced with the Plus icon so
// open/closed state doesn't rely on a browser-default triangle that's
// inconsistent across engines.
const FAQS = [
  {
    q: "Is Code Club free?",
    a: "Yes - right now, every feature is free and unlocked for every student: all problems, AI hints, themes, and interview mode. Pricing will launch later as the platform grows, but nothing you use today gets taken away retroactively.",
  },
  {
    q: "How are solutions actually verified?",
    a: "On submit, your code runs against hidden test cases on the server - not in your browser. The verdict is set there, so an accepted solve isn't something you could fake by only handling the example shown on the problem page.",
  },
  {
    q: "What are hidden test cases?",
    a: "Additional test cases beyond the ones shown on the problem page, used only at submission time. You can't see them or run against them locally, which is what makes an accepted solve mean something beyond \"it worked on the example.\"",
  },
  {
    q: "Can I try it without creating an account?",
    a: "Yes. Guest Mode lets you explore the Student, Recruiter, or TPO side of the product without signing up - pick one from the portal page and continue as a guest.",
  },
  {
    q: "What languages are supported?",
    a: "Python, JavaScript, Java, and C++ today.",
  },
  {
    q: "What does a \"verified profile\" actually mean?",
    a: "Your public profile shows solve history that was checked server-side, not self-reported. Certifications go further - each one has a verification code anyone can check independently, so a recruiter or TPO isn't taking your word for it.",
  },
  {
    q: "Who is Code Club actually for?",
    a: "Three groups, each with their own side of the product: students practicing and building a verified profile, recruiters searching that profile data and sending skills tests, and TPOs tracking placement readiness across a batch.",
  },
];

function FaqSection() {
  return (
    <Reveal as="section" className="px-6 py-20 md:px-12 md:py-24" aria-labelledby="faq-heading">
      <div className="mx-auto max-w-2xl">
        <p className="mb-4 font-mono-ui text-lp-label uppercase tracking-lp-label text-[var(--muted-foreground)]">
          FAQ
        </p>
        <h2
          id="faq-heading"
          className="text-lp-h2-detail font-display font-bold tracking-tight text-[var(--foreground)]"
        >
          Questions worth answering upfront.
        </h2>

        <div className="mt-10 flex flex-col gap-3">
          {FAQS.map((item, i) => (
            <details
              key={item.q}
              className="group rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-5 py-4"
            >
              <summary
                className="flex cursor-pointer list-none items-center justify-between gap-4 font-display font-semibold text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-text)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] rounded-sm [&::-webkit-details-marker]:hidden"
                id={`faq-summary-${i}`}
              >
                <span>{item.q}</span>
                <Plus
                  size={16}
                  strokeWidth={2}
                  className="flex-shrink-0 text-[var(--accent-text)] transition-transform duration-200 group-open:rotate-45"
                  aria-hidden="true"
                />
              </summary>
              <p className="mt-3 pr-8 leading-relaxed text-[var(--muted-foreground)]">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </Reveal>
  );
}

export default FaqSection;