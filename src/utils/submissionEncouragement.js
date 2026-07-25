// ── Accepted-submission encouragement pool ──────────────────────────────────
// Shown inside SubmissionCelebrationModal on every Accepted result. Unlike
// the wrong-answer pool (backend/utils/encouragementMessages.js), this one
// has no dedupe requirement — the spec only asks that it vary, never that
// repeats be suppressed — so it's picked client-side with no persistence.
// Add to it freely; nothing else needs to change.
export const ACCEPTED_MESSAGES = [
  "Great work!",
  "You're building real consistency.",
  "Another problem conquered.",
  "Nice progress today.",
  "Keep the momentum going.",
  "Small wins become big skills.",
  "That's one more pattern locked in.",
  "Consistency compounds — keep at it.",
  "Well solved.",
  "You showed up and figured it out.",
  "That's how skill gets built, one problem at a time.",
  "Solid work — onward.",
];

/**
 * Deterministically picks a message from a seed string (typically the
 * submissionId) so the same Accepted result always shows the same message
 * even if the modal re-renders — but a genuinely new submission (new
 * submissionId) gets a fresh pick.
 */
export function pickAcceptedMessage(seed) {
  const pool = ACCEPTED_MESSAGES;
  if (!seed) return pool[Math.floor(Math.random() * pool.length)];

  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return pool[Math.abs(hash) % pool.length];
}
