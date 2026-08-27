import mongoose from "mongoose";

/**
 * RewardLedger.js — Code Club's single, centralized reward ledger.
 *
 * Phase 2 (Contribution Infrastructure + Referral System) architecture
 * report, §14-17. This is the ONE place a token/reward amount is ever
 * attributed to a user. Nothing else in the codebase should do
 * `user.tokens += amount` directly — every reward-granting flow (referral
 * qualification, contribution approval, and any future source) writes an
 * append-only row here via services/rewardLedger.js's issueReward(), and
 * that's it.
 *
 * ── Why append-only, not a stored balance ───────────────────────────────
 * `User.tokenBalance = 1850` on its own can't answer "why do I have 1,850
 * tokens?" — this ledger can, by construction: balance is always
 * SUM(amount) WHERE userId = X AND status = "issued", computed on read
 * (see services/rewardLedger.js's getBalance()). At Code Club's current
 * scale this aggregation is cheap; a cached/materialized balance is a
 * scale optimization for a problem that doesn't exist yet — see the
 * architecture report §15 for the full reasoning. Do not add a balance
 * field to User for this without re-deriving that decision.
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
 * ── sourceType is deliberately NOT extended speculatively ───────────────
 * Only CONTRIBUTION and REFERRAL exist as of Phase 2. FUTURE_CONTEST /
 * FUTURE_EVENT / FUTURE_ACHIEVEMENT are explicitly NOT added to this enum
 * yet, per the architecture report — extending an enum later is a
 * one-line, non-breaking change, so there's no cost to waiting until
 * those sources are real.
 *
 * ── status: "reversed" ───────────────────────────────────────────────────
 * Reserved now, not acted on yet. No reversal flow is built in Phase 2 —
 * this just avoids a schema change the day an approved contribution is
 * later un-approved and its reward needs to be clawed back.
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
    // instead (services/rewardLedger.js only accepts known type values
    // it defines constants for).
    type: {
      type: String,
      required: true,
      trim: true,
    },

    // Always positive as of Phase 2 — redemption/spend (negative amounts)
    // is an explicit future-phase concern, not built here. See
    // architecture report §23 for how this stays redemption-ready without
    // being built now.
    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    sourceType: {
      type: String,
      required: true,
      enum: ["CONTRIBUTION", "REFERRAL"],
    },

    // Polymorphic on purpose — refers to whichever collection sourceType
    // names (Contribution._id or ReferralQualification._id). Not a
    // Mongoose `ref` since it can point at different collections
    // depending on sourceType.
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
