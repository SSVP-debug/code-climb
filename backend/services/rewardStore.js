import RewardCatalogItem from "../models/RewardCatalogItem.js";
import RewardRedemption from "../models/RewardRedemption.js";
import User from "../models/User.js";
import { writeRedemptionLedgerEntry, getBalance, REWARD_TYPES } from "./rewardLedger.js";
import { logger } from "../config/logger.js";

/**
 * services/rewardStore.js — Rewards Store (Phase 4).
 *
 * See plans/004-rewards-store-scoping.md for the full scoping writeup
 * this file implements — in particular §3 for why the redemption debit
 * happens at REQUEST time (not fulfillment) and why User.creditsBalance
 * exists at all alongside RewardLedger's aggregate balance.
 *
 * Scope note: this file is redemption lifecycle + balance-safety +
 * reconciliation only. Catalog CRUD (admin create/edit/deactivate) is
 * deliberately NOT included here — it's simple enough to live directly
 * in its admin controller in Batch 2 (mirroring how straightforward
 * admin-managed entities elsewhere in this codebase don't always get
 * their own service-layer indirection), and keeping it out of this file
 * keeps this pass's diff focused on the one thing that actually needed
 * careful design: the redemption write path.
 */

/**
 * requestRedemption — the entire "spend Credits" write path. Atomic,
 * race-safe under concurrent requests from the same user (e.g. a
 * double-click, two open tabs) via User.creditsBalance's guarded
 * decrement — see this file's header comment and
 * plans/004-rewards-store-scoping.md §3 for the full reasoning.
 *
 * Sequence:
 *   1. Look up the catalog item. Must exist and be active.
 *   2. Atomic guard: findOneAndUpdate the user's creditsBalance down by
 *      the item's cost, but ONLY if the current balance is sufficient
 *      ($gte). If nothing matches, the user can't afford it — reject
 *      before writing anything else.
 *   3. Create the "pending" RewardRedemption row (with its item
 *      snapshot, and a shipping address if the item requires one).
 *   4. Write the debit RewardLedger row via writeRedemptionLedgerEntry(),
 *      referencing the redemption's own _id as sourceId — set
 *      `ledgerEntryId` on the redemption row once written.
 *
 * Steps 3-4 are two separate writes, same best-effort-consistent
 * posture as issueReward()'s ledger-write-then-balance-update — a crash
 * between them leaves a pending RewardRedemption with no
 * `ledgerEntryId` yet, which is detectable and repairable (a future
 * self-heal pass, out of scope for this batch — flagged here rather
 * than silently assumed away, same "flag, don't silently fix" posture
 * this codebase already follows elsewhere) but does NOT overspend the
 * balance guard, which is the one property that actually has to hold
 * under concurrency.
 *
 * @param {Object} params
 * @param {string|import("mongoose").Types.ObjectId} params.userId
 * @param {string|import("mongoose").Types.ObjectId} params.itemId
 * @param {Object} [params.shippingAddress] - required iff the item's
 *   `requiresShipping` is true; validated here, not just at the schema
 *   level, since Mongoose's conditional-required isn't used for this
 *   (see RewardRedemption.js's header comment).
 * @returns {Promise<
 *   { requested: true, redemption: object } |
 *   { requested: false, reason: "item_not_found" | "item_inactive" | "insufficient_balance" | "shipping_address_required" }
 * >}
 */
export async function requestRedemption({ userId, itemId, shippingAddress = null }) {
  const item = await RewardCatalogItem.findById(itemId).lean();
  if (!item) {
    return { requested: false, reason: "item_not_found" };
  }
  if (!item.active) {
    return { requested: false, reason: "item_inactive" };
  }
  if (item.requiresShipping && !isValidShippingAddress(shippingAddress)) {
    return { requested: false, reason: "shipping_address_required" };
  }

  // The actual balance-safety guarantee. Matches nothing => either the
  // user doesn't exist or (overwhelmingly the real case) their balance
  // is below item.costCredits — either way, "can't afford it," and
  // nothing else has been written yet.
  const guarded = await User.findOneAndUpdate(
    { _id: userId, creditsBalance: { $gte: item.costCredits } },
    { $inc: { creditsBalance: -item.costCredits } }
  );
  if (!guarded) {
    return { requested: false, reason: "insufficient_balance" };
  }

  const redemption = await RewardRedemption.create({
    userId,
    itemId: item._id,
    itemSnapshot: {
      name: item.name,
      costCredits: item.costCredits,
      requiresShipping: item.requiresShipping,
    },
    shippingAddress: item.requiresShipping ? shippingAddress : null,
    status: "pending",
  });

  const { entry } = await writeRedemptionLedgerEntry({
    userId,
    type: REWARD_TYPES.REDEMPTION_DEBIT,
    amount: -item.costCredits,
    redemptionId: redemption._id,
    metadata: { itemId: String(item._id), itemName: item.name },
  });

  redemption.ledgerEntryId = entry._id;
  await redemption.save();

  return { requested: true, redemption };
}

