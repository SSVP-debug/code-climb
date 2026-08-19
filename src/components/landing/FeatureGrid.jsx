import { Mic, Layers, Zap, Brain, Flame, BarChart3, Trophy } from "lucide-react";
import Reveal from "./Reveal";
import { SITE_DOMAIN } from "../../config/site.js";

// 4-column grid on lg+, with the differentiator (live AI mock interviews)
// spanning 2 columns — but never forced taller than its own content. The
// previous 2-row span left a large empty gap under a short paragraph;
// every card here just takes the height its content needs.
const FEATURES = [
  {
    Icon: Mic,
    title: "Live AI Mock Interviews",
    description:
      "Practice with an AI interviewer that asks follow-ups, pushes on your approach, and gives real feedback — not just a hint panel.",
    badge: "Live",
    span: "sm:col-span-2",
  },
  {
    Icon: Layers,
    title: "Themed Universes",
    description:
      "Practice as a lab scientist cracking experiments (Breaking Bug) or a hacker breaching digital vaults (Code Heist).",
    badge: null,
    span: "",
  },
  {
    Icon: Zap,
    title: "Multi-language Judge",
    description:
      "Submit in Python, JavaScript, Java, or C++. Runs against hidden test cases on our Judge0 backend — same as production interviews.",
    badge: null,
    span: "",
  },
  {
    Icon: Brain,
    title: "AI Coaching",
    description:
      "Topic-level insights powered by Claude. What to practice next, not just \"try harder.\"",
    badge: null,
    span: "",
  },
  {
    Icon: Flame,
    title: "Streaks & XP",
    description:
      "Daily challenges, streak tracking, and unlockable themes — built to keep you coming back, not just once a week before an interview.",
    badge: null,
    span: "",
  },
  {
    Icon: BarChart3,
    title: "Progress Analytics",
    description:
      "Topic-wise coverage heatmaps, difficulty breakdown, and solve velocity. Know exactly what's left.",
    badge: null,
    span: "",
  },
  {
    Icon: Trophy,
    title: "Public Profile",
    description: `Share your solve history at ${SITE_DOMAIN}/u/yourname — consistency speaks louder than a resume line.`,
    badge: "Beta",
    span: "",
  },
];

// The one interview exchange every visitor is picturing when they read
// "AI mock interviews" — a real snippet fills the featured card's extra
// width instead of leaving it empty, and echoes the same window-chrome /
// verdict styling already established by HeroTerminal.
function InterviewSnippet() {
  return (
    <div className="mt-4 rounded-xl border border-ink-700 bg-ink-900 p-3.5 font-mono-ui text-xs space-y-2.5">
      <div className="flex items-center gap-1.5 text-zinc-500">
        <span className="w-1.5 h-1.5 rounded-full bg-verdict-pending" />
        AI interviewer · follow-up
      </div>
      <p className="text-zinc-300 leading-relaxed">
        "Your solution is O(n²) — can you get to O(n) using a hash map?"
      </p>
    </div>
  );
}

function FeatureGrid() {
  return (
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

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {FEATURES.map((f) => (
            <Reveal
              key={f.title}
              className={`bg-ink-800 border border-ink-700 hover:border-zinc-700 rounded-2xl p-5 transition-colors flex flex-col ${f.span}`}
            >
              <div className="flex items-start justify-between mb-3.5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-verdict-accept/10 text-verdict-accept">
                  <f.Icon size={19} strokeWidth={2} aria-hidden="true" />
                </div>
                {f.badge && (
                  <span className="text-[10px] font-mono-ui bg-verdict-accept/10 text-verdict-accept border border-verdict-accept/25 px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider">
                    {f.badge}
                  </span>
                )}
              </div>
              <h3 className="font-bold text-white mb-1.5">{f.title}</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">{f.description}</p>
              {f.title === "Live AI Mock Interviews" && <InterviewSnippet />}
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export default FeatureGrid;