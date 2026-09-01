import { describe, expect, it, beforeAll, afterEach, afterAll } from "vitest";
import { startTestMongo, clearTestMongo, stopTestMongo } from "../test/mongoMemoryServer.js";
import Problem from "./Problem.js";
import Submission from "./Submission.js";

// ── Minimum-viable versioning (Content & Execution Architecture cross-check
// follow-up) ──────────────────────────────────────────────────────────────
//
// Real Mongo required, not the mocked-model unit tier: this exercises
// actual Mongoose document/query middleware (`pre("save")` and
// `pre("findOneAndUpdate")` — see Problem.js's own comment on why both are
// needed), which does not run against a hand-constructed mock document the
// way the rest of this file's sibling unit tests (adminProblemController,
// etc.) get away with. Blocked from running in this sandbox by the same
// `fastdl.mongodb.org` network restriction as every other
// `*.integration.test.js` file here — see backend/test/README.md.

function baseProblem(overrides = {}) {
  return {
    id: Math.floor(Math.random() * 1_000_000),
    title: "Two Sum",
    slug: `two-sum-${Math.random().toString(36).slice(2)}`,
    functionName: "twoSum",
    difficulty: "Easy",
    topic: "Arrays",
    ...overrides,
  };
}

describe("Problem.contentVersion (real Mongo)", () => {
  beforeAll(async () => {
    await startTestMongo();
  });

  afterEach(async () => {
    await clearTestMongo();
  });

  afterAll(async () => {
    await stopTestMongo();
  });

  it("starts at 1 for a brand-new document", async () => {
    const doc = await Problem.create(baseProblem());
    expect(doc.contentVersion).toBe(1);
  });

  it("bumps on .save() when hiddenTestcaseSet changes", async () => {
    const doc = await Problem.create(baseProblem());
    expect(doc.contentVersion).toBe(1);

    doc.hiddenTestcaseSet.testcases = [{ input: "1", expectedOutput: "1" }];
    await doc.save();

    expect(doc.contentVersion).toBe(2);
  });

  it("bumps on .save() when hiddenTestcaseSet.enabled changes (the admin toggle path)", async () => {
    const doc = await Problem.create(baseProblem());

    doc.hiddenTestcaseSet.enabled = false;
    await doc.save();

    expect(doc.contentVersion).toBe(2);
  });

  it("bumps on .save() when comparisonMode changes", async () => {
    const doc = await Problem.create(baseProblem());

    doc.comparisonMode = "unordered";
    await doc.save();

    expect(doc.contentVersion).toBe(2);
  });

  it("does NOT bump on .save() for a cosmetic field (topic)", async () => {
    const doc = await Problem.create(baseProblem());

    doc.topic = "Hash Table";
    await doc.save();

    expect(doc.contentVersion).toBe(1);
  });

  it("does NOT bump on a re-save with no actual changes", async () => {
    const doc = await Problem.create(baseProblem());

    await doc.save();

    expect(doc.contentVersion).toBe(1);
  });

  it("bumps via findOneAndUpdate when hiddenTestcaseSet content actually differs (a real catalog content edit)", async () => {
    const created = await Problem.create(
      baseProblem({ hiddenTestcaseSet: { enabled: true, testcases: [{ input: "1", expectedOutput: "1" }] } })
    );

    const updated = await Problem.findOneAndUpdate(
      { slug: created.slug },
      { $set: { hiddenTestcaseSet: { enabled: true, testcases: [{ input: "2", expectedOutput: "2" }] } } },
      { new: true }
    );

    expect(updated.contentVersion).toBe(2);
  });

  it("does NOT bump via findOneAndUpdate when hiddenTestcaseSet is re-set to an IDENTICAL value (the seedProblems.js reseed case)", async () => {
    const sameTestcases = [{ input: "1", expectedOutput: "1" }];
    const created = await Problem.create(
      baseProblem({ hiddenTestcaseSet: { enabled: true, testcases: sameTestcases } })
    );

    // Simulates seedProblems.js's own behavior: it always writes a freshly
    // reconstructed hiddenTestcaseSet object on every reseed, even when the
    // underlying content hasn't changed at all — the version bump must be
    // keyed on actual value equality, not "was this field present in $set."
    const updated = await Problem.findOneAndUpdate(
      { slug: created.slug },
      { $set: { hiddenTestcaseSet: { enabled: true, testcases: [{ input: "1", expectedOutput: "1" }] } } },
      { new: true }
    );

    expect(updated.contentVersion).toBe(1);
  });

  it("does not crash and starts at the default version on an upsert-created document", async () => {
    const slug = `brand-new-${Math.random().toString(36).slice(2)}`;

    const created = await Problem.findOneAndUpdate(
      { slug },
      { $set: { ...baseProblem({ slug }), comparisonMode: "unordered" } },
      { upsert: true, new: true }
    );

    expect(created.contentVersion).toBe(1);
  });

  it("does NOT bump via findOneAndUpdate for an update that doesn't touch any grading-contract field", async () => {
    const created = await Problem.create(baseProblem());

    const updated = await Problem.findOneAndUpdate(
      { slug: created.slug },
      { $set: { topic: "Hash Table" } },
      { new: true }
    );

    expect(updated.contentVersion).toBe(1);
  });
});

describe("Submission.problemVersion (real Mongo)", () => {
  beforeAll(async () => {
    await startTestMongo();
  });

  afterEach(async () => {
    await clearTestMongo();
  });

  afterAll(async () => {
    await stopTestMongo();
  });

  function baseSubmission(overrides = {}) {
    return {
      userId: "000000000000000000000001",
      problemSlug: "two-sum",
      problemTitle: "Two Sum",
      language: "python",
      status: "Accepted",
      code: "print(1)",
      ...overrides,
    };
  }

  it("defaults to null when not provided (pre-existing submissions)", async () => {
    const doc = await Submission.create(baseSubmission());
    expect(doc.problemVersion).toBeNull();
  });

  it("persists whatever contentVersion was captured at judge time", async () => {
    const doc = await Submission.create(baseSubmission({ problemVersion: 3 }));
    expect(doc.problemVersion).toBe(3);
  });
});