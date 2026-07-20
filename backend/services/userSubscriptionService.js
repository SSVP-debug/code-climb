import User from "../models/User.js";

/**
 * Persist subscription-related fields.
 *
 * For now, User remains the source of truth.
 * This abstraction exists so a future UserSubscription model
 * can be introduced without changing route handlers.
 */
export async function saveSubscription(userId, patch) {
  return User.updateOne(
    { _id: userId },
    {
      $set: patch,
    }
  );
}