import mongoose from "mongoose";

/**
 * ReferralQualification.js — Referral Qualification layer (Plan 2).
 *
 * ── Why this is a NEW, separate model, not a rewrite of anything ─────────
 * Inspection of the existing codebase found the referral system already
 * has TWO different definitions of "referred," neither of which is
 * "first accepted submission," and both of which stay completely
 * untouched by this model:
 *
 *   1. routes/billing.js's day-bonus reward — only fires when the
 *      REFERRED user completes a paid Razorpay subscription. A referral
 *      that never converts to Pro rewards no one, ever, under that path.
 *   2. routes/ambassador.js's milestone `referredCount` — counts every
 *      account with `User.referredBy` set, the moment POST /api/referral/
 *      apply runs, with NO qualification gate at all.
 *
 * This model adds a THIRD, engagement-gated definition — "the referred
 * user solved a problem" — used exclusively to drive the new token
 * RewardLedger via services/rewardPolicyService.js. It does not read,
 * write, or influence User.referredBy, User.referralRewardDays, or
 * Ambassador.milestonesClaimed in any way.
 *
 * ── Why a separate model instead of reusing User.referredBy ──────────────
 * `User.referredBy` stores a bare code string with only an
 * application-level "already applied" check (routes/referral.js) — real,
 * but not race-proof, and with no qualification/timestamp/reward-status
 * fields at all. This model adds exactly those, as a dedicated row per
 * referred user, without touching the existing field's shape or the
 * existing systems that read it.
 *
 * ── Timing rule (Plan 2 refinement): referral must be applied BEFORE the
 *    referred user's first accepted practice solve ────────────────────────
 * Chosen over "can qualify retroactively" because (a) it matches how
 * /apply is actually called in this product — routes/referral.js's own
 * comment and the frontend (src/pages/LoginPage.jsx) both confirm it
 * fires once, right after first login, essentially always before any
 * problem-solving is even possible — so this is enforcing the ALREADY
 * intended flow, not inventing a new restriction; and (b) allowing
 * retroactive qualification would let a user rack up organic solving
 * activity with no referral influence at all, then attach a friend's code
 * afterward purely to farm two token rewards for activity the referral
 * had zero causal role in — exactly the "attaching referrals after
 * arbitrary historical activity" abuse case called out when this was
 * evaluated. See services/referralQualification.js for the enforcement
 * (checked once, at /apply time, via a query against Submission — not a
 * new persistent business-rule engine).
 *
 * ── Scope rule (Plan 2 refinement): PRACTICE solves only ──────────────────
 * "Qualified" specifically means the referred user's first accepted
 * PRACTICE submission (no contestId, no battleRoomId) — a contest or
 * Battle Room Accepted submission does not trigger this at all. See
 * services/referralQualification.js's module comment for the full
 * reasoning; this model has no separate field for it since it's enforced
 * entirely in that service's Submission query, not stored here.
 */
