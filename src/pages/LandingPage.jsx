import { Link } from "react-router-dom";
import PageMeta from "../components/seo/PageMeta";
import { useEffect, useState } from "react";
import { useAuth } from "../context/authContext";

const STATIC_STATS = [
  { key: "problems", value: "Growing", label: "Problem Library" },
  { key: "languages", value: "Multiple", label: "Languages" },
  { key: "themes", value: "Themed", label: "Universes" },
  { key: "ai", value: "AI", label: "Coaching Built In" },
];

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
        ]);
      })
      .catch(() => { }); // fail silently — static fallback stays
  }, []);

  return stats;
}

// ── Feature cards ─────────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: "🧪",
    title: "Themed Universes",
    description:
      "Practice as a lab scientist cracking experiments (Breaking Bug) or a hacker breaching digital vaults (Code Heist). DSA problems, reimagined.",
    badge: null,
  },
  {
    icon: "⚡",
    title: "Multi-language Judge",
    description:
      "Submit in Python, JavaScript, Java, or C++. Your code runs against hidden test cases on our Judge0 backend same as production interviews.",
    badge: null,
  },
  {
    icon: "🤖",
    title: "AI Coaching",
    description:
      "Stuck? Get topic-level insights powered by Claude. Understand your weak patterns and what to practice next not just \"try harder.\"",
    badge: "Live",
  },
  {
    icon: "🔥",
    title: "Streaks & XP",
    description:
      "Daily challenges, streak tracking, XP levels, and unlockable themes. Built to keep you coming back not just once a week before an interview.",
    badge: null,
  },
  {
    icon: "📊",
    title: "Progress Analytics",
    description:
      "Topic-wise coverage heatmaps, difficulty breakdown, solve velocity, and submission history. Know exactly what you've covered and what's left.",
    badge: null,
  },
  {
    icon: "🏆",
    title: "Public Profile",
    description:
      "Share your solve history at code-club.com/u/yourname. Built to impress recruiters show your consistency, not just a resume line.",
    badge: "Beta",
  },
];

// ── Code preview (what students see in the editor) ────────────────────────────
const CODE_PREVIEW = `def twoSum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []

# Test: nums=[2,7,11,15], target=9
# Output: [0, 1]  ✅ Yahoo`;

// ── Theme preview cards ───────────────────────────────────────────────────────
const THEMES_PREVIEW = [
  {
    id: "breakingBug",
    icon: "🧪",
    name: "Breaking Bug",
    accepted: "Crystal Clear ✅",
    error: "Lab Explosion 💥",
    accent: "from-yellow-500/10 to-transparent border-yellow-500/20",
    tag: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  },
  {
    id: "codeHeist",
    icon: "💰",
    name: "Code Heist",
    accepted: "Vault Breached ✅",
    error: "Escape Failed 🚨",
    accent: "from-green-500/10 to-transparent border-green-500/20",
    tag: "bg-green-500/10 text-green-400 border-green-500/20",
  },
];

