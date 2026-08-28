import { Link } from "react-router-dom";
import { GraduationCap, Briefcase, Building2, ArrowRight } from "lucide-react";
import Reveal from "./Reveal";

// Filename/export kept as AudienceGrid for this phase, same reasoning as
// CompetitorComparison.jsx: minimal footprint, no LandingPage.jsx import
// change. What it renders is now the Opportunities section (blueprint
// position 10, Phase 3H) — the bridge from "here's what you proved"
// (Verification/Community) to "here's where that goes."
//
// Rebuilt from scratch rather than restyled: the previous version's
// overlapping preview-card stack (rounded-2xl cards, colored glow
// shadows, a gradient connector line, invented numbers like "312
// students tracked" and "78% placement ready") is exactly the kind of
// fabricated social proof and glassmorphism this phase's brief rules
// out. Every claim below is instead grounded in a real, routable
// capability (see routes audit — PortalPage.jsx's own per-role
// descriptions, App.jsx's /recruiter/dashboard + /candidate/tests +
// /tpo/dashboard routes). No company logos, no invented placement
// stats, no fake dashboards.
//
// Role colors use --color-role-student/recruiter/tpo (index.css §12 —
// defined but unused until now, reserved specifically for this
// section) rather than raw Tailwind teal/sky/violet classes, so the
// accent is centralized in one place. Used only as a small dot + label
// + link color per row — never a card background or a glow.
// Literal class strings only (Tailwind JIT can't resolve interpolated
// class names like `text-${accent}` — same constraint documented in
// ContactChannels.jsx) — keyed by role so each row's icon/label/link
// share one accent without string-building a class name.
const ACCENT_CLASSES = {
  "role-student": {
    text: "text-role-student",
    ring: "focus-visible:ring-role-student",
  },
  "role-recruiter": {
    text: "text-role-recruiter",
    ring: "focus-visible:ring-role-recruiter",
  },
  "role-tpo": {
    text: "text-role-tpo",
    ring: "focus-visible:ring-role-tpo",
  },
};

const ROLES = [
  {
    id: "student",
    index: "01",
    Icon: GraduationCap,
    title: "Students",
    body: "Practice across themed universes, build streaks, and run AI mock interviews before the real one.",
    cta: "Start solving",
    accent: "role-student",
  },
  {
    id: "recruiter",
    index: "02",
    Icon: Briefcase,
    title: "Recruiters",
    body: "Search candidates by real, server-verified solve history and send skills tests directly — no resume guesswork.",
    cta: "Recruiter access",
    accent: "role-recruiter",
  },
  {
    id: "tpo",
    index: "03",
    Icon: Building2,
    title: "TPOs",
    body: "Track your batch's placement readiness — solve counts, streaks, topic coverage — in one dashboard instead of a spreadsheet.",
    cta: "TPO dashboard",
    accent: "role-tpo",
  },
];

function AudienceGrid({ user }) {
  const destination = user ? "/dashboard" : "/portal";

  return (
    <Reveal as="section" className="px-6 py-20 md:px-12 md:py-28">
      <div className="mx-auto grid max-w-5xl gap-10 md:grid-cols-12 md:gap-8">
        <div className="md:col-span-5">
          <p className="mb-4 font-mono-ui text-lp-label uppercase tracking-lp-label text-zinc-500">
            Opportunities
          </p>
          <h2 className="text-lp-h2-spine font-display font-bold tracking-tight text-white">
            Verified work doesn&apos;t stop at your dashboard.
          </h2>
          <p className="mt-4 max-w-sm text-zinc-400">
            Practice and proof stay yours. What happens with them depends
            on who&apos;s looking — a recruiter searching by real solve
            history, or a TPO reading a whole batch&apos;s readiness.
          </p>
        </div>

        <div className="md:col-span-6 md:col-start-7">
          <ul className="border-t border-ink-800 divide-y divide-ink-800">
            {ROLES.map((r) => {
              const a = ACCENT_CLASSES[r.accent];
              return (
                <li key={r.id} className="flex gap-5 py-6">
                  <span className={`mt-0.5 flex-shrink-0 ${a.text}`} aria-hidden="true">
                    <r.Icon size={20} strokeWidth={2} />
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono-ui text-xs text-zinc-600">
                        {r.index}
                      </span>
                      <p className="font-display font-semibold text-white">
                        {r.title}
                      </p>
                    </div>
                    <p className="mt-1.5 text-zinc-400">{r.body}</p>
                    <Link
                      to={destination}
                      className={`mt-3 inline-flex items-center gap-1.5 text-sm font-semibold ${a.text} hover:brightness-110 transition focus-visible:outline-none focus-visible:ring-2 ${a.ring} focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950 rounded-sm`}
                    >
                      {r.cta}
                      <ArrowRight size={14} aria-hidden="true" />
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </Reveal>
  );
}

export default AudienceGrid;