const referralQualificationSchema = new mongoose.Schema(
  {
    referrerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // UNIQUE — this is the actual "one referrer per account" enforcement
    // for the qualification/reward track. A DB constraint, not just the
    // application-level `if (req.userDoc.referredBy)` check that
    // routes/referral.js's /apply already has (real, but not race-proof
    // against two concurrent /apply calls before either write lands).
    referredUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    // Denormalized copy of the code at the time /apply ran — codes aren't
    // mutable today (routes/referral.js's getOrCreateReferralCode never
    // regenerates once set), so this never drifts, but copying it avoids
    // a join for display/audit purposes.
    referralCodeUsed: {
      type: String,
      required: true,
      trim: true,
    },

    // ── Lifecycle state (Plan 2 refinement) ─────────────────────────────
    // Explicit state machine, added to fix a real (if not reward-unsafe)
    // representational bug: a referral applied AFTER the referred user
    // already had an accepted practice solve could previously never
    // qualify (the underlying count-based check already prevented that
    // correctly — see services/referralQualification.js) but the row
    // would sit at qualifiedAt: null forever with no way to tell "hasn't
    // happened yet" apart from "structurally can never happen." This
    // field makes that distinction explicit and auditable instead of
    // silent.
    //
    //   "pending"    — created, awaiting a qualifying first accepted
    //                  practice solve (see the qualification-scope
    //                  decision below).
    //   "qualified"   — the qualifying event fired; qualifiedAt is set.
    //   "ineligible"  — determined, at creation time, to be structurally
    //                   unable to ever qualify (the referred user already
    //                   had at least one accepted practice submission
    //                   BEFORE this referral was applied — see the
    //                   business-rule decision in services/
    //                   referralQualification.js's module comment).
    //                   Terminal; never transitions further.
    status: {
      type: String,
      enum: ["pending", "qualified", "ineligible"],
      default: "pending",
    },

    // Populated only when status === "ineligible" — human-readable audit
    // trail for why this referral was marked dead-on-arrival.
    ineligibleReason: {
      type: String,
      default: null,
    },

    // ── Qualification scope decision (Plan 2 refinement) ─────────────────
    // Only a PRACTICE Accepted submission (no contestId, no battleRoomId)
    // counts toward qualification — see services/referralQualification.js's
    // module comment for the full "why" and the architecture-safety
    // analysis. This model doesn't need its own field for that; it's
    // enforced entirely in the query services/referralQualification.js
    // runs against Submission.
    qualifiedAt: {
      type: Date,
      default: null,
    },

    // Which Accepted Submission triggered qualification — audit trail
    // only, not used for any further lookup.
    qualificationSourceSubmissionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Submission",
      default: null,
    },

    // "pending"              — qualified, reward not yet attempted (should
    //                           be extremely transient — see the "failed"
    //                           value below for what actually persists if
    //                           an attempt was made and errored)
    // "issued"                — qualified AND at least one of the two
    //                           reward-policy calls (referrer/referred)
    //                           actually wrote a RewardLedger entry
    // "skipped_unconfigured"  — qualified, but services/rewardPolicyService.js
    //                           reported both sides as not_configured at
    //                           the time. Distinct from "pending" so a
    //                           future admin/backfill view can tell
    //                           "hasn't happened yet" apart from
    //                           "happened, but no reward amount was set
    //                           yet" — see config/rewardPolicy.js.
    // "failed"                 — qualified, and a reward-issuance attempt
    //                            was made but threw an unexpected error
    //                            (e.g. a real DB failure, not a policy
    //                            configuration gap). Retryable — see
    //                            services/referralQualification.js's
    //                            retryPendingReferralRewards(), which
    //                            picks up any qualified row not in
    //                            "issued" status. RewardLedger's own
    //                            idempotency (unique sourceType+sourceId+
    //                            userId+type index) is what makes retrying
    //                            safe, not anything in this model.
    //
    // Deliberately NOT the source of financial truth — RewardLedger
    // remains that (see architecture report). This is a read-side status
    // for this qualification row only.
    rewardStatus: {
      type: String,
      enum: ["pending", "issued", "skipped_unconfigured", "failed"],
      default: "pending",
    },
  },
  { timestamps: true }
);

// ── Indexes ───────────────────────────────────────────────────────────────
// referredUserId's `unique: true` above already creates its own index —
// no separate index needed for it.

// Referrer's pending/qualified stats view (routes/referral.js's /stats
// extension — qualifiedCount).
referralQualificationSchema.index({ referrerId: 1, qualifiedAt: 1 });

// Reward-retry reconciliation query (services/referralQualification.js's
// retryPendingReferralRewards()) — "every qualified row whose reward
// hasn't successfully issued yet." status:"qualified" is the selective
// leading field (the overwhelming majority of rows are either pending or,
// once mature, issued), rewardStatus narrows further.
referralQualificationSchema.index({ status: 1, rewardStatus: 1 });

export default mongoose.model("ReferralQualification", referralQualificationSchema);
