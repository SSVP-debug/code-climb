/**
 * adminAuditLog.js — one-line call site for every admin mutating action
 * to write a durable AdminAuditLog entry.
 *
 * Fire-and-forget by design, mirroring the createNotification(...).catch(() => {})
 * pattern already used throughout adminController.js: a logging failure
 * must never fail the admin action itself (the mutation already
 * succeeded by the time this is called), but it must be loud in app logs
 * so a broken audit pipeline doesn't fail silently forever.
 */
import AdminAuditLog from "../models/AdminAuditLog.js";
import { logger } from "../config/logger.js";

export function recordAdminAction({ adminDoc, action, targetType = null, targetId = null, details = null }) {
  AdminAuditLog.create({
    adminId: adminDoc._id,
    adminEmail: adminDoc.email,
    action,
    targetType,
    targetId,
    details,
  }).catch((err) => logger.error({ err, action }, "[AdminAuditLog] write failed"));
}