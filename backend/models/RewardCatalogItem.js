import mongoose from "mongoose";

/**
 * RewardCatalogItem.js — Rewards Store (Phase 4).
 *
 * What a user can spend Credits on. Admin-managed, not a free-for-all —
 * mirrors this codebase's existing "user action -> admin controls the
 * catalog" precedent rather than inventing a new shape. See
 * plans/004-rewards-store-scoping.md for the full scoping writeup this
 * model implements.
 *
 * ── Scope decision (Bunny, this phase) ───────────────────────────────────
 * "Anything, including physical merchandise" is in scope — not
 * digital-only. That's why `stock` and `requiresShipping` exist and are
 * load-bearing rather than display-only: a physical item genuinely runs
 * out and genuinely needs a shipping address at redemption time (see
 * RewardRedemption.js).
 *
 * ── active vs. deleting ───────────────────────────────────────────────────
 * `active: false` soft-disables an item (hidden from the store, no new
 * redemptions) without deleting it — past `RewardRedemption` rows
 * snapshot the item's name/cost/shipping-requirement at redemption time
 * (see RewardRedemption.js), so a deleted-and-gone item would still need
 * to be resolvable historically for admin/audit views. Soft-disable
 * avoids that problem entirely; hard delete is intentionally not
 * supported by this model.
 *
 * ── stock ─────────────────────────────────────────────────────────────────
 * `null` = unlimited (e.g. a purely digital perk with no real scarcity).
 * A number = remaining inventory; decremented by
 * services/rewardStore.js on each *fulfilled* redemption (not on
 * request — a pending, not-yet-approved redemption doesn't consume
 * stock, matching the "fulfillment is a manual admin action" decision
 * for this phase — see RewardRedemption.js's status lifecycle).
 */
const rewardCatalogItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },

    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },

    costCredits: {
      type: Number,
      required: true,
      min: 1,
    },

    // Free-form, not a closed enum — matches this codebase's existing
    // "don't lock in a taxonomy before real catalog content exists"
    // posture (see Contribution.js's `kind` field for the same
    // reasoning, though that one WAS later closed once Bunny decided the
    // taxonomy — this can follow the same path once real catalog
    // content exists to decide categories from).
    category: {
      type: String,
      trim: true,
      default: null,
    },

    active: {
      type: Boolean,
      default: true,
    },

    // true = a physical item; RewardRedemption requires a shipping
    // address at request time when this is true (see that model).
    requiresShipping: {
      type: Boolean,
      default: false,
    },

    // null = unlimited. See header comment for the decrement-on-fulfill
    // (not on-request) timing.
    stock: {
      type: Number,
      default: null,
      min: 0,
    },

    imageUrl: {
      type: String,
      trim: true,
      default: null,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// ── Read patterns ───────────────────────────────────────────────────────
// Store browsing: active items, cheapest/newest first depending on UI
// choice — index supports either without a second index.
rewardCatalogItemSchema.index({ active: 1, createdAt: -1 });

export default mongoose.model("RewardCatalogItem", rewardCatalogItemSchema);