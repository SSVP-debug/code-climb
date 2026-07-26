import { useMemo, useRef } from "react";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import {
  LETTER_JOURNEY_FRAMES,
  LETTER_JOURNEY_TRANSCRIPT,
  CODECLUB_SLOTS,
} from "./letterJourneyFrames";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";

const FRAME_COUNT = LETTER_JOURNEY_FRAMES.length;
const VH_PER_FRAME = 70;
// Width (in frame-units) of the crossfade window at each end of a frame.
// The remaining 1 - 2*EDGE of a frame's budget is its untouched "hold" —
// time to actually read the sentence before the next one starts arriving.
const EDGE = 0.25;

const SPRING = { stiffness: 260, damping: 32, mass: 0.6 };

// One glyph within a hero word. No motion of its own — its parent frame
// block is what crossfades — it just picks a color depending on whether
// it's one of the letters the story is tracking.
function Glyph({ char, tracked, final }) {
  return (
    <span
      className={`inline-block font-bold tracking-tight ${
        final || tracked ? "text-[#c6ff3d]" : "text-zinc-700"
      }`}
    >
      {char}
    </span>
  );
}

// A single frame's sentence block. Always mounted; its opacity, blur and
// a small settle-in scale are all pure functions of `rawFrame` (scroll
// position expressed in frame units), so the crossfade is scrubbed
// exactly in step with the scroll gesture in either direction — no
// timers, no state, nothing that can fall out of sync or get caught
// mid-transition.
function FrameBlock({ frame, index, rawFrame }) {
  const isLast = index === FRAME_COUNT - 1;
  const start = index - EDGE;
  const holdStart = index;
  const holdEnd = index + (1 - EDGE);
  const end = isLast ? index + 1 : index + 1;

  const opacity = useSpring(
    useTransform(
      rawFrame,
      [start, holdStart, holdEnd, end],
      isLast ? [0, 1, 1, 1] : [0, 1, 1, 0],
      { clamp: true }
    ),
    SPRING
  );
  const scale = useSpring(
    useTransform(rawFrame, [start, holdStart], [0.96, 1], { clamp: true }),
    SPRING
  );

  return (
    <motion.div
      style={{ opacity, scale }}
      className="absolute inset-0 flex flex-col items-center justify-center px-6"
    >
      {frame.before && (
        <p className="font-display text-xl sm:text-2xl md:text-3xl text-zinc-500 mb-1 md:mb-2">
          {frame.before}
        </p>
      )}
      <span className="inline-flex flex-wrap justify-center leading-none text-[13vw] sm:text-6xl md:text-8xl">
        {frame.word.map((l, i) => (
          <Glyph key={i} char={l.char} tracked={l.tracked} final={frame.final} />
        ))}
      </span>
      {frame.after && (
        <p className="font-display text-xl sm:text-2xl md:text-3xl text-zinc-500 max-w-xl mt-1 md:mt-2 text-center">
          {frame.after}
        </p>
      )}
    </motion.div>
  );
}

// One letter in the accumulation stage at the bottom of the pinned frame.
// It fades and rises into place once scroll passes the frame that "earns"
// it, then stays — the running proof that small, separate moments are
// quietly building one bigger thing. Fully reversible: scroll back up
// and it recedes exactly as smoothly.
function AccumulatedLetter({ slot, rawFrame }) {
  const introAt = slot.introFrame + 0.55;
  const opacity = useSpring(
    useTransform(rawFrame, [introAt - 0.18, introAt + 0.02], [0, 1], { clamp: true }),
    SPRING
  );
  const y = useSpring(
    useTransform(rawFrame, [introAt - 0.18, introAt + 0.02], [12, 0], { clamp: true }),
    SPRING
  );
  const scale = useSpring(
    useTransform(rawFrame, [introAt - 0.18, introAt + 0.02], [0.8, 1], { clamp: true }),
    SPRING
  );

  return (
    <motion.span
      style={{ opacity, y, scale }}
      className="inline-block text-2xl sm:text-3xl md:text-4xl font-bold text-[#c6ff3d] w-[0.75em] text-center"
    >
      {slot.char}
    </motion.span>
  );
}

