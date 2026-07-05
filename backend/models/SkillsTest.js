import mongoose from "mongoose";

const skillsTestSchema = new mongoose.Schema({
  recruiterId:       { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  recruiterCompany:  { type: String, default: null },
  candidateId:       { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  candidateUsername: { type: String, required: true },
  problemSlugs:      [{ type: String, required: true }],
  durationMs:        { type: Number, default: 90 * 60 * 1000 },
  note:              { type: String, default: null },
  status:            { type: String, enum: ["pending","in_progress","submitted","expired"], default: "pending" },
  startedAt:         { type: Date, default: null },
  expiresAt:         { type: Date, default: null },
  submittedAt:       { type: Date, default: null },
  solvedSlugs:       [{ type: String }],
  score:             { type: Number, default: null },
}, { timestamps: true });

skillsTestSchema.index({ candidateId: 1, status: 1 });
skillsTestSchema.index({ recruiterId: 1, createdAt: -1 });

export default mongoose.model("SkillsTest", skillsTestSchema);
