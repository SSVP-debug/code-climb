import mongoose from "mongoose";
import RewardLedger from "../models/RewardLedger.js";
import User from "../models/User.js";
import { logger } from "../config/logger.js";

/**
 * services/rewardLedger.js — the SOLE writer of RewardLedger rows.
 *
 * Phase 2 architecture report, §13-17. Every reward-granting flow
 * (referral qualification, contribution approval, redemption debit/
 * reversal, and any future source) calls issueReward() or (Phase 4)
 * writeRedemptionLedgerEntry() with a description of what happened —
 * none of them do token arithmetic themselves. This is what keeps
 * "don't put token arithmetic directly inside contribution/referral/
 * store controllers" true: callers describe an event, this module
 * decides what it means for the ledger.
 *
 * Known reward types, kept here (not scattered across callers) so a
 * future config/rewardValues.js (architecture report §24) has one place
 * to import known type strings from:
 */
export const REWARD_TYPES = Object.freeze({
  CONTRIBUTION_APPROVED: "CONTRIBUTION_APPROVED",
  REFERRAL_QUALIFIED: "REFERRAL_QUALIFIED",
  // Phase 4 (Rewards Store) — see services/rewardStore.js.
  REDEMPTION_DEBIT: "REDEMPTION_DEBIT",
  REDEMPTION_REVERSED: "REDEMPTION_REVERSED",
  // Phase 5 (Feature Requests) — see services/featureRequests.js.
  FEATURE_REQUEST_SHIPPED: "FEATURE_REQUEST_SHIPPED",
});

/**
 * issueReward — idempotent. Relies entirely on RewardLedger's
 * { sourceType, sourceId, userId, type } unique index (see that model's
 * header comment) rather than a pre-check + write, which would be a
 * classic TOCTOU race under concurrent calls (two admins double-clicking
 * approve, a retried request, a worker retry). A duplicate call is
 * detected via the resulting E11000 error and treated as a no-op —
 * returns the existing row instead of throwing, so callers never need to
 * special-case "was this already issued?" themselves.
 *
 * Phase 4 addition: also keeps User.creditsBalance in sync (+= amount)
 * after a genuinely new row is written — see User.js's creditsBalance
 * comment and plans/004-rewards-store-scoping.md §3 for why that field
 * exists and why it's updated here rather than left for callers to
 * remember. Best-effort, not transactional with the ledger write above
 * it: if the process crashes between the two, creditsBalance and the
 * ledger's aggregate balance can briefly disagree — this is exactly what
 * the reconciliation self-heal (services/rewardStore.js's
 * reconcileCreditsBalance()) exists to repair, same "derived value can
 * drift; detect and repair cheaply" posture
 * services/referralQualification.js's self-heal already established.
 * Not run for a duplicate (created=false) — the balance was already
 * incremented the first time this exact reward was issued.
 *
 * @param {Object} params
 * @param {string|import("mongoose").Types.ObjectId} params.recipientId
 * @param {string} params.type - one of REWARD_TYPES
 * @param {number} params.amount - always >= 0 as of Phase 2
 * @param {"CONTRIBUTION"|"REFERRAL"} params.sourceType
 * @param {string|import("mongoose").Types.ObjectId} params.sourceId
 * @param {Object} [params.metadata]
 * @returns {Promise<{ entry: object, created: boolean }>}
 *   created=false means this exact reward had already been issued and no
 *   new row was written — callers should treat this as success, not an
 *   error.
 */
export async function issueReward({
  recipientId,
  type,
  amount,
  sourceType,
  sourceId,
  metadata = {},
}) {
  if (!recipientId || !type || typeof amount !== "number" || amount < 0) {
    throw new Error("issueReward: recipientId, type, and a non-negative amount are required.");
  }
  if (!["CONTRIBUTION", "REFERRAL", "FEATURE_REQUEST"].includes(sourceType) || !sourceId) {
    throw new Error("issueReward: a valid sourceType and sourceId are required.");
  }

  try {
    const entry = await RewardLedger.create({
      userId: recipientId,
      type,
      amount,
      sourceType,
      sourceId,
      metadata,
    });
    await User.updateOne({ _id: recipientId }, { $inc: { creditsBalance: amount } });
    return { entry, created: true };
  } catch (err) {
    // E11000 = the unique index caught a duplicate of this exact
    // (sourceType, sourceId, userId, type) combination — this reward was
    // already issued. Not an error from the caller's point of view.
    if (err?.code === 11000) {
      const existing = await RewardLedger.findOne({ sourceType, sourceId, userId: recipientId, type });
      logger.info(
        { recipientId: String(recipientId), type, sourceType, sourceId: String(sourceId) },
        "[RewardLedger] duplicate issueReward call ignored — reward already issued"
      );
      return { entry: existing, created: false };
    }
    throw err;
  }
}