/**
 * fulfillRedemption — atomically transitions a pending redemption to
 * "fulfilled". No ledger change — the debit already happened at request
 * time (see requestRedemption() above). For a finite-stock item,
 * decrements RewardCatalogItem.stock here, not at request time, so a
 * pending-but-never-fulfilled request doesn't permanently tie up
 * inventory. Same atomic `findOneAndUpdate` guarded-by-status idiom
 * services/contribution.js's approveContribution() already uses.
 *
 * @param {Object} params
 * @param {string|import("mongoose").Types.ObjectId} params.redemptionId
 * @param {string|import("mongoose").Types.ObjectId} params.reviewerId
 * @param {string} [params.adminNotes]
 * @returns {Promise<{ fulfilled: boolean, reason?: string }>}
 */
export async function fulfillRedemption({ redemptionId, reviewerId, adminNotes = null }) {
  const redemption = await RewardRedemption.findOneAndUpdate(
    { _id: redemptionId, status: "pending" },
    { $set: { status: "fulfilled", resolvedAt: new Date(), adminNotes } },
    { new: true }
  );
  if (!redemption) {
    return { fulfilled: false, reason: "not_found_or_not_pending" };
  }

  // Best-effort — a finite-stock item's count is a display/ops signal,
  // not itself a safety-critical guard the way the balance decrement is
  // (that guard already happened at request time, before this item was
  // ever committed to). $gte 0 just avoids going visibly negative under
  // a pathological over-fulfillment sequence.
  await RewardCatalogItem.updateOne(
    { _id: redemption.itemId, stock: { $ne: null, $gte: 1 } },
    { $inc: { stock: -1 } }
  );

  logger.info(
    { redemptionId: String(redemptionId), reviewerId: String(reviewerId) },
    "[RewardStore] redemption fulfilled"
  );
  return { fulfilled: true };
}

/**
 * rejectRedemption — atomically transitions a pending redemption to
 * "rejected" and reverses its debit with a compensating credit
 * RewardLedger row (never deleting/editing the original debit — keeps
 * the ledger append-only). Also credits User.creditsBalance back up by
 * the same amount, mirroring how the original debit decremented it.
 *
 * @param {Object} params
 * @param {string|import("mongoose").Types.ObjectId} params.redemptionId
 * @param {string|import("mongoose").Types.ObjectId} params.reviewerId
 * @param {string} [params.reason]
 * @returns {Promise<{ rejected: boolean, reason?: string }>}
 */
export async function rejectRedemption({ redemptionId, reviewerId, reason = null }) {
  const { resolved, reason: failureReason } = await resolveAsReversed({
    redemptionId,
    nextStatus: "rejected",
    adminNotes: reason,
    logLabel: "rejected",
    actorId: reviewerId,
  });
  return { rejected: resolved, reason: failureReason };
}

/**
 * cancelRedemption — a user cancelling their OWN still-pending
 * redemption. Same reversal mechanics as rejectRedemption(); the only
 * difference is who's allowed to call it and why — enforced by the
 * caller (controller, Batch 2) checking `redemption.userId` matches the
 * requesting user before calling this, same authorization-at-the-
 * caller-boundary posture services/rewardLedger.js's getLedger() already
 * documents for itself.
 *
 * @param {Object} params
 * @param {string|import("mongoose").Types.ObjectId} params.redemptionId
 * @param {string|import("mongoose").Types.ObjectId} params.userId
 * @returns {Promise<{ cancelled: boolean, reason?: string }>}
 */
export async function cancelRedemption({ redemptionId, userId }) {
  const { resolved, reason } = await resolveAsReversed({
    redemptionId,
    nextStatus: "cancelled",
    adminNotes: null,
    logLabel: "cancelled",
    actorId: userId,
    extraMatch: { userId },
  });
  return { cancelled: resolved, reason };
}

