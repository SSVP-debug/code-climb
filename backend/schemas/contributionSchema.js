import { z } from "zod";

/**
 * schemas/contributionSchema.js — request-body validation for Contribution
 * Infrastructure (Phase 2F) routes, same reuse style as
 * opportunitySchema.js/problemSchema.js.
 *
 * `kind` is now a closed set — "new_problem" and "testcase_improvement" —
 * matching models/Contribution.js's own enum (kept in sync manually;
 * update both together if a third kind is ever added). Each kind's
 * `payload` is validated against its own shape via a Zod discriminated
 * union rather than a single loose `z.record(z.any())` — this is the
 * payload-shape validation Bunny asked to complete once the kind
 * taxonomy itself was decided.
 *
 * Field choices below deliberately reuse existing Problem-model field
 * names/shapes (models/Problem.js's title/difficulty/topic/functionName,
 * exampleSchema's input/output/explanation, testcaseSchema's
 * input/expectedOutput) rather than inventing parallel naming — a
 * contribution that gets approved is, functionally, either a new Problem
 * document or an addition to an existing one's testcases, so its payload
 * shape should already look like what it's headed toward becoming. Note
 * this validates SHAPE only, not admission-worthiness (e.g. it doesn't
 * check functionName isn't already taken, or that the referenced problem
 * slug in a testcase_improvement actually exists) — that's still the
 * (not-yet-built) admin review step's job, not this schema's.
 */

const ExampleInputSchema = z.object({
  input: z.string().trim().min(1),
  output: z.string().trim().min(1),
  explanation: z.string().trim().max(2000).optional(),
});

// Mirrors models/Problem.js's testcaseSchema exactly: input/expectedOutput
// are intentionally z.any() (Mixed at the DB layer too) because a
// testcase's shape is problem-specific (a single value, an array, a 2D
// grid, ...) — there is no single valid JSON shape to check here beyond
// "present."
const GradingTestcaseSchema = z.object({
  input: z.any(),
  expectedOutput: z.any(),
});

const NewProblemPayloadSchema = z.object({
  title: z.string().trim().min(1, "title is required").max(200),
  difficulty: z.enum(["Easy", "Medium", "Hard"]),
  topic: z.string().trim().min(1, "topic is required").max(100),
  functionName: z.string().trim().min(1, "functionName is required").max(100),
  // The problem statement itself (markdown/plain text) — no existing
  // Problem-model field name to mirror 1:1 (Problem.js's own description
  // content lives elsewhere in that model), so this is the one genuinely
  // new field name in this file.
  statement: z.string().trim().min(1, "statement is required").max(20_000),
  examples: z.array(ExampleInputSchema).min(1, "at least one example is required").max(10),
  testcases: z
    .array(GradingTestcaseSchema)
    .min(1, "at least one grading testcase is required")
    .max(200),
});

const TestcaseImprovementPayloadSchema = z.object({
  // References an existing Problem by slug, not _id — matches every
  // other public-facing Problem reference in this codebase (routes are
  // keyed by :slug, not :id).
  problemSlug: z.string().trim().min(1, "problemSlug is required").max(150),
  testcases: z
    .array(GradingTestcaseSchema)
    .min(1, "at least one testcase is required")
    .max(200),
  reason: z.string().trim().max(2000).optional(),
});

export const ContributionCreateSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("new_problem"), payload: NewProblemPayloadSchema }),
  z.object({ kind: z.literal("testcase_improvement"), payload: TestcaseImprovementPayloadSchema }),
]);

export const ContributionRejectSchema = z.object({
  reason: z.string().trim().max(1000).nullable().optional().default(null),
});

export const ContributionRetrySchema = z.object({
  limit: z.coerce.number().int().positive().max(1000).optional(),
});