import mongoose from "mongoose";
import RewardLedger from "../models/RewardLedger.js";
import { logger } from "../config/logger.js";

/**
 * services/rewardLedger.js — the SOLE writer of RewardLedger rows.
 *
 * Phase 2 architecture report, §13-17. Every reward-granting flow
 * (referral qualification, contribution approval, and any future source)
 * calls issueReward() with a description of what happened — none of them
 * do token arithmetic themselves. This is what keeps "don't put token
 * arithmetic directly inside contribution/referral controllers" true:
 * callers describe an event, this module decides what it means for the
 * ledger.
 *
 * Known reward types, kept here (not scattered across callers) so a
 * future config/rewardValues.js (architecture report §24) has one place
 * to import known type strings from:
 */
export const REWARD_TYPES = Object.freeze({
  CONTRIBUTION_APPROVED: "CONTRIBUTION_APPROVED",
  REFERRAL_QUALIFIED: "REFERRAL_QUALIFIED",
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
  if (!["CONTRIBUTION", "REFERRAL"].includes(sourceType) || !sourceId) {
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
