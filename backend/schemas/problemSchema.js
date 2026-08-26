import { z } from "zod";

export const TestcaseSchema = z.object({
    input: z.record(z.any()),
    expectedOutput: z.any(),
});

export const ReturnTypeSchema = z.object({
    java: z.string().nullable().default(null),
    cpp: z.string().nullable().default(null),
}).default({});

// Per-parameter argument-type contract — see backend/models/Problem.js
// paramTypesSchema. Keyed by parameter name rather than a fixed shape,
// since different problems have different parameter names.
export const ParamTypesSchema = z.object({
    java: z.record(z.string(), z.string()).nullable().default(null),
    cpp: z.record(z.string(), z.string()).nullable().default(null),
}).default({});

export const MetaSchema = z.object({
    id: z.number().int().positive(),
    slug: z.string().min(1),
    title: z.string().min(1),
    difficulty: z.enum([
        "Easy",
        "Medium",
        "Hard",
    ]),
    topic: z.string().min(1),
    pattern: z.string().default(""),
    sourceType: z.string().default("core"),
    functionName: z.string().min(1),
    estimatedTime: z.string().default(""),
    companies: z.array(z.string()).default([]),
    relatedProblems: z.array(z.string()).default([]),
    // Optional per-language execution contract — see backend/models/Problem.js
    // returnTypeSchema. Absent for problems that don't need it (dynamically
    // typed languages, or statically-typed methods returning a type the
    // regex-inference fallback in generateDriverCode.js already handles).
    returnType: ReturnTypeSchema,
    // Optional per-language, per-parameter execution contract — see
    // backend/models/Problem.js paramTypesSchema.
    paramTypes: ParamTypesSchema,
    // Output-comparison mode — see backend/models/Problem.js comparisonMode.
    comparisonMode: z.enum(["exact", "unordered"]).default("exact"),
    // Operation-sequence contract opt-in — see backend/models/Problem.js
    // operationSequence and audit finding P0-2.
    operationSequence: z.object({
        enabled: z.boolean().default(false),
        resultMode: z.enum(["all", "returningOnly"]).default("all"),
    }).default({}),
});

export const ProblemFolderSchema =
    z.object({
        meta: MetaSchema,
        description: z.string(),
        visibleTestcases: z.array(
            TestcaseSchema
        ),
        hiddenTestcases: z.array(
            TestcaseSchema
        ),
        starterCode: z.object({
            python: z.string(),
            javascript: z.string(),
            java: z.string(),
            cpp: z.string(),
        }),
        editorial: z.string().default(""),
        hints: z.array(
            z.object({
                level: z.number().int().positive(),
                text: z.string(),
            })
        ).default([]),
    });

// ── Admin console create-payload schema (plan 006) ──────────────────────────
// Reuses MetaSchema wholesale via .extend() — every metadata field's actual
// validation rule (required-ness, type, enum) comes from MetaSchema above,
// not re-declared here, so there's exactly one place these rules can drift.
// What differs from ProblemFolderSchema is purely SHAPE, not rules: this is
// flat (no nested `meta` key) and uses Problem.js's actual Mongoose field
// names (`testcases`/`hiddenTestcaseSet`) instead of the folder-representation
// names (`visibleTestcases`/`hiddenTestcases`) — needed because the admin
// UI's create payload maps directly onto Mongoose's Problem document, not
// onto a problems/<slug>/ folder's file layout.
//
// Known pre-existing drift between this schema family and backend/models/
// Problem.js's Mongoose schema, found while implementing this plan (flagged
// per plan 006's escape hatch rather than silently resolved): Problem.js's
// `starterCode` is NOT `required: true` at the Mongoose level (a problem
// document can technically exist with no starterCode at all, with each
// language defaulting to ""), but both this schema and ProblemFolderSchema
// require the full 4-language object. This schema deliberately keeps the
// STRICTER rule (matching ProblemFolderSchema, not loosening to match
// Mongoose) — plan 006 explicitly asks for admin-created problems to be
// "at least as well-formed as a catalog one," and Mongoose's own leniency
// here looks like an oversight (a problem with no starter code in any
// language isn't really usable) rather than an intentional allowance.
export const AdminProblemCreateSchema = MetaSchema.extend({
    description: z.string().min(1),
    testcases: z.array(TestcaseSchema).default([]),
    // Content & Execution Architecture, Phase 3: was a flat
    // `hiddentestcases: z.array(TestcaseSchema).default([])`, matching
    // Problem.js's old field name/shape 1:1. Now matches Problem.js's
    // restructured `hiddenTestcaseSet` sub-document instead — this schema
    // is the admin-console API's own contract (adminSource: "admin"
    // problems, not the folder/catalog authoring pipeline), so it moves
    // in lockstep with Problem.js rather than needing a separate adapter
    // the way seedProblems.js/importProblems.js do.
    hiddenTestcaseSet: z.object({
        enabled: z.boolean().default(true),
        testcases: z.array(TestcaseSchema).default([]),
    }).default({}),
    starterCode: z.object({
        python: z.string(),
        javascript: z.string(),
        java: z.string(),
        cpp: z.string(),
    }),
    editorial: z.string().default(""),
    hints: z.array(
        z.object({
            level: z.number().int().positive(),
            text: z.string(),
        })
    ).default([]),
});