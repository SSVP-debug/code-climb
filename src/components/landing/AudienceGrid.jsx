import { Link } from "react-router-dom";
import {
  GraduationCap,
  Building2,
  Briefcase,
  Flame,
  CheckCircle2,
  Search,
  Users,
} from "lucide-react";
import Reveal from "./Reveal";

const ARROW = (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M3 7H11M11 7L7.5 3.5M11 7L7.5 10.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Who Code Club is built for — the actual moat vs. individual-practice
// tools, none of which have a TPO dashboard, a recruiter portal, or live
// AI mock interviews. Accent colors deliberately match the role colors
// used on /portal and carried into /login, so the same three colors mean
// the same three roles everywhere in the entry flow.
const ROLES = [
  {
    id: "student",
    Icon: GraduationCap,
    title: "Students",
    description:
      "Practice, build streaks, and get AI mock-interview reps before the real thing.",
    cta: "Start solving",
    accent: "teal",
  },
  {
    id: "recruiter",
    Icon: Briefcase,
    title: "Recruiters",
    description:
      "Search verified candidates by solve history and topic strength, and send skills tests directly — no resume guesswork.",
    cta: "Recruiter access",
    accent: "sky",
  },
  {
    id: "tpo",
    Icon: Building2,
    title: "TPOs",
    description:
      "One dashboard for your entire batch's placement readiness — solve counts, streaks, topic coverage — not spreadsheets.",
    cta: "TPO dashboard",
    accent: "violet",
  },
];

const ACCENT = {
  teal: {
    text: "text-teal-400",
    badge: "bg-teal-500/10 border-teal-500/25 text-teal-400",
    ring: "border-teal-500/25",
    glow: "shadow-[0_20px_60px_-20px_rgba(45,212,191,0.35)]",
    dot: "bg-teal-400",
    bar: "bg-teal-400",
  },
  sky: {
    text: "text-sky-400",
    badge: "bg-sky-500/10 border-sky-500/25 text-sky-400",
    ring: "border-sky-500/25",
    glow: "shadow-[0_20px_60px_-20px_rgba(14,165,233,0.35)]",
    dot: "bg-sky-400",
    bar: "bg-sky-400",
  },
  violet: {
    text: "text-violet-400",
    badge: "bg-violet-500/10 border-violet-500/25 text-violet-400",
    ring: "border-violet-500/25",
    glow: "shadow-[0_20px_60px_-20px_rgba(139,92,246,0.35)]",
    dot: "bg-violet-400",
    bar: "bg-violet-400",
  },
};

// Small chrome strip shared by every preview card — echoes HeroTerminal's
// window-chrome so the stack reads as "real product," not a generic icon
// card.
function CardChrome({ label, accent }) {
  const a = ACCENT[accent];
  return (
    <div className="flex items-center gap-1.5 mb-3">
      <span className={`w-1.5 h-1.5 rounded-full ${a.dot}`} aria-hidden="true" />
      <span className="text-[10px] font-mono-ui uppercase tracking-widest text-zinc-500">
        {label}
      </span>
    </div>
  );
}

function StudentPreviewCard({ className = "" }) {
  const a = ACCENT.teal;
  return (
    <div
      className={`w-64 sm:w-72 bg-ink-900 border border-ink-700 ${a.ring} rounded-2xl p-4 ${a.glow} ${className}`}
    >
      <CardChrome label="Student · Dashboard" accent="teal" />
      <div className="flex items-center gap-2 mb-3">
        <Flame size={15} className="text-orange-400" strokeWidth={2.2} aria-hidden="true" />
        <span className="text-sm font-semibold text-white">14-day streak</span>
      </div>
      <div className="mb-3">
        <div className="flex justify-between text-[11px] font-mono-ui text-zinc-500 mb-1">
          <span>1,240 XP</span>
          <span>Level 6</span>
        </div>
        <div className="h-1.5 rounded-full bg-ink-700 overflow-hidden">
          <div className={`h-full w-[64%] rounded-full ${a.bar}`} />
        </div>
      </div>
      <div className="flex items-center gap-1.5 text-xs text-zinc-400">
        <CheckCircle2 size={13} className="text-verdict-accept" strokeWidth={2.2} aria-hidden="true" />
        <span className="font-mono-ui">Two Sum</span>
        <span className="text-verdict-accept font-mono-ui ml-auto">Accepted</span>
      </div>
    </div>
  );
}

function RecruiterPreviewCard({ className = "" }) {
  const a = ACCENT.sky;
  return (
    <div
      className={`w-64 sm:w-72 bg-ink-900 border border-ink-700 ${a.ring} rounded-2xl p-4 ${a.glow} ${className}`}
    >
      <CardChrome label="Recruiter · Search" accent="sky" />
      <div className="flex items-center gap-2.5 mb-3">
        <span className="w-8 h-8 rounded-full bg-sky-500/15 border border-sky-500/25 flex items-center justify-center text-xs font-bold text-sky-400">
          AR
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white truncate">Ananya R.</p>
          <p className="text-[11px] text-zinc-500 font-mono-ui">Final year · CSE</p>
        </div>
        <span className="ml-auto flex items-center gap-1 text-[10px] font-mono-ui text-sky-400 bg-sky-500/10 border border-sky-500/25 rounded-full px-2 py-0.5">
          <CheckCircle2 size={10} strokeWidth={2.5} aria-hidden="true" />
          Verified
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {["Arrays", "DP", "Graphs"].map((tag) => (
          <span
            key={tag}
            className="text-[10px] font-mono-ui text-zinc-400 bg-ink-800 border border-ink-700 rounded-md px-1.5 py-0.5"
          >
            {tag}
          </span>
        ))}
      </div>
      <div className="flex items-center gap-1.5 text-xs text-zinc-400">
        <Search size={13} className={a.text} strokeWidth={2.2} aria-hidden="true" />
        <span>142 problems solved</span>
      </div>
    </div>
  );
}

function TpoPreviewCard({ className = "" }) {
  const a = ACCENT.violet;
  const bars = [40, 65, 50, 85, 60];
  return (
    <div
      className={`w-64 sm:w-72 bg-ink-900 border border-ink-700 ${a.ring} rounded-2xl p-4 ${a.glow} ${className}`}
    >
      <CardChrome label="TPO · Batch 2026" accent="violet" />
      <div className="flex items-end justify-between mb-3">
        <div>
          <p className="text-2xl font-bold text-white leading-none">78%</p>
          <p className="text-[11px] text-zinc-500 font-mono-ui mt-1">Placement ready</p>
        </div>
        <div className="flex items-end gap-1 h-8">
          {bars.map((h, i) => (
            <div
              key={i}
              className={`w-2 rounded-sm ${a.bar}`}
              style={{ height: `${h}%`, opacity: 0.4 + i * 0.12 }}
            />
          ))}
        </div>
      </div>
      <div className="flex items-center gap-1.5 text-xs text-zinc-400">
        <Users size={13} className={a.text} strokeWidth={2.2} aria-hidden="true" />
        <span>312 students tracked</span>
      </div>
    </div>
  );
}

// Dashed connector behind the stack — a literal pipeline: solve → get
// found → get tracked, matching the section copy instead of decorating
// for its own sake.
function PipelineConnector() {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none hidden md:block"
      viewBox="0 0 400 460"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="pipeline-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2dd4bf" />
          <stop offset="50%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#a78bfa" />
        </linearGradient>
      </defs>
      <path
        d="M110 90 C 200 140, 150 170, 230 220 S 160 320, 190 360"
        stroke="url(#pipeline-grad)"
        strokeWidth="1.5"
        strokeDasharray="4 6"
        strokeLinecap="round"
        opacity="0.5"
      />
    </svg>
  );
}

