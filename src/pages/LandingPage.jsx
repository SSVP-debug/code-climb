import { Link } from "react-router-dom";
import PageMeta from "../components/seo/PageMeta";
import { useEffect, useState } from "react";
import { useAuth } from "../context/authContext";
import { SITE_DOMAIN, SUPPORT_EMAIL } from "../config/site.js";
import Button from "../components/ui/Button";
import HeroTerminal from "../components/landing/HeroTerminal";
import ConstellationBackground from "../components/landing/ConstellationBackground";
import useScrollReveal from "../hooks/useScrollReveal";
import { getTheme } from "../themes";
import { THEME_ICONS, withAlpha } from "../themes/themeIcons";
import {
  Mic,
  Layers,
  Zap,
  Brain,
  Flame,
  BarChart3,
  Trophy,
  GraduationCap,
  Building2,
  Briefcase,
} from "lucide-react";

const STATIC_STATS = [
  { key: "problems", value: "50+", label: "DSA Problems" },
  { key: "languages", value: "4", label: "Languages" },
  { key: "themes", value: "5", label: "Themed Universes" },
  { key: "ai", value: "Claude", label: "Coaching Built In" },
];

// The "ai" stat has no backend equivalent — it's a static descriptor, not a
// count — so it's preserved as-is even once live numbers come in for the
// other three, instead of silently dropping to a 3-stat bar.
const AI_STAT = STATIC_STATS[3];

function useLiveStats() {
  const [stats, setStats] = useState(STATIC_STATS);

  useEffect(() => {
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
    fetch(`${API_URL}/api/stats`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (!data) return;
        setStats([
          {
            key: "problems",
            value: data.problems > 0 ? `${data.problems}+` : "—",
            label: "DSA Problems",
          },
          {
            key: "languages",
            value: data.languages > 0 ? String(data.languages) : "—",
            label: "Languages",
          },
          {
            key: "themes",
            value: data.themes > 0 ? String(data.themes) : "—",
            label: "Themed Universes",
          },
          AI_STAT,
        ]);
      })
      .catch(() => { }); // fail silently — static fallback stays
  }, []);

  return stats;
}

// ── Feature cards — sized for an asymmetric bento grid. `span` controls
// how much room a tile takes on md+ screens; the differentiator (live AI
// mock interviews) gets the largest tile instead of matching everything
// else 1:1. ──────────────────────────────────────────────────────────────
const FEATURES = [
  {
    Icon: Mic,
    title: "Live AI Mock Interviews",
    description:
      "Practice with an AI interviewer that asks follow-ups, pushes on your approach, and gives real feedback not just a hint panel. The closest thing to a real interview before the real interview.",
    badge: "Live",
    span: "md:col-span-2 md:row-span-2",
  },
  {
    Icon: Layers,
    title: "Themed Universes",
    description:
      "Practice as a lab scientist cracking experiments (Breaking Bug) or a hacker breaching digital vaults (Code Heist). DSA problems, reimagined.",
    badge: null,
    span: "",
  },
  {
    Icon: Zap,
    title: "Multi-language Judge",
    description:
      "Submit in Python, JavaScript, Java, or C++. Your code runs against hidden test cases on our Judge0 backend same as production interviews.",
    badge: null,
    span: "",
  },
  {
    Icon: Brain,
    title: "AI Coaching",
    description:
      "Stuck? Get topic-level insights powered by Claude. Understand your weak patterns and what to practice next not just \"try harder.\"",
    badge: null,
    span: "md:col-span-2",
  },
  {
    Icon: Flame,
    title: "Streaks & XP",
    description:
      "Daily challenges, streak tracking, XP levels, and unlockable themes. Built to keep you coming back not just once a week before an interview.",
    badge: null,
    span: "",
  },
  {
    Icon: BarChart3,
    title: "Progress Analytics",
    description:
      "Topic-wise coverage heatmaps, difficulty breakdown, solve velocity, and submission history. Know exactly what you've covered and what's left.",
    badge: null,
    span: "",
  },
  {
    Icon: Trophy,
    title: "Public Profile",
    description:
      `Share your solve history at ${SITE_DOMAIN}/u/yourname — built to impress recruiters, so consistency speaks louder than a resume line.`,
    badge: "Beta",
    span: "",
  },
];

// ── Who Code Club is built for — the actual moat vs. individual-practice
// tools, none of which have a TPO dashboard, a recruiter portal, or live
// AI mock interviews. ────────────────────────────────────────────────────
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

