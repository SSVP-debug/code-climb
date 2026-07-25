import mongoose from "mongoose";

// The one-click difficulty self-rating shown after every Accepted
// submission (Feature 3 of the Submission Experience). Storage-only for
// now — no analytics/aggregation consumes this yet, but it's shaped so a
// future "which topics feel hard for this student" or "recalibrate this
// problem's difficulty label" feature can query it directly instead of
// needing a schema migration.
export const REFLECTION_RATINGS = [
  "easy",
  "manageable",
  "challenging",
  "reallyDifficult",
];

const reflectionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // One reflection per submission (see the unique index below) — every
    // Accepted submission is its own opportunity to reflect, not just the
    // first solve of a problem.
    submissionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Submission",
      required: true,
    },
    // Denormalized from the Submission at write time so per-problem queries
    // (e.g. a future "which problems felt hardest" view) don't need a join.
    problemSlug: {
      type: String,
      required: true,
      trim: true,
    },
    difficultyRating: {
      type: String,
      enum: REFLECTION_RATINGS,
      required: true,
    },
  },
  { timestamps: true }
);

// Enforces "one reflection per submission" at the database level — the
// controller also treats a duplicate-key error as a harmless no-op rather
// than surfacing it as a failure, since the UI never blocks on this.
reflectionSchema.index({ userId: 1, submissionId: 1 }, { unique: true });

// Supports future per-problem difficulty-perception aggregation.
reflectionSchema.index({ problemSlug: 1 });

const Reflection = mongoose.model("Reflection", reflectionSchema);

export default Reflection;
