import mongoose from "mongoose";

/**
 * FeatureRequest.js — Phase 5 (Feature Requests).
 *
 * See plans/005-feature-requests-scoping.md for the full scoping
 * writeup. Decided by Bunny this session: a public suggestion box (not
 * an admin-only intake form), open to any authenticated role (not
 * student-only, unlike Contribution/Credits), with upvoting as a core
 * mechanic, not a later add-on.
 *
 * ── Human-readable ID ───────────────────────────────────────────────────
 * `ccId` (e.g. "FR/001") mirrors Opportunity.js's own `ccId`/`ccNumber`
 * convention (same Counter.js-backed atomic allocation), using an "FR/"
 * prefix rather than reusing Opportunity's "CC/" — the two are
 * unrelated public identifier spaces and sharing a prefix would make a
 * request and an opportunity confusable in support conversations. See
 * services/featureRequests.js's createFeatureRequest() for allocation.
 *
 * ── Status lifecycle ──────────────────────────────────────────────────
 *   "open"        — submitted, publicly visible, votable, editable by
 *                    its own submitter. The only mutable state, both
 *                    for the submitter (edit/withdraw) and for an admin
 *                    (can move it forward or decline it).
 *   "planned"     — an admin has committed to building it. Still votable,
 *                    no longer editable by the submitter.
 *   "in_progress" — actively being worked on.
 *   "shipped"     — terminal. Triggers a reward-issuance attempt for the
 *                   original submitter (see services/featureRequests.js's
 *                   updateFeatureRequestStatus()) — reward outcome
 *                   tracked separately in `rewardStatus`, same
 *                   pending/issued/skipped_unconfigured/failed split
 *                   Contribution.js and ReferralQualification.js both
 *                   already use for their own "did the token side of
 *                   this actually land" question.
 *   "declined"    — terminal. An admin decided against it. Never issues
 *                   a reward. Reachable from "open" or "planned".
 *   "withdrawn"   — terminal. The submitter pulled their own request
 *                   while it was still "open" — distinct from
 *                   "declined" so the history is honest about who made
 *                   the call. Never issues a reward.
 * This five/six-state shape (vs. Contribution's binary
 * approved/rejected) is a judgment call, not a product decision Bunny
 * was asked about — flagged in plans/005-feature-requests-scoping.md,
 * decided there rather than left open, since a public roadmap board
 * genuinely needs a "still being considered" middle, unlike a one-shot
 * admin review queue.
 */
const featureRequestSchema = new mongoose.Schema(
  {
    ccId: { type: String, required: true, unique: true }, // "FR/001"
    ccNumber: { type: Number, required: true, unique: true }, // 1, 2, 3... (sortable)

    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, required: true, trim: true, maxlength: 5000 },

    status: {
      type: String,
      enum: ["open", "planned", "in_progress", "shipped", "declined", "withdrawn"],
      default: "open",
      index: true,
    },

    // Denormalized, not computed at read time — see the scoping doc's
    // "voting mechanics" section for why (a public list page sorts/
    // displays many requests by vote count at once; re-aggregating
    // FeatureRequestVote per row on every page load doesn't scale the
    // way it does for a single-row Credits-balance lookup). Kept in
    // sync exclusively by services/featureRequests.js's vote/unvote
    // path via $inc — never written to directly by any other caller.
    voteCount: { type: Number, default: 0, min: 0 },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reviewedAt: { type: Date, default: null },

    // Same three-outcome (plus "pending") shape Contribution.js's
    // rewardStatus already uses, applied to the one status transition
    // here that can trigger a reward: reaching "shipped".
    rewardStatus: {
      type: String,
      enum: ["pending", "issued", "skipped_unconfigured", "failed"],
      default: "pending",
    },
  },
  { timestamps: true }
);

// ── Indexes ───────────────────────────────────────────────────────────────

// Public board: browse by status, sorted by votes (default) or recency.
featureRequestSchema.index({ status: 1, voteCount: -1 });
featureRequestSchema.index({ status: 1, createdAt: -1 });

// Submitter's own "my requests" view.
featureRequestSchema.index({ submittedBy: 1, createdAt: -1 });

// Reward-retry reconciliation query, same shape as Contribution's and
// ReferralQualification's identical { status, rewardStatus } index —
// "every shipped row whose reward hasn't successfully issued yet."
featureRequestSchema.index({ status: 1, rewardStatus: 1 });

export default mongoose.model("FeatureRequest", featureRequestSchema);