function ProgressDot({ index, rawFrame }) {
  const backgroundColor = useTransform(
    rawFrame,
    [index - 0.5, index - 0.49, index + 0.49, index + 0.5],
    ["#2a2f3a", "#c6ff3d", "#c6ff3d", "#2a2f3a"]
  );
  const scale = useTransform(
    rawFrame,
    [index - 0.5, index - 0.49, index + 0.49, index + 0.5],
    [1, 1.6, 1.6, 1]
  );
  return (
    <motion.span
      style={{ backgroundColor, scale }}
      className="w-1.5 h-1.5 rounded-full"
    />
  );
}

function AnimatedJourney() {
  const trackRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ["start start", "end end"],
  });
  // Smoothing the raw scroll signal irons out per-tick jitter from fast
  // wheel/trackpad input without introducing a fixed-duration lag — it's
  // still a direct, continuous function of scroll position.
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 300, damping: 40, mass: 0.3 });
  const rawFrame = useTransform(smoothProgress, (v) => v * FRAME_COUNT);

  const glowOpacity = useTransform(smoothProgress, [0, 0.75, 1], [0.08, 0.16, 0.3]);
  const taglineOpacity = useSpring(
    useTransform(rawFrame, [FRAME_COUNT - 0.45, FRAME_COUNT - 0.15], [0, 1], { clamp: true }),
    SPRING
  );

  return (
    <section
      aria-label="How Code Club is built, one habit at a time"
      className="relative"
    >
      <div className="sr-only">
        {LETTER_JOURNEY_TRANSCRIPT.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>

      <div
        ref={trackRef}
        style={{ height: `${FRAME_COUNT * VH_PER_FRAME}vh` }}
        className="relative"
        aria-hidden="true"
      >
        <div className="sticky top-0 h-screen flex items-center justify-center overflow-hidden px-6">
          <motion.div
            className="pointer-events-none absolute inset-0"
            style={{
              opacity: glowOpacity,
              background:
                "radial-gradient(60% 45% at 50% 45%, #c6ff3d 0%, transparent 70%)",
            }}
          />

          <div className="hidden md:flex flex-col gap-3 absolute right-8 top-1/2 -translate-y-1/2">
            {LETTER_JOURNEY_FRAMES.map((f, i) => (
              <ProgressDot key={f.id} index={i} rawFrame={rawFrame} />
            ))}
          </div>

          <div className="relative w-full max-w-4xl mx-auto h-64 sm:h-56 md:h-52">
            {LETTER_JOURNEY_FRAMES.map((frame, i) => (
              <FrameBlock key={frame.id} frame={frame} index={i} rawFrame={rawFrame} />
            ))}
          </div>

          <div className="absolute bottom-[14%] sm:bottom-[16%] left-0 right-0 flex flex-col items-center gap-4">
            <div className="flex items-center justify-center gap-1 sm:gap-1.5">
              {CODECLUB_SLOTS.map((slot, i) => (
                <AccumulatedLetter key={i} slot={slot} rawFrame={rawFrame} />
              ))}
            </div>
            <motion.p
              style={{ opacity: taglineOpacity }}
              className="font-mono-ui text-sm md:text-base text-zinc-400"
            >
              {LETTER_JOURNEY_FRAMES[FRAME_COUNT - 1].tagline}
            </motion.p>
          </div>
        </div>
      </div>
    </section>
  );
}

// Reduced-motion fallback: the same story, stacked and simply present —
// no pinning, no scroll-scrubbed transforms.
function StaticJourney() {
  return (
    <section
      aria-label="How Code Club is built, one habit at a time"
      className="max-w-3xl mx-auto px-6 py-20 space-y-14 text-center"
    >
      {LETTER_JOURNEY_FRAMES.map((frame) => (
        <div key={frame.id}>
          {frame.before && (
            <p className="font-display text-xl text-zinc-500">{frame.before}</p>
          )}
          <p className="font-display text-4xl md:text-5xl font-bold tracking-tight text-[#c6ff3d]">
            {frame.word.map((l) => l.char).join("")}
          </p>
          {frame.after && (
            <p className="font-display text-xl text-zinc-500 max-w-xl mx-auto">
              {frame.after}
            </p>
          )}
          {frame.final && (
            <p className="font-mono-ui text-sm text-zinc-400 mt-3">{frame.tagline}</p>
          )}
        </div>
      ))}
    </section>
  );
}

function LetterJourney() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const Journey = useMemo(
    () => (prefersReducedMotion ? StaticJourney : AnimatedJourney),
    [prefersReducedMotion]
  );
  return <Journey />;
}

export default LetterJourney;