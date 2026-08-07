/**
 * AdminAuditLog — durable, admin-attributed, timestamped record of admin
 * mutating actions (approvals/rejections, user changes, problem changes,
 * settings changes, ...). Generalizes the ImpersonationLog pattern
 * (backend/models/ImpersonationLog.js) into a single model any admin
 * action can write to with one line, via services/adminAuditLog.js's
 * recordAdminAction(...).
 *
 * ImpersonationLog itself is untouched — it's more precise than a generic
 * log for its one use case (has startedAt/endedAt session semantics this
 * model deliberately doesn't) and already has its own test coverage.
 *
 * Append-only in practice: only `create` is ever called against this
 * model. There is no update or delete route for it — see routes/admin.js.
 */
import mongoose from "mongoose";

const adminAuditLogSchema = new mongoose.Schema(
  {
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    adminEmail: { type: String, required: true },
    action: { type: String, required: true, index: true }, // e.g. "user.suspend", "problem.delete", "settings.update"
    targetType: { type: String, default: null }, // "User" | "Problem" | "College" | "Settings" | null
    targetId: { type: mongoose.Schema.Types.ObjectId, default: null, index: true },
    // Free-form, small — e.g. { previousRole: "student", newRole: "tpo" }.
    // Never store secrets/tokens/API keys here — this field is as subject
    // to the app's "don't log secrets" rule as anything pino redacts.
    details: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true } // createdAt is the event time — no separate startedAt/endedAt, this isn't a session
);

adminAuditLogSchema.index({ createdAt: -1 });

const AdminAuditLog = mongoose.model("AdminAuditLog", adminAuditLogSchema);
export default AdminAuditLog;