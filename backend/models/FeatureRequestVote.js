import mongoose from "mongoose";

/**
 * FeatureRequestVote.js — Phase 5 (Feature Requests).
 *
 * One row per (featureRequestId, userId) — the actual enforcement of
 * "exactly one vote per user per request" is the compound unique index
 * below, not an application-level check-then-act. Same idempotency idiom
 * RewardLedger.js's own { sourceType, sourceId, userId, type } unique
 * index already establishes, applied here to votes instead of reward
 * grants: a losing concurrent "vote" attempt hits E11000 and is treated
 * as a no-op by services/featureRequests.js, never a second row.
 *
 * Deliberately its own collection rather than an array field embedded on
 * FeatureRequest — an embedded array has no way to express "at most one
 * entry per userId" as a DB-level constraint (Mongoose/MongoDB don't
 * support a uniqueness constraint on array elements), which would push
 * the exactly-once guarantee back onto application logic and reintroduce
 * the exact TOCTOU race this file's index is meant to close.
 */
const featureRequestVoteSchema = new mongoose.Schema(
  {
    featureRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FeatureRequest",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// The actual "one vote per user per request" enforcement.
featureRequestVoteSchema.index({ featureRequestId: 1, userId: 1 }, { unique: true });

// "Did this user vote on any of these requests" lookups (list-page
// vote-state hydration, batch 2's job) and "all votes on this request"
// (unlikely to be queried directly today, since voteCount is
// denormalized, but kept for reconcileVoteCount()'s future
// countDocuments() self-heal — see the scoping doc).
featureRequestVoteSchema.index({ userId: 1, featureRequestId: 1 });

export default mongoose.model("FeatureRequestVote", featureRequestVoteSchema);