import Contest from "../models/Contest.js";

// ── Contest scoring ────────────────────────────────────────────────────────
// Fest Readiness Audit, P0-1: contest scoring must be a consequence of a
// server-verified Accepted submission, never a bare client claim.
//
// This module is the SOLE place Contest.participants[].score/solvedSlugs is
// mutated — mirrors submissionController.recordVerifiedSubmission's "one
// authoritative writer" pattern for Submission documents. It has exactly
// two callers:
//   1. controllers/judgeController.js's submitHandler — the TRUSTED path.
//      It calls this immediately after computing a real Accepted verdict
//      itself, so by construction the solve is genuine; no further proof
//      is needed here.
//   2. routes/contests.js's legacy POST /:id/solve endpoint — kept only
//      for callers that haven't migrated off it yet. That route must
//      independently prove a real Accepted Submission exists (see its own
//      comment) before calling this function — this module does NOT do
//      that proof-checking itself, because it has no way to know whether
//      its caller already established it or not. Never call this from
//      anywhere else without that same guarantee.
//
// What this function DOES enforce, unconditionally, for every caller:
// the CONTEST's own rules — the participant actually joined, the problem
// actually belongs to the contest, and the contest is currently active by
// authoritative server time (never a client-sent status or clock).

export const CONTEST_SOLVE_SCORE = 100;

export const CONTEST_SOLVE_REJECTION = Object.freeze({
  NOT_FOUND: "contest_not_found",
  NOT_ACTIVE: "contest_not_active",
  NOT_IN_CONTEST: "problem_not_in_contest",
  NOT_JOINED: "not_joined",
});

/**
 * Recomputes a contest's status from startsAt/endsAt against the current
 * server clock — never trusts a possibly-stale `status` field on the
 * document itself (that field is only rewritten opportunistically on a
 * couple of read routes). Mirrors routes/contests.js's own
 * syncContestStatus/inline equivalents; kept independent (not imported)
 * since routes/contests.js works with a full Mongoose document in some
 * spots and a `.lean()` plain object in others, and this only needs the
 * two timestamp fields either way.
 */
function computeContestStatus(contest) {
  const now = new Date();
  if (now < new Date(contest.startsAt)) return "upcoming";
  if (now > new Date(contest.endsAt)) return "ended";
  return "active";
}

/**
 * Atomically marks a contest problem solved for a participant and awards
 * score, exactly once per (contest, participant, problem slug).
 *
 * Returns `{ ok: true, alreadySolved, score }` on success (including the
 * idempotent "already solved" case — that's a successful no-op, not an
 * error), or `{ ok: false, reason }` (one of CONTEST_SOLVE_REJECTION) when
 * the contest's own rules aren't satisfied. Never throws for those
 * expected rejection cases — only for genuine unexpected errors (e.g. the
 * database call itself failing), which callers should catch separately.
 */
export async function awardContestSolve({ contestId, userId, slug }) {
  const contest = await Contest.findById(contestId);
  if (!contest) {
    return { ok: false, reason: CONTEST_SOLVE_REJECTION.NOT_FOUND };
  }

  if (computeContestStatus(contest) !== "active") {
    return { ok: false, reason: CONTEST_SOLVE_REJECTION.NOT_ACTIVE };
  }

  if (!contest.problemSlugs.includes(slug)) {
    return { ok: false, reason: CONTEST_SOLVE_REJECTION.NOT_IN_CONTEST };
  }

  const isParticipant = contest.participants.some(
    (p) => p.userId.toString() === userId.toString()
  );
  if (!isParticipant) {
    return { ok: false, reason: CONTEST_SOLVE_REJECTION.NOT_JOINED };
  }

  // Atomic update: the filter only matches this participant subdocument
  // when they haven't already solved this slug, so two concurrent award
  // attempts (e.g. a duplicate Accepted submission, or a network retry)
  // can't both push the slug or double-award points. See the original
  // POST /:id/solve implementation this was extracted from for the same
  // race-condition reasoning.
  const updated = await Contest.findOneAndUpdate(
    {
      _id: contestId,
      participants: { $elemMatch: { userId, solvedSlugs: { $ne: slug } } },
    },
    {
      $push: { "participants.$.solvedSlugs": slug },
      $inc: { "participants.$.score": CONTEST_SOLVE_SCORE },
    },
    { new: true }
  );

  if (!updated) {
    // Lost the race to a concurrent award for this exact slug, or it was
    // already solved earlier this contest — either way, "already solved"
    // is the correct, successful outcome, not an error.
    const current = await Contest.findById(contestId).lean();
    const currentParticipant = current?.participants.find(
      (p) => p.userId.toString() === userId.toString()
    );
    return {
      ok: true,
      alreadySolved: true,
      score: currentParticipant?.score ?? null,
    };
  }

  const updatedParticipant = updated.participants.find(
    (p) => p.userId.toString() === userId.toString()
  );
  return { ok: true, alreadySolved: false, score: updatedParticipant.score };
}