// ── Theme preview cards — colors and icons come straight from the real
// theme system (src/themes), not hand-picked here, so this can't drift
// out of sync with what students actually see after picking a universe. ──
const THEMES_PREVIEW = ["codeHeist", "breakingBug"].map((id) => {
  const colors = getTheme(id).colors;
  return {
    id,
    Icon: THEME_ICONS[id],
    colors,
    name: id === "codeHeist" ? "Code Heist" : "Breaking Bug",
    accepted: id === "codeHeist" ? "Vault Breached ✅" : "Crystal Clear ✅",
    error: id === "codeHeist" ? "Escape Failed 🚨" : "Lab Explosion 💥",
    texture:
      id === "codeHeist"
        ? {
            backgroundImage: `repeating-linear-gradient(45deg, ${withAlpha(colors.primary, "0f")} 0px, ${withAlpha(colors.primary, "0f")} 2px, transparent 2px, transparent 14px)`,
          }
        : {
            backgroundImage: `repeating-linear-gradient(0deg, ${withAlpha(colors.primary, "12")} 0px, ${withAlpha(colors.primary, "12")} 1px, transparent 1px, transparent 24px), repeating-linear-gradient(90deg, ${withAlpha(colors.primary, "12")} 0px, ${withAlpha(colors.primary, "12")} 1px, transparent 1px, transparent 24px)`,
          },
  };
});

// ── Small wrapper: attaches scroll-reveal to any section ───────────────────
function Reveal({ as: Tag = "div", className = "", children, ...rest }) {
  const ref = useScrollReveal();
  return (
    <Tag ref={ref} className={`lp-reveal ${className}`} {...rest}>
      {children}
    </Tag>
  );
}

