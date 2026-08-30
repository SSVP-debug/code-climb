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
 * ── SCOPING NOTE, UPDATED — kind taxonomy decided this session ────────────
 * docs/roadmap.md was empty and no prior session had a spec for what a
 * "Contribution" concretely is on this platform. Through batches 1–3
 * this model stayed deliberately generic (`kind` an open string,
 * `payload` unvalidated) rather than guess. Bunny has since decided the
 * first two supported kinds explicitly: "new_problem" (a full problem
 * submission) and "testcase_improvement" (additional/better testcases
 * for an existing problem). `kind` is now a closed enum (below) and
 * `payload`'s shape is validated per-kind at the API boundary by
 * schemas/contributionSchema.js's discriminated union — see that file
 * for the actual field-level shapes. A third kind can be added later by
 * extending both that enum and that union together; this model does not
 * need to change beyond the enum list itself.
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

    // Closed enum as of this session — see PROGRESS.md's Phase 2F "kind
    // taxonomy decision" entry for the full history. Was an open string
    // through batches 1–3 while no product decision existed; Bunny
    // decided the first two supported kinds explicitly. Adding a third
    // kind later requires a one-line change here (and a corresponding
    // branch in schemas/contributionSchema.js's discriminated union) —
    // a small, deliberate cost in exchange for the DB actually rejecting
    // a malformed/typo'd kind value instead of silently accepting it.
    kind: {
      type: String,
      required: true,
      trim: true,
      enum: ["new_problem", "testcase_improvement"],
    },

    // Freeform, kind-shaped content at the Mongoose layer — still
    // Mixed, NOT split into per-kind Mongoose sub-schemas, because the
    // two kinds' shapes have nothing in common structurally (a full
    // problem draft vs. a testcase diff against an existing slug) and a
    // Mongoose-level discriminator would just duplicate what
    // schemas/contributionSchema.js's Zod discriminated union
    // (NewProblemPayloadSchema / TestcaseImprovementPayloadSchema)
    // already validates at the API boundary, before a document is ever
    // created — see that file for the actual shape enforcement.
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