import mongoose from "mongoose";
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

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;