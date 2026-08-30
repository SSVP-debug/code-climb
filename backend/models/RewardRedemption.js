import mongoose from "mongoose";

/**
 * RewardRedemption.js — Rewards Store (Phase 4).
 *
 * A user's request to spend Credits on a RewardCatalogItem. See
 * plans/004-rewards-store-scoping.md for the full scoping writeup this
 * model implements, including why manual admin review (not instant
 * auto-fulfillment) was chosen for this phase — physical merchandise is
 * in scope, and there's no "instant" for something that has to ship.
 *
 * ── The debit happens at REQUEST time, not fulfillment ───────────────────
 * This is the one deliberate design correction worth calling out: an
 * earlier draft of this model had the Credits debit deferred to
 * fulfillment (matching how Contribution.js defers its reward to
 * approval). That doesn't work here, because it would mean
 * User.creditsBalance and RewardLedger's aggregate balance are SUPPOSED
 * to disagree for the entire "pending" window (the hold exists on
 * creditsBalance but no corresponding ledger row exists yet) — which
 * directly breaks the reconciliation self-heal this field is documented
 * to have (see User.js's creditsBalance comment): reconciling against
 * the ledger during a pending redemption would silently release the
 * hold and reopen the exact overspend race the balance guard exists to
 * prevent.
 *
 * So: services/rewardStore.js's requestRedemption() does the atomic
 * `creditsBalance` guard AND writes the debit RewardLedger row (a
 * negative `amount`, sourceType "REDEMPTION") in the same step that
 * creates this "pending" row — `ledgerEntryId` is set immediately, not
 * "once fulfilled." creditsBalance and the ledger aggregate stay in
 * sync at every point in this lifecycle, including "pending", because a
 * pending redemption is a REAL debit (a reservation), not a promise of
 * one. Rejecting or cancelling a pending redemption reverses it with a
 * second, compensating credit RewardLedger row (see `status` below) —
 * it does not delete or mutate the original debit row, keeping the
 * ledger's append-only guarantee intact.
 *
 * ── Status lifecycle (mirrors Contribution.js / ReferralQualification.js's
 *    established "user action -> admin-reviewed" shape) ────────────────────
 *   "pending"   — requested. The debit has already happened (see above).
 *                 The only mutable state.
 *   "fulfilled" — an admin approved and (for physical items) shipped it.
 *                 Terminal. No ledger change — the debit already
 *                 happened at request time. For a finite-stock item,
 *                 RewardCatalogItem.stock is decremented here, not at
 *                 request time, so a pending-but-never-fulfilled request
 *                 doesn't permanently tie up inventory.
 *   "rejected"  — an admin rejected it (e.g. out of stock, policy
 *                 violation, bad shipping address). Terminal. Reverses
 *                 the original debit via a compensating credit
 *                 RewardLedger row (`reversalLedgerEntryId` below) —
 *                 the debit itself is never deleted or edited.
 *   "cancelled" — the user cancelled their own still-pending request.
 *                 Terminal. Same reversal behavior as "rejected".
 * No re-review path exists in this phase, same posture
 * RewardLedger.js's `status: "reversed"` and Contribution.js's
 * single-pass review both already take.
 *
 * ── itemSnapshot ──────────────────────────────────────────────────────────
 * Catalog items can change (price, shipping requirement, name) after a
 * redemption exists against them — a past redemption should reflect
 * what it actually cost/required at request time, not a later edit. Same
 * snapshot reasoning Contribution.js's own fields already use.
 *
 * ── shippingAddress ───────────────────────────────────────────────────────
 * Only present when itemSnapshot.requiresShipping is true. No existing
 * address field exists on User (confirmed by inspection) to reuse, so
 * it's captured directly here, at request time.
 */
const shippingAddressSchema = new mongoose.Schema(
  {
    recipientName: { type: String, required: true, trim: true, maxlength: 200 },
    line1: { type: String, required: true, trim: true, maxlength: 200 },
    line2: { type: String, trim: true, maxlength: 200, default: null },
    city: { type: String, required: true, trim: true, maxlength: 100 },
    state: { type: String, required: true, trim: true, maxlength: 100 },
    postalCode: { type: String, required: true, trim: true, maxlength: 20 },
    country: { type: String, required: true, trim: true, maxlength: 100 },
  },
  { _id: false }
);

const rewardRedemptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RewardCatalogItem",
      required: true,
    },

    // Frozen at request time — see header comment.
    itemSnapshot: {
      name: { type: String, required: true },
      costCredits: { type: Number, required: true, min: 1 },
      requiresShipping: { type: Boolean, required: true },
    },

    // Required only when itemSnapshot.requiresShipping is true —
    // enforced at the service/API boundary (services/rewardStore.js),
    // not as a Mongoose conditional-required, matching this codebase's
    // existing preference for validating cross-field shape rules at the
    // service layer rather than in schema-level conditionals (see
    // schemas/contributionSchema.js's discriminated union for the same
    // pattern applied to a different field).
    shippingAddress: {
      type: shippingAddressSchema,
      default: null,
    },

    status: {
      type: String,
      enum: ["pending", "fulfilled", "rejected", "cancelled"],
      default: "pending",
    },

    resolvedAt: {
      type: Date,
      default: null,
    },

    adminNotes: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: null,
    },

    // Set at REQUEST time (see header comment) — the debit
    // RewardLedger row that reserves this redemption's cost.
    ledgerEntryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RewardLedger",
      default: null,
    },

    // Set only if status transitions to "rejected"/"cancelled" — the
    // compensating credit RewardLedger row that reverses ledgerEntryId's
    // debit. Null for "pending" and "fulfilled".
    reversalLedgerEntryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RewardLedger",
      default: null,
    },
  },
  { timestamps: true }
);

// ── Read patterns ───────────────────────────────────────────────────────
rewardRedemptionSchema.index({ userId: 1, createdAt: -1 }); // "my redemptions", paginated
rewardRedemptionSchema.index({ status: 1, createdAt: -1 }); // admin fulfillment queue

export default mongoose.model("RewardRedemption", rewardRedemptionSchema);