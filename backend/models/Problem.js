import mongoose from "mongoose";

// ── Sub-schemas ───────────────────────────────────────────────────────────────

const exampleSchema = new mongoose.Schema(
  {
    input:       { type: String, required: true },
    output:      { type: String, required: true },
    explanation: { type: String },
  },
  { _id: false }
);

const starterCodeSchema = new mongoose.Schema(
  {
    python:     { type: String, default: "" },
    javascript: { type: String, default: "" },
    java:       { type: String, default: "" },
    cpp:        { type: String, default: "" },
  },
  { _id: false }
);

const testcaseSchema = new mongoose.Schema(
  {
    input:          { type: mongoose.Schema.Types.Mixed, required: true },
    expectedOutput: { type: mongoose.Schema.Types.Mixed, required: true },
  },
  { _id: false }
);

// ── Main schema ───────────────────────────────────────────────────────────────

const problemSchema = new mongoose.Schema(
  {
    id: {
      type:     Number,
      required: true,
      unique:   true,
      index:    true,
    },

    title: {
      type:     String,
      required: true,
      trim:     true,
    },

    slug: {
      type:      String,
      required:  true,
      unique:    true,
      index:     true,
      lowercase: true,
      trim:      true,
    },

    functionName: {
      type:     String,
      required: true,
      trim:     true,
    },

    difficulty: {
      type:     String,
      required: true,
      enum:     ["Easy", "Medium", "Hard"],
    },

    topic: {
      type:     String,
      required: true,
      trim:     true,
    },

    // Learning pattern taught by this problem
    pattern: {
      type:    String,
      trim:    true,
      default: "",
    },

    // Problem origin: core interview, variant, or Code Club original
    sourceType: {
      type:    String,
      enum:    ["core", "variant", "original"],
      default: "core",
    },

    description: {
      type:     String,
      required: true,
    },

    examples:    { type: [exampleSchema],  default: [] },
    constraints: { type: [String],         default: [] },
    starterCode: { type: starterCodeSchema },

    // Visible testcases — returned to the client for "Run" mode
    testcases: { type: [testcaseSchema], default: [] },

    // Hidden testcases — NEVER sent to the client.
    // Only read server-side by the judge route.
    hiddentestcases: { type: [testcaseSchema], default: [] },
  },
  { timestamps: true }
);

// Strip hiddentestcases from any client-facing query
problemSchema.statics.publicFields =
  "-hiddentestcases -__v -createdAt -updatedAt";

const Problem = mongoose.model("Problem", problemSchema);

export default Problem;
