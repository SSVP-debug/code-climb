import User from "../models/User.js";

/**
 * Persist subscription-related fields.
 *
 * For now, User remains the source of truth.
 * This abstraction exists so a future UserSubscription model
 * can be introduced without changing route handlers.
 */
export async function saveSubscription(userId, patch) {
  return User.updateOne(
    { _id: userId },
    {
      $set: patch,
    }
  );
}

/**
 * saveSubscriptionIfMatch — atomic conditional variant of saveSubscription,
 * for callers that need "set this only if the current state is still what
 * I last read" without a separate check-then-act round trip.
 *
 * Added for Referral Qualification (Plan 2, race-condition fix): the
 * existing POST /api/referral/apply handler previously did
 * `if (req.userDoc.referredBy) return 400` followed by a plain
 * saveSubscription() call — a real check-then-act race, since two
 * concurrent /apply requests could both read referredBy as null before
 * either write landed. This closes that race the same way the rest of
 * this codebase closes similar ones (see services/contestScoring.js's
 * awardContestSolve, services/battleRoomScoring.js's milestone claim):
 * an atomic MongoDB update with the precondition baked into the filter,
 * not a MongoDB transaction.
 *
 * @param {string|import("mongoose").Types.ObjectId} userId
 * @param {Object} matchPatch - additional filter conditions the document
 *   must currently satisfy (merged with `_id: userId`) for the update to
 *   apply — e.g. `{ referredBy: null }`.
 * @param {Object} setPatch - fields to $set if the match succeeds.
 * @returns {Promise<import("mongoose").Document|null>} the updated
 *   document if the match succeeded, or null if a concurrent write had
 *   already changed the matched fields first (the caller's "already
 *   applied" / "lost the race" case).
 */
export async function saveSubscriptionIfMatch(userId, matchPatch, setPatch) {
  return User.findOneAndUpdate(
    { _id: userId, ...matchPatch },
    { $set: setPatch },
    { new: true }
  );
}