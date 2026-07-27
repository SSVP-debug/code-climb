/**
 * operationSequenceShape.js
 *
 * "Design" problems (LRUCache, MinStack, Trie, etc.) don't fit the normal
 * single-call contract every other problem uses — the user implements a
 * class with a constructor plus several methods, and one testcase replays
 * a whole SEQUENCE of constructor-then-method calls, collecting a result
 * per call. This is audit finding P0-2: the previous runner had no concept
 * of this shape at all and just tried (and failed) to call the class like
 * a single function.
 *
 * The real problem data (src/data/problems.js) stores this sequence in one
 * of two shapes — discovered by actually inspecting all 18 affected
 * problems rather than assuming a single convention:
 *
 *   Shape A — one array of [opName, ...opArgs] tuples, e.g. lru-cache:
 *     { capacity: 2, operations: [["put",1,1],["get",1],...] }
 *
 *   Shape B — two parallel arrays, op names and op args, e.g. implement-trie:
 *     { ops: ["insert","search"], vals: [["apple"],["app"]] }
 *     (vals may be entirely absent when every op takes zero arguments —
 *     see random-pick-with-weight's { w: [1], ops: ["pickIndex"] }.)
 *
 * This module is only ever invoked for a problem that has explicitly
 * opted in via Problem.operationSequence.enabled (see
 * backend/models/Problem.js) — it does not try to structurally guess
 * whether an arbitrary problem is an operation-sequence problem, which
 * would risk misidentifying a normal problem with a string-array argument
 * (e.g. group-anagrams' `strs`) as one. The explicit flag is the only
 * signal that matters; shape detection only decides which of the two
 * known storage shapes this particular testcase uses.
 */

export function identifyOperationSequence(testcaseInput) {
  const entries = Object.entries(testcaseInput);

  // Shape B is checked FIRST, not Shape A: when every op in a Shape-B
  // "vals" array happens to take exactly one string argument (e.g.
  // implement-trie: vals: [["apple"],["app"]], or
  // time-based-key-value-store: vals: [["foo","bar",1],["foo",1]] — the
  // key name "foo" is itself a string), "vals" is structurally
  // indistinguishable from Shape A's [opName, ...args] tuples (every
  // element is an array whose first item is a string). Checking Shape B
  // first and only falling back to Shape A when no valid opNames+vals
  // pairing exists resolves this correctly for every real problem in the
  // catalog — confirmed by actually generating and running driver code
  // against all 16 operation-sequence problems (see
  // docs/execution-audit/phase-4-operation-sequence-changes.md).
  const opNamesEntry = entries.find(
    ([, v]) => Array.isArray(v) && v.length > 0 && v.every((el) => typeof el === "string")
  );

  if (opNamesEntry) {
    const [opsKey, opNames] = opNamesEntry;
    const valsEntry = entries.find(
      ([k, v]) =>
        k !== opsKey &&
        Array.isArray(v) &&
        v.length === opNames.length &&
        v.every((el) => Array.isArray(el))
    );
    const opArgsList = valsEntry ? valsEntry[1] : opNames.map(() => []);
    const valsKey = valsEntry?.[0];

    return {
      opNames,
      opArgsList,
      constructorArgs: entries.filter(([k]) => k !== opsKey && k !== valsKey),
    };
  }

  // Shape A: a single array-of-arrays where each element's first item is
  // the operation name (only reached when no Shape B pairing was found —
  // e.g. lru-cache's "operations": [["put",1,1],["get",1],...], where
  // there is no separate all-strings "op name" array alongside it).
  const shapeA = entries.find(
    ([, v]) =>
      Array.isArray(v) &&
      v.length > 0 &&
      v.every((el) => Array.isArray(el) && typeof el[0] === "string")
  );

  if (shapeA) {
    const [opsKey, opsVal] = shapeA;
    return {
      opNames: opsVal.map((sub) => sub[0]),
      opArgsList: opsVal.map((sub) => sub.slice(1)),
      constructorArgs: entries.filter(([k]) => k !== opsKey),
    };
  }

  return null;
}
