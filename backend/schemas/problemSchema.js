import { z } from "zod";
import {
    SUPPORTED_LANGUAGE_KEYS,
    STATICALLY_TYPED_LANGUAGE_KEYS,
    REQUIRED_STARTER_LANGUAGE_KEYS,
} from "../config/languages.js";

export const TestcaseSchema = z.object({
    input: z.record(z.any()),
    expectedOutput: z.any(),
});

// ── Registry-validated language maps (Plan 011) ────────────────────────────
// Replaces what used to be three fixed-field object literals
// (ReturnTypeSchema/ParamTypesSchema here, plus the two inline
// `starterCode: { python: ..., javascript: ..., ... }` object schemas
// further down) — every one of those had to be hand-edited, in step with
// backend/models/Problem.js's three matching sub-schemas, for every new
// language. `languageMapSchema` instead validates keys against the SAME
// registry (backend/config/languages.js) the Mongoose side now derives
// its own Map validators from, so a new language needs zero edits to
// either file — see that file's `requiresTypeDeclaration`/
// `requiredForNewProblems` flags for how a language opts into being a
// valid key here.
//
// Deliberately `z.record(z.string(), valueSchema)` (a plain, unconstrained
// string key) rather than `z.record(z.enum(allowedKeys), valueSchema)` —
// zod v4 treats an enum-keyed record as an EXHAUSTIVE map (every enum
// value must be present), which is the opposite of what a partial,
// subset-of-languages map needs. The registry-membership check and the
// required-keys check are both done explicitly in `superRefine` instead,
// which also lets both checks report which specific key was invalid/
// missing rather than a single from generic "not an object of this
// shape" error.
function languageMapSchema({ allowedKeys, requiredKeys = [], valueSchema = z.string(), label }) {
    return z.record(z.string(), valueSchema).superRefine((obj, ctx) => {
        for (const key of Object.keys(obj)) {
            if (!allowedKeys.includes(key)) {
                ctx.addIssue({
                    code: "custom",
                    message: `"${key}" is not a registered language for ${label} (see backend/config/languages.js)`,
                    path: [key],
                });
            }
        }
        for (const key of requiredKeys) {
            if (!(key in obj)) {
                ctx.addIssue({
                    code: "custom",
                    message: `missing required ${label} for "${key}"`,
                    path: [key],
                });
            }
        }
    });
}

// Optional per-language return-type contract — see backend/models/
// Problem.js's returnTypeField. Scoped to STATICALLY_TYPED_LANGUAGE_KEYS
// (java/cpp today); no required keys — a problem may declare none, some,
// or all of them.
export const ReturnTypeSchema = languageMapSchema({
    allowedKeys: STATICALLY_TYPED_LANGUAGE_KEYS,
    label: "returnType",
}).default({});

// Per-parameter argument-type contract — see backend/models/Problem.js
// paramTypesField. Each language's value is itself an object keyed by
// parameter name (different problems have different parameter names, so
// that inner shape stays a free-form record rather than anything more
// specific).
export const ParamTypesSchema = languageMapSchema({
    allowedKeys: STATICALLY_TYPED_LANGUAGE_KEYS,
    valueSchema: z.record(z.string(), z.string()),
    label: "paramTypes",
}).default({});

// Starter code map — see backend/models/Problem.js's starterCodeField.
// Validated against every SUPPORTED_LANGUAGE_KEYS (not just the
// statically-typed ones), and REQUIRES exactly the languages flagged
// `requiredForNewProblems: true` in the registry (python/javascript/
// java/cpp today) — everything else (typescript today) is optional,
// same "starts optional until the backfill has run" shape the registry
// already gives new languages at the execution layer. Shared by both
// ProblemFolderSchema and AdminProblemCreateSchema below, replacing what
// used to be two separately hand-maintained copies of the same
// four-required-plus-one-optional object literal.
export const StarterCodeSchema = languageMapSchema({
    allowedKeys: SUPPORTED_LANGUAGE_KEYS,
    requiredKeys: REQUIRED_STARTER_LANGUAGE_KEYS,
    label: "starterCode",
});

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
        starterCode: StarterCodeSchema,
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
    starterCode: StarterCodeSchema,
    editorial: z.string().default(""),
    hints: z.array(
        z.object({
            level: z.number().int().positive(),
            text: z.string(),
        })
    ).default([]),
});