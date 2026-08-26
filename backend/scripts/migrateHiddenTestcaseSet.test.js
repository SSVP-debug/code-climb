// Content & Execution Architecture, Phase 3 — unit tests for
// migrateHiddenTestcaseSet.js's core logic, against a fake in-memory
// MongoDB collection (no real database needed). Same "export testable
// core logic, keep the CLI thin" pattern as
// scripts/checkProblemsFolderDrift.test.js.
import { describe, expect, it } from "vitest";
import { migrateHiddenTestcaseSetCollection } from "./migrateHiddenTestcaseSet.js";

function makeFakeCollection(initialDocs) {
  const docs = initialDocs.map((d, i) => ({ _id: d._id ?? `id${i}`, ...d }));

  return {
    _docs: docs,
    find(query, opts) {
      const matched = docs.filter((d) => {
        if (query.hiddentestcases?.$exists) return "hiddentestcases" in d;
        return true;
      });
      const projected = matched.map((d) => {
        if (!opts?.projection) return { ...d };
        const out = {};
        for (const key of Object.keys(opts.projection)) {
          if (key in d) out[key] = d[key];
        }
        out._id = d._id;
        return out;
      });
      return { toArray: async () => projected };
    },
    async updateOne(query, update) {
      const doc = docs.find((d) => d._id === query._id);
      if (!doc) return { matchedCount: 0 };
      Object.assign(doc, update.$set);
      return { matchedCount: 1, modifiedCount: 1 };
    },
    async findOne(query, opts) {
      const doc = docs.find((d) => d._id === query._id);
      if (!doc) return null;
      if (!opts?.projection) return { ...doc };
      const out = { _id: doc._id };
      for (const key of Object.keys(opts.projection)) {
        if (key in doc) out[key] = doc[key];
      }
      return out;
    },
  };
}

const noopLog = () => {};

describe("migrateHiddenTestcaseSetCollection", () => {
  it("wraps a legacy hiddentestcases array into hiddenTestcaseSet with enabled: true, preserving the old field", async () => {
    const collection = makeFakeCollection([
      { slug: "two-sum", hiddentestcases: [{ input: {}, expectedOutput: 1 }, { input: {}, expectedOutput: 2 }] },
    ]);

    const result = await migrateHiddenTestcaseSetCollection(collection, { log: noopLog });

    expect(result).toEqual({ migrated: 1, alreadyMigrated: 0, mismatches: [] });
    const doc = collection._docs[0];
    expect(doc.hiddenTestcaseSet).toEqual({
      enabled: true,
      testcases: [{ input: {}, expectedOutput: 1 }, { input: {}, expectedOutput: 2 }],
    });
    // Point 1 of the script's safety design: the old field is NOT removed.
    expect(doc).toHaveProperty("hiddentestcases");
  });

  it("preserves every testcase's data exactly (deep equality, not just count)", async () => {
    const richTestcase = { input: { nums: [3, 3], target: 6 }, expectedOutput: [0, 1] };
    const collection = makeFakeCollection([
      { slug: "two-sum", hiddentestcases: [richTestcase] },
    ]);

    await migrateHiddenTestcaseSetCollection(collection, { log: noopLog });

    expect(collection._docs[0].hiddenTestcaseSet.testcases[0]).toEqual(richTestcase);
  });

  it("skips (but count-verifies) a document that already has a hiddenTestcaseSet, without overwriting an existing enabled:false decision", async () => {
    const collection = makeFakeCollection([
      {
        slug: "already-migrated",
        hiddentestcases: [{ input: {}, expectedOutput: 1 }],
        hiddenTestcaseSet: { enabled: false, testcases: [{ input: {}, expectedOutput: 1 }] },
      },
    ]);

    const result = await migrateHiddenTestcaseSetCollection(collection, { log: noopLog });

    expect(result).toEqual({ migrated: 0, alreadyMigrated: 1, mismatches: [] });
    expect(collection._docs[0].hiddenTestcaseSet.enabled).toBe(false);
  });

  it("flags a mismatch if an already-migrated document's testcase count differs from the legacy field", async () => {
    const collection = makeFakeCollection([
      {
        slug: "drifted",
        hiddentestcases: [{ input: {}, expectedOutput: 1 }, { input: {}, expectedOutput: 2 }],
        hiddenTestcaseSet: { enabled: true, testcases: [{ input: {}, expectedOutput: 1 }] },
      },
    ]);

    const result = await migrateHiddenTestcaseSetCollection(collection, { log: noopLog });

    expect(result.mismatches).toHaveLength(1);
    expect(result.mismatches[0]).toMatchObject({ slug: "drifted", legacyCount: 2, newCount: 1 });
  });

  it("dry-run reports what it would do without writing anything", async () => {
    const collection = makeFakeCollection([
      { slug: "two-sum", hiddentestcases: [{ input: {}, expectedOutput: 1 }] },
    ]);

    const result = await migrateHiddenTestcaseSetCollection(collection, { dryRun: true, log: noopLog });

    expect(result.migrated).toBe(1);
    expect(collection._docs[0]).not.toHaveProperty("hiddenTestcaseSet");
  });

  it("ignores documents that never had a legacy hiddentestcases field at all", async () => {
    const collection = makeFakeCollection([
      { slug: "already-clean", hiddenTestcaseSet: { enabled: true, testcases: [] } },
    ]);

    const result = await migrateHiddenTestcaseSetCollection(collection, { log: noopLog });

    expect(result).toEqual({ migrated: 0, alreadyMigrated: 0, mismatches: [] });
  });

  it("handles multiple documents independently in a single pass", async () => {
    const collection = makeFakeCollection([
      { slug: "a", hiddentestcases: [{ input: {}, expectedOutput: 1 }] },
      { slug: "b", hiddentestcases: [] },
      { slug: "c", hiddenTestcaseSet: { enabled: true, testcases: [] } }, // no legacy field
    ]);

    const result = await migrateHiddenTestcaseSetCollection(collection, { log: noopLog });

    expect(result).toEqual({ migrated: 2, alreadyMigrated: 0, mismatches: [] });
    expect(collection._docs.find((d) => d.slug === "a").hiddenTestcaseSet.testcases).toHaveLength(1);
    expect(collection._docs.find((d) => d.slug === "b").hiddenTestcaseSet.testcases).toHaveLength(0);
  });

  it("flags a mismatch (does not throw) if the document disappears between read and write", async () => {
    const collection = makeFakeCollection([
      { slug: "vanishing", hiddentestcases: [{ input: {}, expectedOutput: 1 }] },
    ]);
    // Simulate deletion between the read and the write.
    collection.updateOne = async () => ({ matchedCount: 0 });

    const result = await migrateHiddenTestcaseSetCollection(collection, { log: noopLog });

    expect(result.migrated).toBe(0);
    expect(result.mismatches).toEqual([
      { slug: "vanishing", reason: "document disappeared between read and write" },
    ]);
  });
});
