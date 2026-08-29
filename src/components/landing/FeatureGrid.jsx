import { Mic, Layers, Zap, Brain, Flame, BarChart3, Trophy } from "lucide-react";
import Reveal from "./Reveal";
import { SITE_DOMAIN } from "../../config/site.js";

// Feature Constellation — supporting-detail section, now a card grid:
// each capability in its own bordered box, with the featured item
// (AI Mock Interviews) spanning the full row so its transcript preview
// has room to breathe. Content is the same real product capabilities as
// before — nothing invented, nothing removed.
const FEATURES = [
  {
    Icon: Mic,
    title: "Live AI Mock Interviews",
    tag: "Live",
    description:
      "Practice with an AI interviewer that asks follow-ups, pushes on your approach, and gives real feedback — not just a hint panel.",
    featured: true,
  },
  {
    Icon: Layers,
    title: "Themed Universes",
    description:
      "Practice as a lab scientist cracking experiments or a hacker breaching digital vaults — five story worlds built on the same DSA curriculum.",
  },
  {
    Icon: Zap,
    title: "Multi-language Judge",
    description:
      "Submit in Python, JavaScript, Java, or C++. Runs against hidden test cases on our Judge0 backend — same as production interviews.",
  },
  {
    Icon: Brain,
    title: "AI Coaching",
    description:
      "Topic-level insights powered by Claude. What to practice next, not just \"try harder.\"",
  },
  {
    Icon: Flame,
    title: "Streaks & XP",
    description:
      "Daily challenges, streak tracking, and unlockable themes — built to keep you coming back, not just once a week before an interview.",
  },
  {
    Icon: BarChart3,
    title: "Progress Analytics",
    description:
      "Topic-wise coverage heatmaps, difficulty breakdown, and solve velocity. Know exactly what's left.",
  },
  {
    Icon: Trophy,
    title: "Public Profile",
    tag: "Beta",
    description: `Share your solve history at ${SITE_DOMAIN}/u/yourname — consistency speaks louder than a resume line.`,
  },
];

// The one interview exchange every visitor is picturing when they read
// "AI mock interviews" — kept from the pre-redesign version essentially
// as-is, since it was already restrained (bordered mono block, no
// glow/pill), and echoes the same window-chrome/verdict register
// established by HeroTerminal and the Verification section's icons.
//
// Theme note (Phase 1): deliberately left as an intentional dark surface
// in both Black and White Mode, same reasoning as HeroTerminal/the Hero
// ProofCard — it's styled as a contained mono/console transcript, not a
// plain content card.
function InterviewSnippet() {
  return (
    <div className="mt-4 max-w-md space-y-2.5 rounded-xl border border-ink-700 bg-ink-900 p-3.5 font-mono-ui text-xs">
      <div className="flex items-center gap-1.5 text-zinc-500">
        <span className="h-1.5 w-1.5 rounded-full bg-verdict-pending" />
        AI interviewer · follow-up
      </div>
      <p className="leading-relaxed text-zinc-300">
        "Your solution is O(n²) — can you get to O(n) using a hash map?"
      </p>
    </div>
  );
}

function FeatureGrid() {
  return (
    <Reveal as="section" className="bg-[var(--surface)] px-6 py-20 md:px-12 md:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <p className="mb-4 font-mono-ui text-lp-label uppercase tracking-lp-label text-[var(--muted-foreground)]">
          What's included
        </p>
        <h2 className="text-lp-h2-detail font-display font-bold tracking-tight text-[var(--foreground)]">
          Everything you need. Nothing you don't.
        </h2>
        <p className="mt-4 text-[var(--muted-foreground)]">
          Built from scratch for placement-focused engineering students.
        </p>
      </div>

      <div className="mx-auto mt-12 grid max-w-4xl gap-4 sm:grid-cols-2">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className={`rounded-2xl border border-[var(--border-strong)] bg-[var(--background)] p-6 ${
              f.featured ? "sm:col-span-2" : ""
            }`}
          >
            <span
              className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-verdict-accept/10 text-[var(--accent-text)]"
              aria-hidden="true"
            >
              <f.Icon size={20} strokeWidth={2} />
            </span>
            <h3 className={`mt-4 font-display font-semibold text-[var(--foreground)] ${f.featured ? "text-lg" : ""}`}>
              {f.title}
              {f.tag && (
                <span className="ml-2 font-mono-ui text-[11px] uppercase tracking-lp-label text-[var(--muted-foreground)]">
                  · {f.tag}
                </span>
              )}
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-[var(--muted-foreground)]">{f.description}</p>
            {f.featured && <InterviewSnippet />}
          </div>
        ))}
      </div>
    </Reveal>
  );
}

export default FeatureGrid;