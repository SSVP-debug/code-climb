// ── Wrong-answer encouragement pool ─────────────────────────────────────────
// Shown on any non-Accepted submission (Wrong Answer, Runtime Error,
// Compilation Error, Time Limit Exceeded, Judge Error). Deliberately never
// hints at an algorithm, a better approach, or what went wrong technically
// — that's the job of the diff panel / error detail elsewhere in the UI.
// This pool exists purely to keep morale up. Add to it freely; nothing else
// needs to change — pickEncouragementMessage below just indexes into it.
export const WRONG_ANSWER_MESSAGES = [
  "Every accepted solution starts as a wrong answer.",
  "Debugging is where programmers grow.",
  "You're closer than you think.",
  "Keep experimenting. Progress comes from iteration.",
  "One failing test can teach more than ten passing ones.",
  "Stay curious. The next attempt might be the breakthrough.",
  "Every bug you squash makes you sharper.",
  "This is what practice looks like.",
  "Persistence beats perfection.",
  "You're doing the hard part right now — most people quit here.",
  "Progress isn't always visible, but it's happening.",
  "Great engineers aren't the ones who never fail a test case.",
  "Take a breath, re-read the problem, and try again.",
  "The gap between wrong and right is smaller than it feels.",
  "Keep going — this attempt taught you something the last one didn't.",
  "Nobody ships a first draft. Keep iterating.",
  "Every wrong answer rules something out — that's real progress.",
];

/**
 * Picks the encouragement message for a non-Accepted submission.
 *
 * - Resubmitting logically identical code (same normalized hash as the
 *   student's last non-Accepted attempt on this problem) reproduces the
 *   SAME message — repetition without a real new attempt shouldn't feel
 *   like arbitrary variety.
 * - A genuinely changed submission gets a different message than whatever
 *   was shown last (never repeats back-to-back).
 * - The very first wrong attempt on a problem picks a message
 *   deterministically from the hash, so reloading the page never changes
 *   what was already shown.
 *
 * @param {{ hash: string, previousHash: string|null, previousMessage: string|null }} args
 * @returns {string}
 */
export function pickEncouragementMessage({ hash, previousHash, previousMessage }) {
  const pool = WRONG_ANSWER_MESSAGES;

  if (previousHash && hash === previousHash && previousMessage) {
    return previousMessage;
  }

  const lastIndex = previousMessage ? pool.indexOf(previousMessage) : -1;

  if (lastIndex === -1) {
    const seed = hash ? parseInt(hash.slice(0, 8), 16) : Date.now();
    return pool[seed % pool.length];
  }

  // Pick uniformly among every index other than lastIndex.
  let nextIndex = Math.floor(Math.random() * (pool.length - 1));
  if (nextIndex >= lastIndex) nextIndex += 1;
  return pool[nextIndex];
}
