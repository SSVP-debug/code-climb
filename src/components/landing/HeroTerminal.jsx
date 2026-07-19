import { useEffect, useState } from "react";

const CODE_LINES = [
  "def twoSum(nums, target):",
  "    seen = {}",
  "    for i, num in enumerate(nums):",
  "        complement = target - num",
  "        if complement in seen:",
  "            return [seen[complement], i]",
  "        seen[num] = i",
  "    return []",
];
const FULL_CODE = CODE_LINES.join("\n");

const TEST_CASES = [
  { label: "Test 1 · [2,7,11,15], target=9", ms: 12 },
  { label: "Test 2 · [3,2,4], target=6", ms: 8 },
  { label: "Test 3 · [3,3], target=6", ms: 6 },
  { label: "Hidden · 47 more cases", ms: 22 },
];

const PHASE = { TYPING: "typing", RUNNING: "running", ACCEPTED: "accepted" };
const TYPE_SPEED_MS = 18;
const HOLD_ACCEPTED_MS = 3200;

function useCountUp(target, active, duration = 600) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active) return;
    const start = performance.now();
    let frame;
    const tick = (now) => {
      const progress = Math.min(1, (now - start) / duration);
      setValue(Math.round(target * progress));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, target, duration]);
  return value;
}

function HeroTerminal() {
  const [reduceMotion] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  const [phase, setPhase] = useState(reduceMotion ? PHASE.ACCEPTED : PHASE.TYPING);
  const [typedChars, setTypedChars] = useState(reduceMotion ? FULL_CODE.length : 0);
  const [passedTests, setPassedTests] = useState(reduceMotion ? TEST_CASES.length : 0);

  const runtime = useCountUp(48, phase === PHASE.ACCEPTED, 500);
  const memory = useCountUp(14, phase === PHASE.ACCEPTED, 500);
  const xp = useCountUp(50, phase === PHASE.ACCEPTED, 700);

  useEffect(() => {
    if (reduceMotion) return;
    let timers = [];

    function runCycle() {
      setPhase(PHASE.TYPING);
      setTypedChars(0);
      setPassedTests(0);

      for (let i = 1; i <= FULL_CODE.length; i++) {
        timers.push(
          setTimeout(() => setTypedChars(i), i * TYPE_SPEED_MS)
        );
      }

      const runStart = FULL_CODE.length * TYPE_SPEED_MS + 300;
      timers.push(setTimeout(() => setPhase(PHASE.RUNNING), runStart));

      TEST_CASES.forEach((_, idx) => {
        timers.push(
          setTimeout(() => setPassedTests(idx + 1), runStart + 400 + idx * 380)
        );
      });

      const acceptedAt = runStart + 400 + TEST_CASES.length * 380 + 200;
      timers.push(setTimeout(() => setPhase(PHASE.ACCEPTED), acceptedAt));

      timers.push(setTimeout(runCycle, acceptedAt + HOLD_ACCEPTED_MS));
    }

    runCycle();
    return () => timers.forEach(clearTimeout);
  }, [reduceMotion]);

  const visibleCode = FULL_CODE.slice(0, typedChars);

  return (
    <div className="relative">
      <div className="absolute inset-0 bg-verdict-accept/5 rounded-3xl blur-3xl scale-110 pointer-events-none lp-drift" />

      <div className="relative bg-ink-800 border border-ink-700 rounded-2xl overflow-hidden shadow-2xl font-mono-ui">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-ink-700 bg-ink-900">
          <span className="w-3 h-3 rounded-full bg-verdict-reject/60" />
          <span className="w-3 h-3 rounded-full bg-verdict-pending/60" />
          <span className="w-3 h-3 rounded-full bg-verdict-accept/60" />
          <span className="ml-3 text-xs text-zinc-500">two-sum.py</span>
          <span
            className={`ml-auto text-xs px-2 py-0.5 rounded-full font-semibold border transition-colors duration-300 ${
              phase === PHASE.ACCEPTED
                ? "bg-verdict-accept/10 text-verdict-accept border-verdict-accept/30"
                : phase === PHASE.RUNNING
                ? "bg-verdict-pending/10 text-verdict-pending border-verdict-pending/30"
                : "bg-zinc-800 text-zinc-500 border-zinc-700"
            }`}
          >
            {phase === PHASE.TYPING && "Editing"}
            {phase === PHASE.RUNNING && "Running"}
            {phase === PHASE.ACCEPTED && "Accepted"}
          </span>
        </div>

        <pre className="p-5 text-sm leading-relaxed overflow-x-auto min-h-[220px] text-zinc-300">
          <code>
            {visibleCode}
            {phase === PHASE.TYPING && <span className="lp-cursor text-verdict-accept">▍</span>}
          </code>
        </pre>

        <div className="border-t border-ink-700 bg-ink-900">
          {phase !== PHASE.TYPING && (
            <div className="px-5 py-3 space-y-1.5 border-b border-ink-700">
              {TEST_CASES.map((t, idx) => {
                const done = idx < passedTests;
                return (
                  <div
                    key={t.label}
                    className={`flex items-center justify-between text-xs transition-opacity duration-300 ${
                      done ? "opacity-100" : "opacity-30"
                    }`}
                  >
                    <span className="text-zinc-500">{t.label}</span>
                    <span className={done ? "text-verdict-accept" : "text-zinc-600"}>
                      {done ? `✓ ${t.ms}ms` : "·"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex items-center justify-between px-5 py-3 text-xs">
            <span className="text-zinc-500">
              Runtime: {phase === PHASE.ACCEPTED ? runtime : "—"}ms · Memory:{" "}
              {phase === PHASE.ACCEPTED ? memory : "—"}.0 MB
            </span>
            <span
              className={`font-semibold transition-opacity duration-300 ${
                phase === PHASE.ACCEPTED ? "opacity-100 text-verdict-accept" : "opacity-0"
              }`}
            >
              +{xp} XP earned
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HeroTerminal;