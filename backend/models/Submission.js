import mongoose from "mongoose";

// Status values must exactly match what backend/routes/judge.js returns.
// The emoji suffixes are intentional — they are displayed directly in the UI.
export const SUBMISSION_STATUSES = [
  "Accepted",
  "Wrong Answer",
  "Compilation Error",
  "Runtime Error",
  "Time Limit Exceeded",
  "Judge Error",
];

const submissionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    problemSlug: {
      type: String,
      required: true,
      trim: true,
    },
    statusDescription: {
      type: String,
    },
    judge0Time: {
      type: String,
    },
    memory: {
      type: Number,
      default: 0,
      min: 0,
    },
    problemTitle: String,
    language: {
      type: String,
      enum: ["javascript", "python", "java", "cpp"],
      required: true,
    },
    // Status must match judge route output — includes emoji suffix
    status: {
      type: String,
      enum: SUBMISSION_STATUSES,
      required: true,
    },
    passed: {
      type: Number,
      default: 0,
      min: 0,
    },
    total: {
      type: Number,
      default: 0,
      min: 0,
    },
    visiblePassed: {
      type: Number,
      default: 0,
      min: 0,
    },
    hiddenPassed: {
      type: Number,
      default: 0,
      min: 0,
    },
    executionTime: String,
    expectedOutput: mongoose.Schema.Types.Mixed,
    actualOutput: String,
    // Raw code stored for submission history diffs
    code: {
      type: String,
      maxlength: 50_000,
      default: "",
    },
  },
  { timestamps: true }
);

// ── Indexes ────────────────────────────────────────────────────────────────────
// Compound index: covers listSubmissions (userId + createdAt) — the primary query
submissionSchema.index({ userId: 1, createdAt: -1 });

// Compound index: covers per-problem submission filter (userId + problemSlug)
submissionSchema.index({ userId: 1, problemSlug: 1 });

// Index: covers insights query filtering by status
submissionSchema.index({ userId: 1, status: 1 });

// Index: covers the global per-problem acceptance-rate aggregation
// (problemController.getAcceptanceRates) which groups ALL users'
// submissions by problemSlug — without this, that aggregation would
// fall back to a full collection scan as submission volume grows.
submissionSchema.index({ problemSlug: 1, status: 1 });

const Submission = mongoose.model("Submission", submissionSchema);

export default Submission;