function PipelineStack() {
  return (
    <div className="relative hidden md:block w-full h-[460px]">
      <PipelineConnector />
      <StudentPreviewCard className="absolute top-0 left-2 -rotate-[4deg] z-30" />
      <RecruiterPreviewCard className="absolute top-[168px] left-[112px] rotate-[3deg] z-20" />
      <TpoPreviewCard className="absolute top-[336px] left-[28px] -rotate-[2deg] z-10" />
    </div>
  );
}

function AudienceGrid({ user }) {
  const destination = user ? "/dashboard" : "/portal";

  return (
    <section className="max-w-6xl mx-auto px-6 md:px-12 py-20">
      <Reveal className="text-center mb-14 max-w-2xl mx-auto">
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

      <div className="grid md:grid-cols-2 gap-10 md:gap-6 items-center">
        {/* Left — the actual claims, one per role, in the same order the
            stack reads top-to-bottom on desktop. */}
        <Reveal className="flex flex-col gap-6 order-2 md:order-1">
          {ROLES.map((r) => {
            const a = ACCENT[r.accent];
            return (
              <div key={r.id} className="flex gap-4">
                <span
                  className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center border ${a.badge}`}
                  aria-hidden="true"
                >
                  <r.Icon size={18} strokeWidth={2.2} />
                </span>
                <div>
                  <h3 className="font-bold text-white mb-1">{r.title}</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed mb-2">
                    {r.description}
                  </p>
                  <Link
                    to={destination}
                    className={`inline-flex items-center gap-1.5 text-sm font-semibold ${a.text} hover:brightness-110 transition`}
                  >
                    {r.cta}
                    {ARROW}
                  </Link>
                </div>
              </div>
            );
          })}
        </Reveal>

        {/* Right (desktop) — the overlapping preview-card stack. */}
        <div className="order-1 md:order-2">
          <PipelineStack />

          {/* Mobile — same three preview cards, stacked full-width instead
              of overlapping, so nothing clips on narrow screens. */}
          <div className="flex md:hidden flex-col items-center gap-5">
            <StudentPreviewCard className="-rotate-1" />
            <RecruiterPreviewCard className="rotate-1" />
            <TpoPreviewCard className="-rotate-1" />
          </div>
        </div>
      </div>
    </section>
  );
}

export default AudienceGrid;