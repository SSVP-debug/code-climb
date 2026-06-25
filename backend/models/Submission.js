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
      default: 0,
      min: 0,
    },
    problemTitle: String,
    language: {
      type: String,
      enum: ["javascript", "python", "java", "cpp"],
      required: true,
    },
    status: {
      type: String,
      enum: [
        "Accepted",
        "Wrong Answer",
        "Compilation Error",
        "Runtime Error",
        "Time Limit Exceeded",
      ],
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
  },
  { timestamps: true }
);

submissionSchema.index({
  userId: 1,
  createdAt: -1,
});

submissionSchema.index({
  userId: 1,
  problemSlug: 1,
});

const Submission = mongoose.model(
  "Submission",
  submissionSchema
);



export default Submission;
