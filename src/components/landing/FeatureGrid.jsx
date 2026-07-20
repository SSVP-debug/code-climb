import { Mic, Layers, Zap, Brain, Flame, BarChart3, Trophy } from "lucide-react";
import Reveal from "./Reveal";
import { SITE_DOMAIN } from "../../config/site.js";

// Sized for an asymmetric bento grid. `span` controls how much room a tile
// takes on md+ screens; the differentiator (live AI mock interviews) gets
// the largest tile instead of matching everything else 1:1.
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
  );
}

export default FeatureGrid;