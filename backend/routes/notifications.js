import mongoose from "mongoose";

/**
 * Notification — a single in-app notification for one user.
 *
 * Deliberately generic across all four user roles (student/TPO/recruiter/
 * admin) rather than having separate schemas per event type, so adding a
 * new notification-triggering event later (a new achievement category, a
 * contest starting, a certification issued, etc.) is a one-line
 * `createNotification()` call, not a schema change.
 *
 * `type` is a free-form string rather than a hard enum on purpose — new
 * event types can be added without a migration. Known types as of this
 * writing: "achievement", "assignment_created", "skills_test_received".
 *
 * `link` is a frontend route the notification should navigate to when
 * clicked (e.g. "/problems/two-sum", "/profile"). Optional.
 *
 * `meta` carries type-specific extra data the frontend might want (e.g.
 * `{ achievementKey: "solve_100" }`) without needing a schema change per type.
 */
const notificationSchema = new mongoose.Schema(
  {
    userId:  { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type:    { type: String, required: true },
    title:   { type: String, required: true },
    message: { type: String, default: "" },
    link:    { type: String, default: null },
    read:    { type: Boolean, default: false },
    meta:    { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true }
);

// Primary access pattern: "this user's notifications, newest first" —
// covers both the full feed and the unread-only feed since read is a
// simple boolean filter on top of this index.
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, read: 1 });

const Notification =
  mongoose.models.Notification ||
  mongoose.model("Notification", notificationSchema);

export default Notification;