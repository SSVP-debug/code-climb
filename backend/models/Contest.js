import mongoose from "mongoose";

const contestSchema = new mongoose.Schema({
  title:        { type: String, required: true },
  description:  { type: String, default: "" },
  type:         { type: String, enum: ["public", "private"], default: "public" },
  status:       { type: String, enum: ["upcoming","active","ended"], default: "upcoming" },
  createdBy:    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  // Private contests only
  inviteCode:   { type: String, default: null, sparse: true },
  collegeDomain:{ type: String, default: null },
  // Timing
  startsAt:     { type: Date, required: true },
  endsAt:       { type: Date, required: true },
  durationMs:   { type: Number }, // auto-computed
  // Problems
  problemSlugs: [{ type: String }],
  // Participants: [{ userId, username, solvedSlugs[], score, rank, joinedAt }]
  participants: [{
    userId:      { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    username:    { type: String },
    displayName: { type: String },
    solvedSlugs: [{ type: String }],
    score:       { type: Number, default: 0 },
    rank:        { type: Number, default: null },
    joinedAt:    { type: Date, default: Date.now },
  }],
}, { timestamps: true });

contestSchema.index({ status: 1, startsAt: 1 });

export default mongoose.model("Contest", contestSchema);
