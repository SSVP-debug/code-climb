import mongoose from "mongoose";

// ── Sub-schemas ───────────────────────────────────────────────────────────────

const exampleSchema = new mongoose.Schema(
  {
    input: { type: String, required: true },
    output: { type: String, required: true },
    explanation: { type: String },
  },
  { _id: false }
);

const starterCodeSchema = new mongoose.Schema(
  {
    python: { type: String, default: "" },
    javascript: { type: String, default: "" },
    java: { type: String, default: "" },
    cpp: { type: String, default: "" },
  },
  { _id: false }
);

// Declared per-language return type for the solution function. This is the
// execution contract's source of truth for statically-typed languages —
// backend/utils/generateDriverCode.js prefers this over sniffing the return
// type out of the user's submitted code. Optional/nullable so existing
// problems without it keep working via the (fallback) regex inference.
// Python/JavaScript are dynamically typed and don't need an entry here.
const returnTypeSchema = new mongoose.Schema(
  {
    java: { type: String, default: null }, // e.g. "int", "long", "boolean", "String", "int[]"
    cpp: { type: String, default: null }, // e.g. "int", "long long", "bool", "string", "vector<int>"
  },
  { _id: false }
);

// Declared per-language, per-parameter argument types for the solution
// function — the input-side counterpart to returnTypeSchema above. Added
// during the execution-pipeline audit (finding P0-1/P1-2/P1-3): the driver
// generator previously guessed argument types structurally from the JS
// testcase value, which works for numeric arrays but silently produces
// invalid Java/C++ for String, String[], boolean, and 2D-array parameters.
// Keyed by parameter name so a problem only needs to declare the
// parameters that need it — e.g. { java: { s: "String" } } for a
// single-string-argument problem. Optional/nullable, same as returnType:
// existing problems without it keep working via generateDriverCode.js's
// structural inference fallback.
const paramTypesSchema = new mongoose.Schema(
  {
    java: { type: Object, default: null }, // e.g. { s: "String", strs: "String[]", grid: "int[][]" }
    cpp: { type: Object, default: null }, // e.g. { s: "string", strs: "vector<string>", grid: "vector<vector<int>>" }
  },
  { _id: false }
);

const testcaseSchema = new mongoose.Schema(
  {
    input: { type: mongoose.Schema.Types.Mixed, required: true },
    expectedOutput: { type: mongoose.Schema.Types.Mixed, required: true },
  },
  { _id: false }
);

// ── Main schema ───────────────────────────────────────────────────────────────

const problemSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      index: true,
      lowercase: true,
      trim: true,
    },

    functionName: {
      type: String,
      required: true,
      trim: true,
    },

    difficulty: {
      type: String,
      required: true,
      enum: ["Easy", "Medium", "Hard"],
    },

    topic: {
      type: String,
      required: true,
      trim: true,
    },

    // Learning pattern taught by this problem
    pattern: {
      type: String,
      trim: true,
      default: "",
    },

    // Problem origin: core interview, variant, or Code Club original
    sourceType: {
      type: String,
      enum: ["core", "variant", "original"],
      default: "core",
    },

    // Content-library identifier for problems that belong to a separate,
    // independently-versioned collection (e.g. Code Club Edition missions:
    // "CCE-001", "CCE-002", …). null/absent for the standard interview
    // catalog. This is deliberately just a tag, not a foreign key — the
    // Problem document itself is still the single source of truth for
    // everything execution-related (starter code, testcases, judging),
    // shared identically across every collection. Campaign/story metadata
    // (chapter, mission order, narrative intro) never lives here — see
    // src/data/codeClubEdition.js.
    campaignCode: {
      type: String,
      trim: true,
      default: null,
      index: true,
      sparse: true,
    },

    description: {
      type: String,
      required: true,
    },

    examples: { type: [exampleSchema], default: [] },
    constraints: { type: [String], default: [] },
    starterCode: { type: starterCodeSchema },

    // Optional per-language return-type contract — see returnTypeSchema above.
    returnType: { type: returnTypeSchema, default: () => ({}) },

    // Optional per-language, per-parameter argument-type contract — see
    // paramTypesSchema above.
    paramTypes: { type: paramTypesSchema, default: () => ({}) },

    // How the judge compares a submission's stdout against expectedOutput
    // (see backend/controllers/judgeController.js outputsMatch()).
    // "exact"      — default. Structural equality, order matters exactly
    //                as stored (safe default, matches all prior behavior).
    // "unordered"  — the TOP-LEVEL array may be returned in any order (the
    //                problem's own description explicitly grants this,
    //                e.g. "you may return the answer in any order").
    //                Nested structure within each element is still compared
    //                in order — e.g. for a list-of-paths problem, which
    //                path comes first doesn't matter, but the sequence of
    //                nodes WITHIN a path still does. See audit finding P0-3.
    comparisonMode: {
      type: String,
      enum: ["exact", "unordered"],
      default: "exact",
    },

    // Visible testcases — returned to the client for "Run" mode
    testcases: { type: [testcaseSchema], default: [] },

    // Hidden testcases — NEVER sent to the client.
    // Only read server-side by the judge route.
    hiddentestcases: { type: [testcaseSchema], default: [] },

    // ── Metadata ──────────────────────────────────────────────────────────────

    // Rough time budget for a prepared candidate, e.g. "10–15 min"
    estimatedTime: {
      type: String,
      default: "",
    },

    // Companies known to ask this problem in interviews
    companies: {
      type: [String],
      default: [],
    },

    editorial: {
      content: {
        type: String,
        default: "",
      },
      author: {
        type: String,
        default: "Code Club",
      },
      updatedAt: {
        type: Date,
        default: null,
      },
    },

    // Slugs of thematically related problems on the platform
    relatedProblems: {
      type: [String],
      default: [],
    },

    // Progressive hints — shown one at a time on the problem page
    hints: {
      type: [
        {
          level: Number,
          text: String
        }
      ],
      default: []
    },
  },
  { timestamps: true }
);

// Strip hiddentestcases from any client-facing query
problemSchema.statics.publicFields =
  "-hiddentestcases -__v -createdAt -updatedAt";

const Problem = mongoose.model("Problem", problemSchema);

export default Problem;