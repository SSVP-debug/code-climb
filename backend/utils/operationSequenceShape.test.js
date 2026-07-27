import { describe, expect, it } from "vitest";
import { identifyOperationSequence } from "./operationSequenceShape.js";

describe("identifyOperationSequence — Shape A (embedded op name)", () => {
  it("detects lru-cache's shape: { capacity, operations: [[opName,...args],...] }", () => {
    const result = identifyOperationSequence({
      capacity: 2,
      operations: [["put", 1, 1], ["get", 1]],
    });

    expect(result.opNames).toEqual(["put", "get"]);
    expect(result.opArgsList).toEqual([[1, 1], [1]]);
    expect(result.constructorArgs).toEqual([["capacity", 2]]);
  });
});

describe("identifyOperationSequence — Shape B (parallel ops/vals arrays)", () => {
  it("detects the standard { ops, vals } shape", () => {
    const result = identifyOperationSequence({
      ops: ["push", "pop"],
      vals: [[1], []],
    });

    expect(result.opNames).toEqual(["push", "pop"]);
    expect(result.opArgsList).toEqual([[1], []]);
    expect(result.constructorArgs).toEqual([]);
  });

  it("defaults opArgsList to empty arrays when vals is entirely absent", () => {
    // random-pick-with-weight's real shape: { w: [1], ops: ["pickIndex"] } — no vals key at all.
    const result = identifyOperationSequence({ w: [1], ops: ["pickIndex"] });

    expect(result.opNames).toEqual(["pickIndex"]);
    expect(result.opArgsList).toEqual([[]]);
    expect(result.constructorArgs).toEqual([["w", [1]]]);
  });

  it("carries a non-ops/vals key through as a constructor arg (design-circular-queue's `k`)", () => {
    const result = identifyOperationSequence({
      k: 3,
      ops: ["enQueue", "isFull"],
      vals: [[1], []],
    });

    expect(result.constructorArgs).toEqual([["k", 3]]);
  });

  // ── Regression tests: shape-detection ambiguity found during Phase 4's
  // real-execution verification (see phase-4-operation-sequence-changes.md).
  // A Shape-B "vals" array where every op takes exactly one STRING argument
  // (e.g. every op is `insert("apple")`) is structurally identical to
  // Shape A's [opName, ...args] tuples — every element is an array whose
  // first item is a string. Shape B must be checked first, or these get
  // misidentified as Shape A with the real op-names array demoted to a
  // spurious "constructor arg".
  describe("Shape A/B ambiguity when every op takes a single string arg", () => {
    it("time-based-key-value-store: vals entries are all single-string ([key, ...]) — must not be mistaken for Shape A", () => {
      const result = identifyOperationSequence({
        ops: ["set", "get"],
        vals: [["foo", "bar", 1], ["foo", 1]],
      });

      expect(result.opNames).toEqual(["set", "get"]);
      expect(result.opArgsList).toEqual([["foo", "bar", 1], ["foo", 1]]);
      expect(result.constructorArgs).toEqual([]);
    });

    it("implement-trie: every op takes exactly one string arg — must not be mistaken for Shape A", () => {
      const result = identifyOperationSequence({
        ops: ["insert", "search"],
        vals: [["apple"], ["app"]],
      });

      expect(result.opNames).toEqual(["insert", "search"]);
      expect(result.opArgsList).toEqual([["apple"], ["app"]]);
    });

    it("design-add-search-words: a wildcard search term like \".ad\" must not be treated as an op name", () => {
      const result = identifyOperationSequence({
        ops: ["addWord", "search"],
        vals: [["bad"], [".ad"]],
      });

      expect(result.opNames).toEqual(["addWord", "search"]);
      expect(result.opArgsList).toEqual([["bad"], [".ad"]]);
    });
  });

  it("returns null for a testcase that doesn't match either shape (normal single-call problem)", () => {
    expect(identifyOperationSequence({ nums: [1, 2, 3], target: 5 })).toBeNull();
  });
});
