import mongoose from "mongoose";

/**
 * Assignment — a TPO assigns a set of problems to their college's students,
 * with a due date. Students see assigned problems flagged in their problem list.
 */
const assignmentSchema = new mongoose.Schema(
  {
    tpoId:        { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    collegeDomain:{ type: String, required: true, index: true },
    title:        { type: String, required: true, trim: true },
    problemSlugs: [{ type: String, required: true }],
    dueDate:      { type: Date, required: true },
    createdAt:    { type: Date, default: Date.now },
  },
  { timestamps: true }
);

assignmentSchema.index({ collegeDomain: 1, dueDate: -1 });

const Assignment = mongoose.model("Assignment", assignmentSchema);
export default Assignment;
