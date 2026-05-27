import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    problemSlug: {
      type: String,
      required: true,
    },
    statusDescription: {
      type: String,
    },

    judge0Time: {
      type: String,
    },

    memory: {
      type: Number,
    },
    problemTitle: String,
    language: String,
    status: String,
    passed: Number,
    total: Number,
    visiblePassed: Number,
    hiddenPassed: Number,
    executionTime: String,
    expectedOutput: mongoose.Schema.Types.Mixed,
    actualOutput: String,
  },
  { timestamps: true }
);

const Submission = mongoose.model(
  "Submission",
  submissionSchema
);

export default Submission;
