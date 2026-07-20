import { useEffect, useState } from "react";
import Button from "../ui/Button";
import { Sparkles, ListChecks, Flame, Brain } from "lucide-react";

const TOUR_KEY = "cc_tour_v1_done";

const STEPS = [
  {
    id: "welcome",
    Icon: Sparkles,
    title: "Welcome to Code Club",
    body: "You've picked your universe. Now let's crack some problems. Here's a quick 30-second tour.",
  },
  {
    id: "problems",
    Icon: ListChecks,
    title: "Your problem set",
    body: "Click Problems in the navbar to see all DSA problems. Filter by topic, difficulty, or hide the ones you've already solved.",
  },
  {
    id: "streak",
    Icon: Flame,
    title: "Build a daily streak",
    body: "Solve at least one problem every day to build your streak. It shows in the navbar — keep it alive.",
  },
  {
    id: "ai",
    Icon: Brain,
    title: "AI coaching is live",
    body: "Head to Analytics any time to get Claude-powered insights on your weak topics and what to practice next.",
  },
];

export default function OnboardingTour() {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(TOUR_KEY)) {
        const t = setTimeout(() => setVisible(true), 1500);
        return () => clearTimeout(t);
      }
    } catch {}
  }, []);

  function dismiss() {
    try { localStorage.setItem(TOUR_KEY, "1"); } catch {}
    setVisible(false);
  }

  function next() {
    if (step < STEPS.length - 1) setStep((s) => s + 1);
    else dismiss();
  }

  if (!visible) return null;

  const current = STEPS[step];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={dismiss}
    >
      <div
        className="relative bg-ink-900 border border-ink-700 rounded-2xl p-7 max-w-sm w-full mx-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex gap-1.5 mb-5">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={`h-1 rounded-full transition-all ${
                i === step ? "w-6 bg-verdict-accept" : "w-2 bg-ink-700"
              }`}
            />
          ))}
        </div>
        <div className="w-11 h-11 rounded-xl bg-verdict-accept/10 text-verdict-accept flex items-center justify-center mb-4">
          <current.Icon size={22} strokeWidth={2} aria-hidden="true" />
        </div>
        <h3 className="text-lg font-bold text-white mb-2">{current.title}</h3>
        <p className="text-sm text-zinc-400 leading-relaxed mb-6">{current.body}</p>
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={dismiss}>
            Skip tour
          </Button>
          <Button size="sm" onClick={next}>
            {step < STEPS.length - 1 ? "Next →" : "Let's go →"}
          </Button>
        </div>
      </div>
    </div>
  );
}