import mongoose from "mongoose";

const recruiterInterestSchema = new mongoose.Schema({
  recruiterId:       { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  recruiterCompany:  { type: String, default: null },
  candidateId:       { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  candidateUsername: { type: String, required: true },
  note:              { type: String, required: true, maxlength: 500 },
}, { timestamps: true });

// One recruiter can express interest in the same candidate more than once
// over time (e.g. months apart), but not twice in quick succession — the
// route handler enforces a cooldown using this index for the lookup, not
// as a uniqueness constraint.
recruiterInterestSchema.index({ recruiterId: 1, candidateId: 1, createdAt: -1 });

export default mongoose.model("RecruiterInterest", recruiterInterestSchema);