// ─────────────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const { user } = useAuth();
  const STATS = useLiveStats();

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      <PageMeta
        title="Code Club DSA Practice for Placement Season"
        description="Solve curated DSA problems in themed universes. Track streaks, earn XP, get AI coaching. Free for engineering students preparing for campus placements."
        path="/"
      />

      {/* ── Nav ──────────────────────────────────────────────────────────── */}
      <nav className="flex items-center justify-between px-6 md:px-12 py-5 border-b border-zinc-900">
        <div className="flex items-center gap-2">
          <span className="text-xl font-black tracking-tight">Code Club</span>
          <span className="text-[10px] bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-0.5 rounded-full font-semibold tracking-widest uppercase">
            Beta
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to={user ? "/problems" : "/login"}
            className="text-sm text-zinc-400 hover:text-white transition px-4 py-2"
          >
            Problems
          </Link>
          <Link
            to={user ? "/dashboard" : "/login"}
            className="text-sm bg-green-600 hover:bg-green-500 text-white px-5 py-2 rounded-xl font-semibold transition"
          >
            {user ? "Dashboard →" : "Get Started"}
          </Link>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 md:px-12 pt-20 pb-16">
        <div className="grid md:grid-cols-2 gap-12 items-center">

          {/* Left — copy */}
          <div>
            <div className="inline-flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-full px-4 py-1.5 text-xs text-zinc-400 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Built for placement season
            </div>

            <h1 className="text-4xl md:text-5xl font-black leading-tight mb-5">
              DSA practice that
              <span className="text-green-400"> actually keeps</span>
              <br />you coming back.
            </h1>

            <p className="text-zinc-400 text-lg leading-relaxed mb-8">
              Solve real interview problems in themed universes. Track streaks,
              earn XP, get AI coaching. No overwhelm, Just your
              <strong className="text-white"> Code Club.</strong>
            </p>

            <div className="flex flex-wrap gap-3 mb-10">
              <Link
                to={user ? "/dashboard" : "/login"}
                className="bg-green-600 hover:bg-green-500 text-white px-7 py-3 rounded-xl font-bold text-sm transition shadow-lg shadow-green-900/30"
              >
                {user ? "Go to Dashboard →" : "Start for Free →"}
              </Link>
              <Link
                to={user ? "/problems" : "/login"}
                className="bg-zinc-900 border border-zinc-700 hover:border-zinc-500 text-zinc-300 px-7 py-3 rounded-xl font-semibold text-sm transition"
              >
                Browse Problems
              </Link>
            </div>

            {/* Trust micro-signals */}
            <div className="flex flex-wrap gap-4">
              {["Free to use", "No credit card", "Google login in 10 sec"].map((t) => (
                <span key={t} className="flex items-center gap-1.5 text-xs text-zinc-500">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <circle cx="6" cy="6" r="5.5" stroke="#22c55e" strokeWidth="1" />
                    <path d="M3.5 6L5.5 8L8.5 4.5" stroke="#22c55e" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Right — code preview */}
          <div className="relative">
            {/* Glow behind card */}
            <div className="absolute inset-0 bg-green-500/5 rounded-3xl blur-3xl scale-110 pointer-events-none" />

            <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
              {/* Window chrome */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800 bg-zinc-950">
                <span className="w-3 h-3 rounded-full bg-red-500/60" />
                <span className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <span className="w-3 h-3 rounded-full bg-green-500/60" />
                <span className="ml-3 text-xs text-zinc-500 font-mono">two-sum.py</span>
                <span className="ml-auto text-xs bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-0.5 rounded-full font-semibold">
                  Submitted
                </span>
              </div>

              {/* Code */}
              <pre className="p-5 text-sm font-mono text-zinc-300 leading-relaxed overflow-x-auto">
                <code>{CODE_PREVIEW}</code>
              </pre>

              {/* Submit bar */}
              <div className="flex items-center justify-between px-5 py-3 border-t border-zinc-800 bg-zinc-950">
                <span className="text-xs text-zinc-500 font-mono">
                  Runtime: 48ms · Memory: 14.2 MB
                </span>
                <span className="text-xs text-green-400 font-semibold">
                  +50 XP earned
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats bar ────────────────────────────────────────────────────── */}
      <section className="border-y border-zinc-900 bg-zinc-950/50">
        <div className="max-w-4xl mx-auto px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-3xl font-black text-white mb-1">{s.value}</p>
              <p className="text-xs text-zinc-500 uppercase tracking-widest">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Themes showcase ───────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 md:px-12 py-20">
        <div className="text-center mb-12">
          <p className="text-xs text-green-500 uppercase tracking-widest font-semibold mb-3">
            What makes us different
          </p>
          <h2 className="text-3xl md:text-4xl font-black mb-4">
            Pick your universe. Own your grind.
          </h2>
          <p className="text-zinc-400 max-w-xl mx-auto">
            Note just problems. Code Club has <em>worlds</em>. Same DSA
            completely different experience.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-10">
          {THEMES_PREVIEW.map((t) => (
            <div
              key={t.id}
              className={`relative bg-gradient-to-br ${t.accent} border rounded-2xl p-7 overflow-hidden`}
            >
              <div className="text-4xl mb-4">{t.icon}</div>
              <h3 className="text-xl font-bold mb-1">{t.name}</h3>
              <div className="space-y-2 mt-4 text-sm">
                <div className="flex items-center gap-3">
                  <span className="text-zinc-500 w-20 flex-shrink-0 text-xs">Accepted</span>
                  <span className={`border px-2.5 py-1 rounded-lg text-xs font-semibold ${t.tag}`}>
                    {t.accepted}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-zinc-500 w-20 flex-shrink-0 text-xs">Error</span>
                  <span className="border border-red-500/20 bg-red-500/10 text-red-400 px-2.5 py-1 rounded-lg text-xs font-semibold">
                    {t.error}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Link
            to={user ? "/theme-selection" : "/login"}
            className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition"
          >
            More universes coming soon
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 7H11M11 7L7.5 3.5M11 7L7.5 10.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
      </section>

      {/* ── Feature grid ─────────────────────────────────────────────────── */}
      <section className="bg-zinc-950/50 border-y border-zinc-900">
        <div className="max-w-6xl mx-auto px-6 md:px-12 py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black mb-4">
              Everything you need. Nothing you don't.
            </h2>
            <p className="text-zinc-400 max-w-xl mx-auto">
              Built from scratch for placement-focused engineering students.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-2xl p-6 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <span className="text-3xl">{f.icon}</span>
                  {f.badge && (
                    <span className="text-[10px] bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider">
                      {f.badge}
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-white mb-2">{f.title}</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      
      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="border-t border-zinc-900 bg-zinc-950/50">
        <div className="max-w-2xl mx-auto px-6 py-20 text-center">
          <h2 className="text-3xl md:text-4xl font-black mb-4">
            Your placement prep starts today.
          </h2>
          <p className="text-zinc-400 mb-8">
            Join students building consistency, not just solving problems once and forgetting.
          </p>
          <Link
            to={user ? "/dashboard" : "/login"}
            className="inline-block bg-green-600 hover:bg-green-500 text-white px-10 py-4 rounded-xl font-bold text-base transition shadow-xl shadow-green-900/30"
          >
            {user ? "Go to Dashboard →" : "Start Free — No Card Needed →"}
          </Link>
          <p className="text-xs text-zinc-600 mt-4">
            Google sign-in · Ready in 10 seconds
          </p>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-zinc-900 px-6 md:px-12 py-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-sm font-bold text-zinc-500">Code Club</span>
          <p className="text-xs text-zinc-700">
            Built for engineering students. Not affiliated with Code Club UK.
          </p>
          <div className="flex gap-5 text-xs text-zinc-600">
            <Link to="/problems" className="hover:text-zinc-400 transition">Problems</Link>
            <Link to={user ? "/dashboard" : "/login"} className="hover:text-zinc-400 transition">Dashboard</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
