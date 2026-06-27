import { useEffect, useState } from "react";

const TOUR_KEY = "cc_tour_v1_done";

const STEPS = [
  {
    id: "welcome",
    title: "Welcome to Code Club 👋",
    body: "You've picked your universe. Now let's crack some problems. Here's a quick 30-second tour.",
  },
  {
    id: "problems",
    title: "Your problem set 🧩",
    body: "Click Problems in the navbar to see all DSA problems. Filter by topic, difficulty, or hide the ones you've already solved.",
  },
  {
    id: "streak",
    title: "Build a daily streak 🔥",
    body: "Solve at least one problem every day to build your streak. It shows in the navbar — keep it alive.",
  },
  {
    id: "ai",
    title: "AI coaching is live 🤖",
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
        className="relative bg-zinc-900 border border-zinc-700 rounded-2xl p-7 max-w-sm w-full mx-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex gap-1.5 mb-5">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={`h-1 rounded-full transition-all ${
                i === step ? "w-6 bg-green-500" : "w-2 bg-zinc-700"
              }`}
            />
          ))}
        </div>
        <h3 className="text-lg font-bold text-white mb-2">{current.title}</h3>
        <p className="text-sm text-zinc-400 leading-relaxed mb-6">{current.body}</p>
        <div className="flex items-center justify-between">
          <button onClick={dismiss} className="text-xs text-zinc-500 hover:text-zinc-300 transition">
            Skip tour
          </button>
          <button
            onClick={next}
            className="bg-green-600 hover:bg-green-500 text-white text-sm font-semibold px-5 py-2 rounded-xl transition"
          >
            {step < STEPS.length - 1 ? "Next →" : "Let's go →"}
          </button>
        </div>
      </div>
    </div>
  );
}