/**
 * writeRedemptionLedgerEntry — Phase 4's REDEMPTION-sourceType writer.
 * Kept separate from issueReward() rather than generalizing that
 * function to accept negative amounts, because the two have genuinely
 * different validation shapes (issueReward's callers always describe a
 * non-negative credit from a known Phase 2 source; this one can be
 * either a negative debit or a positive reversal from exactly one
 * source, REDEMPTION) — see RewardLedger.js's header comment for the
 * amount-sign convention this relies on.
 *
 * Does NOT touch User.creditsBalance itself — unlike issueReward(),
 * callers (services/rewardStore.js) need to sequence the balance change
 * differently depending on direction (the atomic $gte-guarded decrement
 * for a debit has to happen BEFORE this is called, not after — see that
 * file), so this function stays a pure ledger write, matching this
 * file's "sole writer of RewardLedger rows" scope precisely rather than
 * also owning balance arithmetic it can't safely order for every caller.
 *
 * @param {Object} params
 * @param {string|import("mongoose").Types.ObjectId} params.userId
 * @param {string} params.type - REWARD_TYPES.REDEMPTION_DEBIT or .REDEMPTION_REVERSED
 * @param {number} params.amount - negative for a debit, positive for a reversal. Never zero.
 * @param {string|import("mongoose").Types.ObjectId} params.redemptionId - the RewardRedemption._id this entry belongs to
 * @param {Object} [params.metadata]
 * @returns {Promise<{ entry: object, created: boolean }>} same
 *   idempotent-duplicate shape as issueReward().
 */
export async function writeRedemptionLedgerEntry({
  userId,
  type,
  amount,
  redemptionId,
  metadata = {},
}) {
  if (![REWARD_TYPES.REDEMPTION_DEBIT, REWARD_TYPES.REDEMPTION_REVERSED].includes(type)) {
    throw new Error(`writeRedemptionLedgerEntry: unexpected type "${type}".`);
  }
  if (!userId || !redemptionId || typeof amount !== "number" || amount === 0) {
    throw new Error(
      "writeRedemptionLedgerEntry: userId, redemptionId, and a non-zero amount are required."
    );
  }

  try {
    const entry = await RewardLedger.create({
      userId,
      type,
      amount,
      sourceType: "REDEMPTION",
      sourceId: redemptionId,
      metadata,
    });
    return { entry, created: true };
  } catch (err) {
    if (err?.code === 11000) {
      const existing = await RewardLedger.findOne({
        sourceType: "REDEMPTION",
        sourceId: redemptionId,
        userId,
        type,
      });
      logger.info(
        { userId: String(userId), type, redemptionId: String(redemptionId) },
        "[RewardLedger] duplicate writeRedemptionLedgerEntry call ignored — entry already written"
      );
      return { entry: existing, created: false };
    }
    throw err;
  }
}

/**
 * getBalance — SUM(amount) over "issued" rows for a user, computed on
 * read. See RewardLedger's header comment and architecture report §15
 * for why this isn't a cached/stored field.
 */
export async function getBalance(userId) {
  const [result] = await RewardLedger.aggregate([
    { $match: { userId: toObjectId(userId), status: "issued" } },
    { $group: { _id: null, balance: { $sum: "$amount" } } },
  ]);
  return result?.balance || 0;
}

/**
 * getLedger — paginated, newest-first, scoped to one user. Callers
 * (rewardController.js) are responsible for ensuring userId is either
 * the requesting user themselves or an admin request — this function
 * itself does not authorize, it only reads.
 */
export async function getLedger(userId, { page = 1, limit = 20 } = {}) {
  const safeLimit = Math.min(Math.max(1, limit), 100);
  const safePage = Math.max(1, page);

  const [entries, total] = await Promise.all([
    RewardLedger.find({ userId })
      .sort({ createdAt: -1 })
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit)
      .lean(),
    RewardLedger.countDocuments({ userId }),
  ]);

  return { entries, total, page: safePage, limit: safeLimit };
}

function toObjectId(id) {
  // Aggregation pipelines don't auto-cast string ids the way query
  // filters do — accept either a string or an already-cast ObjectId.
  return typeof id === "string" ? new mongoose.Types.ObjectId(id) : id;
}