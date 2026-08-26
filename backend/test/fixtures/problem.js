import Problem from "../../models/Problem.js";

// ── Shared integration-test fixture: a valid, schema-complete Problem ─────
//
// FIXTURE BUG FOUND & FIXED (integration-audit follow-up): five different
// integration test files each hand-rolled their own near-identical
// seedProblem() helper, and all five were missing `description` —
// Problem.description is `required: true` on the real schema (see
// backend/models/Problem.js), so every one of them failed with
// "Problem validation failed: description: Path `description` is
// required." the moment real Mongo schema validation actually ran.
//
// This is now the single source of truth for "what does a minimal-but-
// valid Problem document look like" in integration tests, specifically so
// this class of drift (a fixture silently getting out of sync with the
// production schema) can't recur independently in five different files —
// only one file to keep in sync with backend/models/Problem.js going
// forward.
//
// Every field below is either currently `required: true` on the schema,
// or included because at least one existing integration test relies on
// its value (difficulty/topic feed XP and contest scoring computations).
// Any caller can still override/add fields via `overrides`.
export async function seedProblem(overrides = {}) {
  return Problem.create({
    id: 1,
    title: "Two Sum",
    slug: "two-sum",
    functionName: "twoSum",
    difficulty: "Easy",
    topic: "Arrays",
    description:
      "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
    hiddenTestcaseSet: { enabled: true, testcases: [{ input: {}, expectedOutput: [] }] },
    ...overrides,
  });
}