import mongoose from "mongoose";

/**
 * RewardLedger.js — Code Club's single, centralized reward ledger.
 *
 * Phase 2 (Contribution Infrastructure + Referral System) architecture
 * report, §14-17. This is the ONE place a token/reward amount is ever
 * attributed to a user. Nothing else in the codebase should do
 * `user.tokens += amount` directly — every reward-granting flow (referral
 * qualification, contribution approval, redemption debit, and any future
 * source) writes an append-only row here via services/rewardLedger.js's
 * issueReward() (credits) or services/rewardStore.js's redemption debit
 * (Phase 4), and that's it.
 *
 * ── Why append-only, not a stored balance (mostly still true) ──────────
 * `User.tokenBalance = 1850` on its own can't answer "why do I have 1,850
 * tokens?" — this ledger can, by construction: the AUDITED balance is
 * always SUM(amount) WHERE userId = X AND status = "issued", computed on
 * read (see services/rewardLedger.js's getBalance()). At Code Club's
 * current scale this aggregation is cheap; a cached/materialized balance
 * is a scale optimization for a problem that doesn't exist yet — see the
 * architecture report §15 for the full reasoning.
 *
 * Phase 4 (Rewards Store) re-derives this decision narrowly, not
 * silently: `User.creditsBalance` now exists, but ONLY as an atomic
 * spend-safety guard for the redemption debit write path (see
 * services/rewardStore.js and plans/004-rewards-store-scoping.md §3 for
 * the full reasoning) — it is not read anywhere as the displayed or
 * audited balance, and this ledger's aggregation remains the source of
 * truth that `creditsBalance` is reconciled against, not the other way
 * around.
 *
 * ── Idempotency ──────────────────────────────────────────────────────────
 * The { sourceType, sourceId, userId, type } compound unique index below
 * is the actual enforcement mechanism — not an application-level `if`.
 * services/rewardLedger.js's issueReward() relies on this: a duplicate
 * call (retried request, double admin click, re-run worker) hits E11000
 * and is treated as a no-op, never a second reward. This mirrors the
 * codebase's existing idiom for "exactly once" (services/battleRoomScoring.js,
 * routes/ambassador.js's milestone claim) — a DB-level guarantee, not a
 * transaction. See architecture report §16-17 for why no MongoDB
 * transaction is used here.
 *
 * ── sourceType ────────────────────────────────────────────────────────
 * CONTRIBUTION and REFERRAL from Phase 2. REDEMPTION added in Phase 4
 * (see plans/004-rewards-store-scoping.md) for the debit side of a
 * fulfilled RewardRedemption. FEATURE_REQUEST added in Phase 5 (see
 * plans/005-feature-requests-scoping.md) for the credit issued when a
 * submitter's request ships — purely additive per this file's own prior
 * note that extending this enum later is a one-line, non-breaking
 * change. FUTURE_CONTEST / FUTURE_EVENT / FUTURE_ACHIEVEMENT remain not
 * added, since those sources still aren't real yet.
 *
 * ── amount can now be negative (Phase 4) ────────────────────────────────
 * Previously always positive — redemption/spend was an explicit
 * future-phase concern, not built here (architecture report §23). Now
 * that it is: a REDEMPTION row's `amount` is negative (a debit),
 * everything else's stays positive (a credit). getBalance()'s SUM
 * aggregation needed no changes for this — summing a negative number
 * already subtracts correctly.
 *
 * ── status: "reversed" ───────────────────────────────────────────────────
 * Reserved since Phase 2, still not acted on by any code path as of
 * Phase 4 — this just avoids a schema change the day an approved
 * contribution (or a fulfilled redemption) is later reversed and its
 * reward/debit needs to be clawed back.
 */
const rewardLedgerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Free-form (not a strict enum) on purpose — new reward reasons under
    // an existing sourceType (e.g. "REFERRAL_QUALIFIED" vs a future
    // "REFERRAL_MILESTONE") shouldn't require a schema migration. Kept as
    // a plain required string, validated at the API/service boundary
    // instead (services/rewardLedger.js and services/rewardStore.js only
    // accept known type values they define constants for).
    type: {
      type: String,
      required: true,
      trim: true,
    },

    // Positive = a credit (earned), negative = a debit (Phase 4
    // redemption). Zero is still permitted, unchanged from Phase 2's
    // `min: 0` — this file's validator only adds "and negative is now
    // allowed too," not a new restriction beyond that. See this file's
    // header comment for why negative amounts were introduced in Phase 4
    // rather than a separate `direction` field.
    amount: {
      type: Number,
      required: true,
      validate: {
        validator: (v) => Number.isFinite(v),
        message: "RewardLedger.amount must be a finite number.",
      },
    },

    sourceType: {
      type: String,
      required: true,
      enum: ["CONTRIBUTION", "REFERRAL", "REDEMPTION", "FEATURE_REQUEST"],
    },

    // Polymorphic on purpose — refers to whichever collection sourceType
    // names (Contribution._id, ReferralQualification._id, or — Phase 4 —
    // RewardRedemption._id). Not a Mongoose `ref` since it can point at
    // different collections depending on sourceType.
    sourceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },

    status: {
      type: String,
      enum: ["issued", "reversed"],
      default: "issued",
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

// ── Idempotency guarantee (architecture report §16) ───────────────────────
// The actual "a reward must never be issued twice" enforcement. See the
// header comment above and services/rewardLedger.js.
rewardLedgerSchema.index(
  { sourceType: 1, sourceId: 1, userId: 1, type: 1 },
  { unique: true }
);

// ── Read patterns (architecture report §21) ───────────────────────────────
rewardLedgerSchema.index({ userId: 1, createdAt: -1 }); // "my ledger", paginated
rewardLedgerSchema.index({ userId: 1, status: 1 }); // balance aggregation

export default mongoose.model("RewardLedger", rewardLedgerSchema);