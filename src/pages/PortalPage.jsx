import { Link, useNavigate } from "react-router-dom";
import PageMeta from "../components/seo/PageMeta";
import { SITE_DOMAIN } from "../config/site.js";
import { useGuest } from "../hooks/useGuest";
import { GraduationCap, Briefcase, Building2 } from "lucide-react";

// ── Role cards ───────────────────────────────────────────────────────────
// `accessId` is shown as a terminal-style path tag on each card — a small
// nod to the themed-universe / hacker vernacular already used across the
// product (Code Heist, Ghost Protocol, etc.) instead of a generic
// "select your role" chooser.
// Icons intentionally match the same Student/Recruiter/TPO icon mapping
// used on the landing page's audience section, so the persona identity
// stays consistent across the marketing site and the product.
const ROLES = [
  {
    id: "student",
    label: "Student",
    accent: "teal",
    Icon: GraduationCap,
    tagline: "Solve, climb, get interview-ready.",
    description:
      "Practice DSA across themed universes, track XP and streaks, and run live AI mock interviews before the real one.",
    accessId: "/dashboard",
  },
  {
    id: "recruiter",
    label: "Recruiter",
    accent: "sky",
    Icon: Briefcase,
    tagline: "Find signal, not just resumes.",
    description:
      "Search verified candidates by real solve history, send skills tests, and check profile signatures before you reach out.",
    accessId: "/recruiter/dashboard",
  },
  {
    id: "tpo",
    label: "TPO",
    accent: "violet",
    Icon: Building2,
    tagline: "See placement readiness at a glance.",
    description:
      "Track every student on your campus domain — solve velocity, streaks, and who's actually interview-ready this season.",
    accessId: "/tpo/dashboard",
  },
];

const ACCENT_CLASSES = {
  teal: {
    border: "hover:border-teal-500/50 focus-visible:ring-teal-500/60",
    badge: "text-teal-400 bg-teal-500/10 border-teal-500/20",
    shadow: "hover:shadow-[0_0_40px_-15px_rgba(45,212,191,0.35)]",
    button: "bg-teal-600 group-hover:bg-teal-500",
  },
  sky: {
    border: "hover:border-sky-500/50 focus-visible:ring-sky-500/60",
    badge: "text-sky-400 bg-sky-500/10 border-sky-500/20",
    shadow: "hover:shadow-[0_0_40px_-15px_rgba(14,165,233,0.35)]",
    button: "bg-sky-600 group-hover:bg-sky-500",
  },
  violet: {
    border: "hover:border-violet-500/50 focus-visible:ring-violet-500/60",
    badge: "text-violet-400 bg-violet-500/10 border-violet-500/20",
    shadow: "hover:shadow-[0_0_40px_-15px_rgba(139,92,246,0.35)]",
    button: "bg-violet-600 group-hover:bg-violet-500",
  },
};

export default function PortalPage() {
  const navigate = useNavigate();
  const { enterGuestMode } = useGuest();

  // Guest Mode: enters a portal-scoped guest session (see
  // context/GuestProvider.jsx) and navigates straight to that portal's
  // dashboard — same destination a real login for that role lands on
  // (role.accessId, already used for the badge above each card), just
  // without the /login step.
  function handleGuestEnter(roleId, accessId) {
    enterGuestMode(roleId);
    navigate(accessId);
  }

  return (
    <>
      <PageMeta
        title="Choose your access Code Club"
        description="Enter Code Club as a Student, Recruiter, or TPO."
        path="/portal"
      />
      <div className="min-h-screen bg-ink-950 text-white font-display flex flex-col">
        <header className="px-6 py-6 max-w-6xl mx-auto w-full flex items-center justify-between">
          <Link to="/" className="text-lg font-black tracking-tight">
            Code<span className="text-verdict-accept">Club</span>
          </Link>
          <span className="hidden sm:inline text-xs text-zinc-600 font-mono-ui">
            {SITE_DOMAIN}/portal
          </span>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
          <div className="text-center mb-14 max-w-xl">
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-500 font-semibold mb-3">
              Choose your access
            </p>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-3">
              Who's logging in?
            </h1>
            <p className="text-zinc-400 text-sm">
              Your dashboard, tools, and data are different depending on who
              you are. Pick the right one to continue.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full max-w-5xl">
            {ROLES.map((role) => {
              const accent = ACCENT_CLASSES[role.accent];
              return (
                <div
                  key={role.id}
                  className={`group relative flex flex-col justify-between bg-ink-900/80 border border-ink-700 rounded-2xl p-6 transition-all duration-200 hover:-translate-y-1 ${accent.border} ${accent.shadow}`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span
                        className={`w-12 h-12 rounded-xl flex items-center justify-center border ${accent.badge}`}
                        aria-hidden="true"
                      >
                        <role.Icon size={22} strokeWidth={2} />
                      </span>
                      <span
                        className={`text-[10px] font-mono-ui px-2 py-1 rounded-md border ${accent.badge}`}
                      >
                        {role.accessId}
                      </span>
                    </div>
                    <h2 className="text-xl font-bold mb-1">{role.label}</h2>
                    <p className="text-sm text-zinc-500 italic mb-3">
                      {role.tagline}
                    </p>
                    <p className="text-sm text-zinc-400 leading-relaxed">
                      {role.description}
                    </p>
                  </div>

                  <div className="mt-6 flex flex-col gap-2">
                    <Link
                      to={`/login?role=${role.id}`}
                      className={`inline-flex items-center justify-center gap-2 font-semibold text-sm text-white rounded-xl px-4 py-2.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black ${accent.border} ${accent.button}`}
                    >
                      Enter as {role.label} →
                    </Link>
                    {/* Guest Mode: explores the real {role.label} portal
                        with no account — see Guest Mode spec. Kept as a
                        clearly secondary action (smaller, outlined, no
                        accent fill) so "Enter as {role.label}" remains
                        the obvious primary choice for a returning user. */}
                    <button
                      type="button"
                      onClick={() => handleGuestEnter(role.id, role.accessId)}
                      className="inline-flex items-center justify-center gap-2 font-medium text-xs text-zinc-400 hover:text-white rounded-xl px-4 py-2 border border-ink-700 hover:border-ink-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black focus-visible:ring-zinc-500"
                    >
                      Continue as Guest
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="mt-10 text-xs text-zinc-600 text-center max-w-md">
            Already have an account? Signing in always takes you to the
            dashboard you already have — no matter which card you tap.
          </p>
        </main>
      </div>
    </>
  );
}