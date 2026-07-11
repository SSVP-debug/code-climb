import Notification from "../models/Notification.js";

/**
 * notificationService.js
 *
 * Single source of truth for creating and reading notifications. Route
 * handlers should call these rather than touching the Notification model
 * directly, so the access patterns (indexes, pagination shape, bulk-insert
 * behavior) stay consistent as more event types get wired in.
 */

/**
 * Create one notification. Fire-and-forget by callers — never let a
 * notification failure break the action that triggered it (an achievement
 * unlock, an assignment being created, etc. must still succeed even if
 * this fails).
 */
export async function createNotification({ userId, type, title, message = "", link = null, meta = null }) {
  return Notification.create({ userId, type, title, message, link, meta });
}

/**
 * Create the same notification for many users at once — e.g. a TPO
 * assignment fans out to every student in a college. Uses insertMany so
 * this stays cheap even for a large college roster, instead of looping
 * individual create() calls.
 */
export async function createNotificationBulk(userIds, { type, title, message = "", link = null, meta = null }) {
  if (!userIds?.length) return [];
  const docs = userIds.map((userId) => ({ userId, type, title, message, link, meta }));
  return Notification.insertMany(docs, { ordered: false });
}

/** Paginated feed for one user, newest first. */
export async function listNotifications(userId, { limit = 20, before = null, unreadOnly = false } = {}) {
  const filter = { userId };
  if (unreadOnly) filter.read = false;
  if (before) filter.createdAt = { $lt: new Date(before) };

  return Notification.find(filter)
    .sort({ createdAt: -1 })
    .limit(Math.min(50, limit))
    .lean();
}

export async function getUnreadCount(userId) {
  return Notification.countDocuments({ userId, read: false });
}

/** Marks one notification read — scoped to userId so a user can't mark someone else's notification. */
export async function markAsRead(userId, notificationId) {
  return Notification.updateOne({ _id: notificationId, userId }, { $set: { read: true } });
}

export async function markAllAsRead(userId) {
  return Notification.updateMany({ userId, read: false }, { $set: { read: true } });
}