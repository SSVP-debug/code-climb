import { Link } from "react-router-dom";
import { GraduationCap, Building2, Briefcase } from "lucide-react";
import Reveal from "./Reveal";

const ARROW = (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M3 7H11M11 7L7.5 3.5M11 7L7.5 10.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Who Code Club is built for — the actual moat vs. individual-practice
// tools, none of which have a TPO dashboard, a recruiter portal, or live
// AI mock interviews.
const AUDIENCES = [
  {
    Icon: GraduationCap,
    title: "Students",
    description:
      "Practice, build streaks, and get AI mock-interview reps before the real thing.",
    cta: "Start solving",
    to: "/login?role=student",
  },
  {
    Icon: Building2,
    title: "TPOs",
    description:
      "One dashboard for your entire batch's placement readiness solve counts, streaks, topic coverage, and a readiness score, not spreadsheets.",
    cta: "TPO dashboard",
    to: "/login?role=tpo",
  },
  {
    Icon: Briefcase,
    title: "Recruiters",
    description:
      "Search verified candidates by solve history and topic strength, and send skills tests directly no resume guesswork.",
    cta: "Recruiter access",
    to: "/login?role=recruiter",
  },
];

function AudienceGrid() {
  return (
    <section className="max-w-6xl mx-auto px-6 md:px-12 py-20">
      <Reveal className="text-center mb-12">
        <p className="text-xs text-verdict-accept font-mono-ui uppercase tracking-widest font-semibold mb-3">
          Beyond individual practice
        </p>
        <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
          Built for the whole placement pipeline.
        </h2>
        <p className="text-zinc-400 max-w-xl mx-auto">
          Most DSA practice tools stop at the student. Code Club connects
          practice to placement: TPOs get a readiness dashboard, recruiters
          get a candidate search, and students get seen.
        </p>
      </Reveal>

      <div className="grid md:grid-cols-3 gap-5">
        {AUDIENCES.map((a) => (
          <Reveal
            key={a.title}
            className="bg-ink-800 border border-ink-700 hover:border-zinc-700 rounded-2xl p-6 transition-colors flex flex-col"
          >
            <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-verdict-accept/10 text-verdict-accept mb-4">
              <a.Icon size={22} strokeWidth={2} aria-hidden="true" />
            </div>
            <h3 className="font-bold text-white mb-2">{a.title}</h3>
            <p className="text-zinc-400 text-sm leading-relaxed flex-1">
              {a.description}
            </p>
            <Link
              to={a.to}
              className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-verdict-accept hover:brightness-110 transition"
            >
              {a.cta}
              {ARROW}
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

export default AudienceGrid;