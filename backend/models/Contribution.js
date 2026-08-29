import mongoose from "mongoose";

/**
 * Contribution.js — Contribution Infrastructure (Phase 2F).
 *
 * ── Why this exists, and why it's being built now ─────────────────────────
 * services/rewardPolicyService.js's issueContributionApprovedReward() has
 * existed since Phase 2's Reward Policy Layer, doc-commented as
 * "called by the (future, Plan 3) contribution-approval controller ...
 * Not implemented/wired yet." config/rewardPolicy.js already has a
 * REWARD_POLICY_KEYS.CONTRIBUTION_APPROVED policy key and
 * REWARD_AMOUNT_CONTRIBUTION_APPROVED env var. models/RewardLedger.js's
 * sourceType enum already includes "CONTRIBUTION". This model is the
 * missing piece those three already assume exists: something with a
 * contributorId and an _id that can transition to "approved" and call
 * that already-built reward hook.
 *
 * ── SCOPING NOTE — flagged, not silently decided ──────────────────────────
 * docs/roadmap.md is currently empty and no prior session left a spec for
 * what a "Contribution" concretely IS on this platform (a new problem
 * submission? a testcase improvement? editorial content? a bug report?).
 * config/rewardPolicy.js's own comment gestures at two examples —
 * "new_problem" vs "testcase_improvement" possibly warranting different
 * reward amounts — but that's an illustrative aside, not a decision.
 * Rather than invent a specific content type and its type-specific
 * validation (a real product decision that belongs to Bunny, and that
 * Phase 7 "Problem/Content Scaling" — still ⛔ Not started per
 * PROGRESS.md — will likely need to weigh in on too), this model stays
 * deliberately generic:
 *   - `kind` is an open, trimmed string, NOT a closed enum. Any specific
 *     contribution type can be introduced later without a schema/migration
 *     change — just start writing a new kind value. Once a first concrete
 *     kind is actually decided, PROGRESS.md should note it and this field
 *     can be tightened to an enum at that point (noted there, not here,
 *     per this file's own "don't invent decisions" stance).
 *   - `payload` is a freeform Mixed object, shaped however the specific
 *     kind needs (e.g. a problem draft vs. a testcase diff have nothing in
 *     common structurally). No validation is applied here on its shape —
 *     that's the future kind-specific controller's job, not this model's.
 * What IS decided here (because it's inferable directly from what
 * already exists and already depends on it, not guessed): the review
 * lifecycle shape and the reward-linkage shape, both of which mirror
 * ReferralQualification.js's own conventions exactly, since that's the
 * only other "user action -> admin-reviewed -> RewardLedger" flow in this
 * codebase and there's no reason for a second, different shape.
 *
 * ── Status lifecycle ───────────────────────────────────────────────────────
 *   "pending"   — submitted, awaiting admin review. The only mutable state.
 *   "approved"  — an admin approved it. Terminal. Triggers a reward-issuance
 *                 attempt (see services/contribution.js's
 *                 approveContribution()) — reward outcome tracked
 *                 separately in `rewardStatus` below, same separation
 *                 ReferralQualification draws between `status` (the
 *                 qualification event) and `rewardStatus` (whether the
 *                 token side of it actually landed).
 *   "rejected"  — an admin rejected it. Terminal; never issues a reward.
 * No re-review path exists in this phase (an admin can't reverse an
 * approve/reject) — same "no reversal flow built yet" posture
 * RewardLedger.js's own header comment takes for its `status: "reversed"`
 * field: reserved conceptually, not acted on until a real need exists.
 */
const contributionSchema = new mongoose.Schema(
  {
    contributorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Open string, deliberately not a closed enum — see the scoping note
    // above. Whatever creates a Contribution is responsible for choosing
    // a stable, meaningful value here (e.g. "new_problem",
    // "testcase_improvement") — this model does not police it.
    kind: {
      type: String,
      required: true,
      trim: true,
    },

    // Freeform, kind-shaped content. No schema-level validation — see the
    // scoping note above for why that's intentional here, not an oversight.
    payload: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    reviewedAt: {
      type: Date,
      default: null,
    },

    // Populated only when status === "rejected" — human-readable audit
    // trail, same role ReferralQualification.ineligibleReason plays for
    // its own terminal negative state.
    rejectionReason: {
      type: String,
      default: null,
    },

    // Which Contribution._id ends up as RewardLedger's sourceId once
    // issued — this field just names that clearly for readers; the
    // actual value used at issuance time is this document's own _id
    // (see services/contribution.js's approveContribution()).
    //
    // "pending"              — not approved yet, or approved but a reward
    //                          attempt hasn't run yet (should be
    //                          extremely transient once approved — see
    //                          "failed" below for what persists if an
    //                          attempt was made and errored).
    // "issued"                — services/rewardPolicyService.js's
    //                           issueContributionApprovedReward() reported
    //                           issued: true (a RewardLedger row was
    //                           actually written).
    // "skipped_unconfigured"  — approved, but REWARD_AMOUNT_CONTRIBUTION_APPROVED
    //                           was not set at issuance time. Distinct
    //                           from "pending" so it's auditable —
    //                           mirrors ReferralQualification's identical
    //                           distinction and identical reasoning (see
    //                           that model's own comment).
    // "failed"                 — approved, and a reward-issuance attempt
    //                            was made but threw an unexpected error
    //                            (e.g. a real DB failure, not a policy
    //                            configuration gap). Retryable in the
    //                            same shape ReferralQualification's
    //                            retryPendingReferralRewards() already
    //                            uses — RewardLedger's own idempotency
    //                            (unique sourceType+sourceId+userId+type
    //                            index) is what makes any future retry
    //                            safe, not anything in this model.
    //
    // Deliberately NOT the source of financial truth — RewardLedger
    // remains that. This is a read-side status for this row only.
    rewardStatus: {
      type: String,
      enum: ["pending", "issued", "skipped_unconfigured", "failed"],
      default: "pending",
    },
  },
  { timestamps: true }
);

// ── Indexes ───────────────────────────────────────────────────────────────

// Contributor's own submission history / "my contributions" view.
contributionSchema.index({ contributorId: 1, status: 1 });

// Admin review queue: "every pending contribution, oldest first" — status
// is the selective leading field (the overwhelming majority of rows are
// terminal — approved or rejected — once the queue is kept up with);
// createdAt (via timestamps) is used for ordering, not filtering, so it
// isn't part of this index.
contributionSchema.index({ status: 1, createdAt: 1 });

// Reward-retry reconciliation query, mirroring ReferralQualification's
// identical { status, rewardStatus } index and identical reasoning —
// "every approved row whose reward hasn't successfully issued yet."
contributionSchema.index({ status: 1, rewardStatus: 1 });

export default mongoose.model("Contribution", contributionSchema);