/**
 * resolveAsReversed — shared reversal logic for rejectRedemption() and
 * cancelRedemption(). Not exported; both public functions above exist
 * as the actual API so callers/tests read naturally ("reject" vs
 * "cancel" are meaningfully different actions to a caller, even though
 * their mechanics are identical), matching this codebase's existing
 * preference for named, purpose-specific exports over one generic
 * multi-purpose function (see services/contribution.js's separate
 * approveContribution()/rejectContribution() for the same shape).
 */
async function resolveAsReversed({
  redemptionId,
  nextStatus,
  adminNotes,
  logLabel,
  actorId,
  extraMatch = {},
}) {
  const redemption = await RewardRedemption.findOneAndUpdate(
    { _id: redemptionId, status: "pending", ...extraMatch },
    { $set: { status: nextStatus, resolvedAt: new Date(), adminNotes } },
    { new: true }
  );
  if (!redemption) {
    return { resolved: false, reason: "not_found_or_not_pending" };
  }

  const cost = redemption.itemSnapshot.costCredits;
  await User.updateOne({ _id: redemption.userId }, { $inc: { creditsBalance: cost } });

  const { entry } = await writeRedemptionLedgerEntry({
    userId: redemption.userId,
    type: REWARD_TYPES.REDEMPTION_REVERSED,
    amount: cost,
    redemptionId: redemption._id,
    metadata: { itemName: redemption.itemSnapshot.name },
  });

  redemption.reversalLedgerEntryId = entry._id;
  await redemption.save();

  logger.info(
    { redemptionId: String(redemptionId), actorId: String(actorId) },
    `[RewardStore] redemption ${logLabel}, debit reversed`
  );
  return { resolved: true };
}

/**
 * reconcileCreditsBalance — self-heal for one user's
 * User.creditsBalance against RewardLedger's aggregate balance
 * (services/rewardLedger.js's getBalance()), which is always correct by
 * construction. Same "derived value can drift from its source of truth;
 * detect and repair cheaply, on the normal request path, not via new
 * scheduled-job infra" pattern services/referralQualification.js's
 * selfHealMissingReferralQualification() already established for this
 * codebase — see this file's header comment and
 * plans/004-rewards-store-scoping.md §3 for why creditsBalance can drift
 * at all (a crash between a ledger write and its paired balance
 * $inc, in either issueReward() or this file's redemption paths).
 *
 * Cheap in the common case: one aggregation query (already paid for
 * every time getBalance() is called elsewhere, e.g.
 * GET /api/rewards/balance) plus one comparison. Only writes when the
 * two actually disagree.
 *
 * Not wired to any scheduler or route in this batch — infrastructure
 * only, same "batch 1" scope as services/contribution.js's
 * retryPendingContributionRewards() when it was first introduced. A
 * future call site (e.g. lazily from rewardController.js's balance
 * endpoint, or an admin-triggered reconciliation pass) can call this
 * directly without any further change here.
 *
 * @param {string|import("mongoose").Types.ObjectId} userId
 * @returns {Promise<{ reconciled: boolean, ledgerBalance: number, priorStoredBalance: number }>}
 */
export async function reconcileCreditsBalance(userId) {
  const [ledgerBalance, userDoc] = await Promise.all([
    getBalance(userId),
    User.findById(userId).select("creditsBalance").lean(),
  ]);
  const priorStoredBalance = userDoc?.creditsBalance ?? 0;

  if (priorStoredBalance === ledgerBalance) {
    return { reconciled: false, ledgerBalance, priorStoredBalance };
  }

  await User.updateOne({ _id: userId }, { $set: { creditsBalance: ledgerBalance } });
  logger.warn(
    { userId: String(userId), ledgerBalance, priorStoredBalance },
    "[RewardStore] creditsBalance reconciled against RewardLedger aggregate — a drift was detected and repaired"
  );
  return { reconciled: true, ledgerBalance, priorStoredBalance };
}

function isValidShippingAddress(addr) {
  if (!addr || typeof addr !== "object") return false;
  return ["recipientName", "line1", "city", "state", "postalCode", "country"].every(
    (field) => typeof addr[field] === "string" && addr[field].trim().length > 0
  );
}