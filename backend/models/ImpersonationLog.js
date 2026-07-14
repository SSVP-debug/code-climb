import mongoose from "mongoose";

/**
 * ImpersonationLog — permanent record of every "Login As" session, for
 * accountability. User.impersonating is transient (cleared on exit); this
 * is the durable trail of who impersonated whom and when.
 */
const impersonationLogSchema = new mongoose.Schema(
  {
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    adminEmail: { type: String, required: true },
    targetUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    targetEmail: { type: String, required: true },
    targetRole: { type: String, required: true },
    startedAt: { type: Date, required: true },
    endedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

const ImpersonationLog = mongoose.model("ImpersonationLog", impersonationLogSchema);
export default ImpersonationLog;