const ARROW = (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M3 7H11M11 7L7.5 3.5M11 7L7.5 10.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function LandingPage() {
  const { user } = useAuth();
  const STATS = useLiveStats();

  return (
    <div className="min-h-screen bg-ink-950 text-zinc-100 overflow-x-hidden font-display [--theme-primary:#c6ff3d]">
      <PageMeta
        title="Code Club DSA Practice for Placement Season"
        description="Solve curated DSA problems, practice live AI mock interviews, and get discovered. Free for students, with a placement dashboard for TPOs and a candidate search portal for recruiters."
        path="/"
      />

      <ConstellationBackground />

      <div className="relative">
        {/* ── Nav ────────────────────────────────────────────────────── */}
        <nav className="flex items-center justify-between px-6 md:px-12 py-5 border-b border-ink-700">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight">Code Club</span>
            <span className="text-[10px] bg-verdict-accept/10 text-verdict-accept border border-verdict-accept/25 px-2 py-0.5 rounded-full font-mono-ui font-semibold tracking-widest uppercase">
              Beta
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to={user ? "/problems" : "/login?role=student"}
              className="text-sm text-zinc-400 hover:text-white transition px-4 py-2"
            >
              Problems
            </Link>
            <Button to={user ? "/dashboard" : "/portal"} variant="theme" size="sm">
              {user ? "Dashboard →" : "Get Started"}
            </Button>
          </div>
        </nav>

        {/* ── Hero ───────────────────────────────────────────────────── */}
        <section className="max-w-6xl mx-auto px-6 md:px-12 pt-16 md:pt-20 pb-16">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="lp-reveal lp-in-view">
              <div className="inline-flex items-center gap-2 bg-ink-800 border border-ink-700 rounded-full px-4 py-1.5 text-xs font-mono-ui text-zinc-400 mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-verdict-accept animate-pulse" />
                Built for placement season
              </div>

              <h1 className="text-4xl md:text-5xl font-bold leading-[1.1] mb-5 tracking-tight">
                DSA practice that
                <span className="text-verdict-accept"> actually keeps</span>
                <br />you coming back.
              </h1>

              <p className="text-zinc-400 text-lg leading-relaxed mb-8">
                Solve real interview problems, practice live AI mock interviews,
                and build a public solve history recruiters actually check —
                no overwhelm, just
                <strong className="text-white"> your Code Club.</strong>
              </p>

              <div className="flex flex-wrap gap-3 mb-10">
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

              <div className="flex flex-wrap gap-4 font-mono-ui">
                {["Free to use", "No credit card", "Google login in 10 sec"].map((t) => (
                  <span key={t} className="flex items-center gap-1.5 text-xs text-zinc-500">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <circle cx="6" cy="6" r="5.5" stroke="#c6ff3d" strokeWidth="1" />
                      <path d="M3.5 6L5.5 8L8.5 4.5" stroke="#c6ff3d" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Right — the signature moment: a live-running judge */}
            <div className="lp-reveal lp-in-view">
              <HeroTerminal />
            </div>
          </div>
        </section>

        {/* ── Stats bar ──────────────────────────────────────────────── */}
        <Reveal as="section" className="border-y border-ink-700 bg-ink-900/60 backdrop-blur-sm">
          <div className="max-w-4xl mx-auto px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-3xl font-bold text-white mb-1">{s.value}</p>
                <p className="text-xs text-zinc-500 font-mono-ui uppercase tracking-widest">{s.label}</p>
              </div>
            ))}
          </div>
        </Reveal>

        {/* ── Themes showcase ────────────────────────────────────────── */}
        <section className="max-w-6xl mx-auto px-6 md:px-12 py-20">
          <Reveal className="text-center mb-12">
            <p className="text-xs text-verdict-accept font-mono-ui uppercase tracking-widest font-semibold mb-3">
              What makes us different
            </p>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
              Pick your universe. Own your grind.
            </h2>
            <p className="text-zinc-400 max-w-xl mx-auto">
              Not just problems — Code Club has <em>worlds</em>. Same DSA,
              a completely different experience.
            </p>
          </Reveal>

          <div className="grid md:grid-cols-2 gap-6 mb-10">
            {THEMES_PREVIEW.map((t) => (
              <Reveal
                key={t.id}
                className="relative bg-ink-800 border rounded-2xl p-7 overflow-hidden"
                style={{ borderColor: withAlpha(t.colors.primary, "40") }}
              >
                <div style={t.texture} className="absolute inset-0 pointer-events-none" />
                <div
                  aria-hidden="true"
                  className="absolute top-0 left-0 right-0 h-1"
                  style={{
                    background: `linear-gradient(90deg, ${t.colors.primary}, ${t.colors.accent})`,
                  }}
                />
                <div className="relative">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
                    style={{
                      backgroundColor: withAlpha(t.colors.primary, "1f"),
                      color: t.colors.primary,
                    }}
                  >
                    <t.Icon size={26} strokeWidth={2} aria-hidden="true" />
                  </div>
                  <h3 className="text-xl font-bold mb-1">{t.name}</h3>
                  <div className="space-y-2 mt-4 text-sm font-mono-ui">
                    <div className="flex items-center gap-3">
                      <span className="text-zinc-500 w-20 flex-shrink-0 text-xs">Accepted</span>
                      <span
                        className="border px-2.5 py-1 rounded-lg text-xs font-semibold"
                        style={{
                          color: t.colors.primary,
                          borderColor: withAlpha(t.colors.primary, "40"),
                          backgroundColor: withAlpha(t.colors.primary, "1a"),
                        }}
                      >
                        {t.accepted}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-zinc-500 w-20 flex-shrink-0 text-xs">Error</span>
                      <span className="border border-verdict-reject/25 bg-verdict-reject/10 text-verdict-reject px-2.5 py-1 rounded-lg text-xs font-semibold">
                        {t.error}
                      </span>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal className="text-center">
            <Link
              to={user ? "/theme-selection" : "/login?role=student"}
              className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition"
            >
              More universes coming soon
              {ARROW}
            </Link>
          </Reveal>
        </section>

        {/* ── Feature bento grid ─────────────────────────────────────── */}
        <section className="bg-ink-900/60 backdrop-blur-sm border-y border-ink-700">
          <div className="max-w-6xl mx-auto px-6 md:px-12 py-20">
            <Reveal className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
                Everything you need. Nothing you don't.
              </h2>
              <p className="text-zinc-400 max-w-xl mx-auto">
                Built from scratch for placement-focused engineering students.
              </p>
            </Reveal>

            <div className="grid md:grid-cols-3 md:auto-rows-[minmax(0,1fr)] gap-5">
              {FEATURES.map((f) => (
                <Reveal
                  key={f.title}
                  className={`bg-ink-800 border border-ink-700 hover:border-zinc-700 rounded-2xl p-6 transition-colors flex flex-col ${f.span}`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-verdict-accept/10 text-verdict-accept">
                      <f.Icon size={22} strokeWidth={2} aria-hidden="true" />
                    </div>
                    {f.badge && (
                      <span className="text-[10px] font-mono-ui bg-verdict-accept/10 text-verdict-accept border border-verdict-accept/25 px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider">
                        {f.badge}
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-white mb-2">{f.title}</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">{f.description}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── Built for the whole pipeline ───────────────────────────── */}
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

        {/* ── Category comparison ─────────────────────────────────────
             Deliberately no named competitors and no third-party price
             claims here — both are a liability for a small team (stale
             or wrong numbers read as false advertising) and read as less
             premium than simply stating Code Club's own value clearly. */}
        <section className="max-w-4xl mx-auto px-6 md:px-12 py-20">
          <Reveal className="text-center mb-10">
            <p className="text-xs text-verdict-accept font-mono-ui uppercase tracking-widest font-semibold mb-3">
              Where practice tools stop
            </p>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
              Practice gets you reps. This gets you placed.
            </h2>
          </Reveal>

          <Reveal className="bg-ink-800 border border-ink-700 rounded-2xl p-8 md:p-10">
            <div className="grid md:grid-cols-2 gap-6 text-sm font-mono-ui">
              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-widest mb-3 font-semibold">
                  Individual practice tools
                </p>
                <ul className="space-y-2 text-zinc-400">
                  <li className="flex items-center gap-2"><span className="text-verdict-reject">✗</span> No TPO readiness dashboard</li>
                  <li className="flex items-center gap-2"><span className="text-verdict-reject">✗</span> No recruiter candidate search</li>
                  <li className="flex items-center gap-2"><span className="text-verdict-reject">✗</span> No live AI mock interviews</li>
                  <li className="flex items-center gap-2"><span className="text-verdict-reject">✗</span> Practice ends at the student</li>
                </ul>
              </div>
              <div className="border border-verdict-accept/30 bg-verdict-accept/5 rounded-xl p-5">
                <p className="text-xs text-verdict-accept uppercase tracking-widest mb-3 font-semibold">
                  Code Club
                </p>
                <ul className="space-y-2 text-zinc-300">
                  <li className="flex items-center gap-2"><span className="text-verdict-accept">✓</span> TPO readiness dashboard</li>
                  <li className="flex items-center gap-2"><span className="text-verdict-accept">✓</span> Recruiter candidate search</li>
                  <li className="flex items-center gap-2"><span className="text-verdict-accept">✓</span> Live AI mock interviews</li>
                  <li className="flex items-center gap-2"><span className="text-verdict-accept">✓</span> Practice connects to placement</li>
                </ul>
              </div>
            </div>
          </Reveal>
        </section>

        {/* ── CTA ────────────────────────────────────────────────────── */}
        <section className="border-t border-ink-700 bg-ink-900/60 backdrop-blur-sm">
          <Reveal as="div" className="max-w-2xl mx-auto px-6 py-20 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
              Your placement prep starts today.
            </h2>
            <p className="text-zinc-400 mb-8">
              Join students building consistency, not just solving problems once and forgetting.
            </p>
            <Button
              to={user ? "/dashboard" : "/portal"}
              variant="theme"
              size="xl"
              className="shadow-xl shadow-verdict-accept/10"
            >
              {user ? "Go to Dashboard →" : "Start Free — No Card Needed →"}
            </Button>
            <p className="text-xs text-zinc-600 mt-4 font-mono-ui">
              Google sign-in · Ready in 10 seconds
            </p>
          </Reveal>
        </section>

        {/* ── Footer ─────────────────────────────────────────────────── */}
        <footer className="border-t border-ink-700 px-6 md:px-12 py-8">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <span className="text-sm font-bold text-zinc-500">Code Club</span>
            <p className="text-xs text-zinc-700">
              Built for engineering students. Not affiliated with Code Club UK.
            </p>
            <div className="flex gap-5 text-xs text-zinc-600 font-mono-ui">
              <Link to="/problems" className="hover:text-zinc-400 transition">Problems</Link>
              <Link to={user ? "/dashboard" : "/portal"} className="hover:text-zinc-400 transition">Dashboard</Link>
              <Link to="/login?role=tpo" className="hover:text-zinc-400 transition">For TPOs</Link>
              <Link to="/login?role=recruiter" className="hover:text-zinc-400 transition">For Recruiters</Link>
              <Link to="/privacy" className="hover:text-zinc-400 transition">Privacy</Link>
              <Link to="/terms" className="hover:text-zinc-400 transition">Terms</Link>
              <a href={`mailto:${SUPPORT_EMAIL}`} className="hover:text-zinc-400 transition">Contact</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}