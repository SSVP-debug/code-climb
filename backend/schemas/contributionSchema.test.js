import { describe, expect, it } from "vitest";
import {
  ContributionCreateSchema,
  ContributionRejectSchema,
  ContributionRetrySchema,
} from "./contributionSchema.js";

const validExample = { input: "[2,7,11,15], 9", output: "[0,1]" };
const validTestcase = { input: [[2, 7, 11, 15], 9], expectedOutput: [0, 1] };

function validNewProblemPayload(overrides = {}) {
  return {
    title: "Two Sum Variant",
    difficulty: "Easy",
    topic: "Arrays",
    functionName: "twoSumVariant",
    statement: "Given an array...",
    examples: [validExample],
    testcases: [validTestcase],
    ...overrides,
  };
}

function validTestcaseImprovementPayload(overrides = {}) {
  return {
    problemSlug: "two-sum",
    testcases: [validTestcase],
    ...overrides,
  };
}

describe("ContributionCreateSchema — kind is a closed enum", () => {
  it("accepts kind: new_problem with a valid payload", () => {
    const result = ContributionCreateSchema.safeParse({
      kind: "new_problem",
      payload: validNewProblemPayload(),
    });
    expect(result.success).toBe(true);
  });

  it("accepts kind: testcase_improvement with a valid payload", () => {
    const result = ContributionCreateSchema.safeParse({
      kind: "testcase_improvement",
      payload: validTestcaseImprovementPayload(),
    });
    expect(result.success).toBe(true);
  });

  it("rejects an unrecognized kind value", () => {
    const result = ContributionCreateSchema.safeParse({
      kind: "editorial_content", // not a supported kind
      payload: {},
    });
    expect(result.success).toBe(false);
  });

  it("rejects a missing kind", () => {
    const result = ContributionCreateSchema.safeParse({ payload: validNewProblemPayload() });
    expect(result.success).toBe(false);
  });
});

describe("ContributionCreateSchema — new_problem payload shape", () => {
  it.each([
    ["title", { title: "" }],
    ["difficulty", { difficulty: "Extreme" }], // not in Easy/Medium/Hard
    ["topic", { topic: "" }],
    ["functionName", { functionName: "" }],
    ["statement", { statement: "" }],
  ])("rejects when %s is invalid", (_field, overrides) => {
    const result = ContributionCreateSchema.safeParse({
      kind: "new_problem",
      payload: validNewProblemPayload(overrides),
    });
    expect(result.success).toBe(false);
  });

  it("rejects an empty examples array", () => {
    const result = ContributionCreateSchema.safeParse({
      kind: "new_problem",
      payload: validNewProblemPayload({ examples: [] }),
    });
    expect(result.success).toBe(false);
  });

  it("rejects an empty testcases array", () => {
    const result = ContributionCreateSchema.safeParse({
      kind: "new_problem",
      payload: validNewProblemPayload({ testcases: [] }),
    });
    expect(result.success).toBe(false);
  });

  it("rejects an example missing output", () => {
    const result = ContributionCreateSchema.safeParse({
      kind: "new_problem",
      payload: validNewProblemPayload({ examples: [{ input: "x" }] }),
    });
    expect(result.success).toBe(false);
  });

  it("accepts a testcase with array/object input and output shapes (mirrors real grading testcases)", () => {
    const result = ContributionCreateSchema.safeParse({
      kind: "new_problem",
      payload: validNewProblemPayload({
        testcases: [{ input: { grid: [[1, 2], [3, 4]] }, expectedOutput: 10 }],
      }),
    });
    expect(result.success).toBe(true);
  });

  it("rejects a testcase_improvement-shaped payload under kind: new_problem (cross-kind mismatch)", () => {
    const result = ContributionCreateSchema.safeParse({
      kind: "new_problem",
      payload: validTestcaseImprovementPayload(),
    });
    expect(result.success).toBe(false);
  });
});

describe("ContributionCreateSchema — testcase_improvement payload shape", () => {
  it("rejects a missing problemSlug", () => {
    const result = ContributionCreateSchema.safeParse({
      kind: "testcase_improvement",
      payload: validTestcaseImprovementPayload({ problemSlug: "" }),
    });
    expect(result.success).toBe(false);
  });

  it("rejects an empty testcases array", () => {
    const result = ContributionCreateSchema.safeParse({
      kind: "testcase_improvement",
      payload: validTestcaseImprovementPayload({ testcases: [] }),
    });
    expect(result.success).toBe(false);
  });

  it("accepts an optional reason", () => {
    const result = ContributionCreateSchema.safeParse({
      kind: "testcase_improvement",
      payload: validTestcaseImprovementPayload({ reason: "Missing an edge case with duplicates." }),
    });
    expect(result.success).toBe(true);
  });

  it("rejects a new_problem-shaped payload under kind: testcase_improvement (cross-kind mismatch)", () => {
    const result = ContributionCreateSchema.safeParse({
      kind: "testcase_improvement",
      payload: validNewProblemPayload(),
    });
    expect(result.success).toBe(false);
  });
});

describe("ContributionRejectSchema", () => {
  it("defaults reason to null when omitted", () => {
    const result = ContributionRejectSchema.safeParse({});
    expect(result.success).toBe(true);
    expect(result.data.reason).toBeNull();
  });

  it("accepts an explicit reason string", () => {
    const result = ContributionRejectSchema.safeParse({ reason: "Duplicate." });
    expect(result.success).toBe(true);
    expect(result.data.reason).toBe("Duplicate.");
  });
});

describe("ContributionRetrySchema", () => {
  it("accepts an omitted limit", () => {
    const result = ContributionRetrySchema.safeParse({});
    expect(result.success).toBe(true);
    expect(result.data.limit).toBeUndefined();
  });

  it("coerces a numeric-string limit", () => {
    const result = ContributionRetrySchema.safeParse({ limit: "50" });
    expect(result.success).toBe(true);
    expect(result.data.limit).toBe(50);
  });

  it("rejects a non-positive limit", () => {
    const result = ContributionRetrySchema.safeParse({ limit: 0 });
    expect(result.success).toBe(false);
  });
});