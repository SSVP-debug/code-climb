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

    // ── Admin console content-pipeline tag (plan 006) ──────────────────────
    // Distinguishes problems that originate from the JS/folder content
    // pipeline (src/data/problems.js → seedProblems.js / importProblems.js)
    // from problems created directly through the admin console. "catalog"
    // problems are overwritten on every seed run by design — never allow
    // full edits to them from the admin UI, only the small safelisted set
    // (topic/pattern/sourceType — see adminProblemController.js). New
    // problems created via the admin UI explicitly set this to "admin".
    // seedProblems.js never sets this field itself (it only $sets whatever
    // fields are present in each problems.js entry, and this isn't one of
    // them), so it correctly defaults to "catalog" for everything seeded
    // that way — verified by reading seedProblems.js; needed zero changes.
    // See admin-console-plans/plans/006-problem-management-ui.md for the
    // full rationale.
    adminSource: {
      type: String,
      enum: ["catalog", "admin"],
      default: "catalog",
      index: true,
    },

    // ── Availability switch (Content & Execution Architecture, Phase 1) ────
    // The authoritative on/off switch for a problem. Defaults to `true` so
    // every existing problem stays exactly as reachable as it always was —
    // this field is additive, not a re-interpretation of anything that came
    // before it. When `false`, the problem must behave as if it doesn't
    // exist to ordinary discovery/Run/Submit: see problemController.js
    // (getProblems/getProblemBySlug) and judgeController.js
    // (runHandler/submitHandler), which both gate on this the same way
    // they already gate on `visibility === "contest"` above — same generic
    // 404 shape, same "don't confirm existence to someone not entitled to
    // it" reasoning, deliberately reusing that existing pattern rather than
    // introducing a new access-policy concept.
    //
    // Distinct from `visibility`: `visibility` controls WHO can currently
    // see an otherwise-live problem (contest gating, time-boxed); `enabled`
    // is a hard kill switch with no notion of "opens up later." The two are
    // independent and both checked wherever a problem is resolved.
    //
    // Note for admins editing a "catalog" problem (see adminSource above):
    // unlike topic/pattern/sourceType, `enabled` is never reverted by a
    // seed run — src/data/problems.js entries don't declare this field, so
    // seedProblems.js's `$set: problem` never touches it once toggled here.
    enabled: {
      type: Boolean,
      default: true,
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

    // Opt-in for the "operation-sequence" contract (constructor + a
    // sequence of method calls on a stateful object — e.g. LRUCache,
    // MinStack, Trie) rather than the default single-call contract every
    // other problem uses. See backend/utils/operationSequenceDriver.js and
    // audit finding P0-2. `resultMode` controls whether void-returning
    // calls contribute a `null` entry to the output array ("all") or are
    // omitted entirely ("returningOnly") — the real problem data was
    // authored against both conventions inconsistently (see the Phase 4
    // changes doc), so this is declared per-problem rather than assumed.
    operationSequence: {
      enabled: { type: Boolean, default: false },
      resultMode: { type: String, enum: ["all", "returningOnly"], default: "all" },
    },

    // Visible testcases — returned to the client for "Run" mode
    testcases: { type: [testcaseSchema], default: [] },

    // ── Hidden testcases (Content & Execution Architecture, Phase 3) ───────
    // NEVER sent to the client — only read server-side by submitHandler
    // (see judgeController.js). Restructured from a bare
    // `hiddentestcases: [...]` array into a sub-document so a set of
    // hidden tests can be independently enabled/disabled without deleting
    // the data — mirrors the reasoning behind `Problem.enabled` above,
    // one level down.
    //
    // `enabled` defaults to `true` so every existing problem's hidden
    // tests keep grading exactly as before — this is additive, the same
    // "don't reinterpret existing behavior" principle as `Problem.enabled`.
    // When `false`, submitHandler must fail CLOSED (return a 4xx grading-
    // unavailable response), never grade against visible tests only and
    // never silently return Accepted — see submitHandler's own comment at
    // the point it reads this field.
    //
    // MIGRATION NOTE: this field was previously a bare array named
    // `hiddentestcases`. See scripts/migrateHiddenTestcaseSet.js for the
    // one-time migration that copies existing data into this shape. That
    // migration deliberately does NOT delete the old `hiddentestcases`
    // field from already-migrated documents (rollback safety) — every
    // read path that used to exclude `hiddentestcases` now excludes BOTH
    // field names (see publicFields below and problemController.js) so
    // the leftover legacy field can never leak even though it isn't
    // removed. A later, separate cleanup pass can drop it once the
    // restructuring has been live and verified for a while.
    //
    // Also required a small adapter in scripts/seedProblems.js and
    // scripts/importProblems.js (the two writers of this field) — both
    // explicitly out of scope for the broader "consolidate problem
    // content sources" project, but unavoidably touched here because
    // Mongoose's default strict-schema behavior would otherwise silently
    // drop their writes to a field this schema no longer declares.
    hiddenTestcaseSet: {
      enabled: { type: Boolean, default: true },
      testcases: { type: [testcaseSchema], default: [] },
    },

    // ── Contest visibility (Fest Readiness Audit, P0-2) ────────────────────
    // "public"  — default. Behaves exactly as every problem always has:
    //              listed in the catalog, freely reachable by slug, usable
    //              in recommendations/editorial/hints/weekly-challenge, and
    //              (if an organizer includes it) also usable in a contest —
    //              in which case it's simply not private, same as today.
    // "contest" — authored specifically for one or more private contests
    //              (see Contest.problemSlugs, the only link — this is
    //              deliberately just a visibility tag, not a foreign key,
    //              same pattern as campaignCode above). Excluded from the
    //              public catalog/search/recommendations/weekly-challenge,
    //              and from the problem-detail, editorial, hints, and
    //              Run/Submit endpoints, UNLESS the requester is that
    //              contest's organizer (any time) or a joined participant
    //              while the contest is active — or the contest has ended,
    //              at which point it opens up to everyone. See
    //              services/contestProblemAccess.js for the enforcement
    //              logic and the full policy write-up.
    //
    // There is currently no in-app authoring UI for this — a problem is
    // marked "contest" via the existing seed/import scripts
    // (scripts/seedProblems.js / scripts/importProblems.js), same as any
    // other problem field. Organizers building a contest still SELECT
    // from whatever problems already exist (public or contest-tagged);
    // this field only controls whether a given problem is also reachable
    // outside that selection.
    visibility: {
      type: String,
      enum: ["public", "contest"],
      default: "public",
      index: true,
    },

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

// Strip both the current and (pre-migration/rollback-safety) legacy
// hidden-testcase field names from any client-facing query. Content &
// Execution Architecture, Phase 3: excluding both — not just the new
// hiddenTestcaseSet — is deliberate belt-and-suspenders: the migration
// (scripts/migrateHiddenTestcaseSet.js) intentionally leaves the old
// `hiddentestcases` field physically in place on already-migrated
// documents for rollback safety rather than immediately deleting it, so
// every read path that used to exclude it must keep excluding it too,
// permanently, until a later, separate cleanup pass actually removes the
// legacy field from the database. There must never be a moment where a
// document could have data under the old field name that isn't excluded
// here.
problemSchema.statics.publicFields =
  "-hiddentestcases -hiddenTestcaseSet -__v -createdAt -updatedAt";

// Compound index covering the two boolean/enum catalog-filter fields
// checked on every normal-discovery read (getProblems/getProblemBySlug) —
// `enabled` (Phase 1) and `visibility` (contest gating, pre-existing).
// Both are filtered together in practice, so one compound index serves
// both rather than two single-field indexes competing for the planner's
// choice. Not performance-critical at today's problem count, but cheap to
// add now and avoids a later migration once the catalog grows.
problemSchema.index({ enabled: 1, visibility: 1 });

const Problem = mongoose.model("Problem", problemSchema);

export default Problem;