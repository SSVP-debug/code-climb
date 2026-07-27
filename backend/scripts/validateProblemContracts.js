/**
 * validateProblemContracts.js
 *
 * Read-only sanity checks for every problem in src/data/problems.js:
 *
 *  1. checkJava/checkCpp — if a problem declares an explicit
 *     returnType.java / returnType.cpp contract (see
 *     backend/models/Problem.js), verify the starter code for that
 *     language actually declares the same return type. Catches the class
 *     of bug where starter code says `int` but the contract (and therefore
 *     the generated runner) says `long`, or vice versa.
 *
 *  2. checkArgumentGeneration — actually runs generateDriverCode() for
 *     java/cpp against the problem's own testcase data and scans the
 *     output for the structural red flags that mean the generated code
 *     will not compile: a declaration typed `Object` (the old
 *     string/boolean/2D-array catch-all — see audit finding P0-1) or an
 *     array declared with an invalid `[...]` bracket literal instead of a
 *     `{...}` brace literal. Added during the execution-pipeline audit —
 *     previously nothing checked that a problem's *arguments* (as opposed
 *     to its return type) would actually generate compilable code; this is
 *     exactly why the P0-1 bug went unnoticed for as long as it did.
 *
 * This is deliberately a lightweight/regex-based check, not a real
 * Java/C++ compiler invocation — it only needs to catch the specific
 * generation-level defects this audit found, not validate general syntax
 * or actually compile anything (that would need a sandboxed toolchain,
 * out of scope for a fast pre-merge/pre-seed check).
 *
 * Usage:
 *   node backend/scripts/validateProblemContracts.js
 *
 * Exit code 0 = all declared contracts are consistent and every problem's
 *               arguments generate structurally-valid Java/C++.
 * Exit code 1 = at least one mismatch found (details printed to stderr).
 */
import problems from "../../src/data/problems.js";
import { generateDriverCode } from "../utils/generateDriverCode.js";

const JAVA_RETURN_RE = /public\s+([\w<>[\],]+(?:\s*<[\w<>[\],\s]*>)?)\s+\w+\s*\(/;

function checkJava(problem) {
  const code = problem.starterCode?.java;
  const declared = problem.returnType?.java;
  if (!code || !declared) return null;

  const match = code.match(JAVA_RETURN_RE);
  const actual = match?.[1]?.trim();

  if (actual && actual !== declared) {
    return `${problem.slug}: Java starter code declares return type "${actual}" but returnType.java says "${declared}"`;
  }
  if (!actual) {
    return `${problem.slug}: returnType.java is "${declared}" but no method signature could be matched in the Java starter code`;
  }
  return null;
}

// C++ access specifiers ("public:") live on their own line above the method,
// so — unlike Java — the return type must be extracted from a *single line*
// rather than by scanning backward across newlines, or a multi-line capture
// sweeps the access-specifier line in with the real type.
function checkCpp(problem) {
  const code = problem.starterCode?.cpp;
  const declared = problem.returnType?.cpp;
  if (!code || !declared) return null;

  const fnName = problem.functionName;
  const lineRe = fnName
    ? new RegExp(`^\\s*([\\w:<>,]+(?:\\s+[\\w:<>,]+)*)\\s+${fnName}\\s*\\(`)
    : /^\s*([\w:<>,]+(?:\s+[\w:<>,]+)*)\s+\w+\s*\(/;

  const line = code.split("\n").find((l) => lineRe.test(l));
  const actual = line?.match(lineRe)?.[1]?.trim();

  if (actual && actual !== declared) {
    return `${problem.slug}: C++ starter code declares return type "${actual}" but returnType.cpp says "${declared}"`;
  }
  if (!actual) {
    return `${problem.slug}: returnType.cpp is "${declared}" but no method signature could be matched in the C++ starter code`;
  }
  return null;
}

// "Design" problems (constructor + operation-sequence contract, e.g.
// LRUCache, MinStack) are a known, separately-tracked architectural gap
// (audit finding P0-2 — the runner doesn't support this contract in any
// language yet). Their testcase shape (`{ operations: [...] }`) isn't a
// normal single-call argument list, so running it through
// generateDriverCode here would just report the same known issue 19 times
// under a misleading "argument generation" label. Skipped here — tracked
// separately until the operation-sequence driver exists.
const DESIGN_PROBLEM_SLUGS = new Set([
  "min-stack", "lru-cache", "find-median-from-data-stream",
  "time-based-key-value-store", "implement-trie", "design-add-search-words",
  "implement-queue-using-stacks", "binary-search-tree-iterator",
  "implement-stack-using-queues", "design-hashmap", "design-circular-queue",
  "design-twitter", "random-pick-with-weight", "maximum-frequency-stack",
  "two-sum-iii-data-structure", "implement-trie-prefix-tree",
  "add-and-search-word", "online-stock-span", "minimum-stack",
]);

// A declaration typed `Object` is the old String/boolean/2D-array
// catch-all that does not compile against a method expecting a primitive
// or String parameter (audit P0-1). An array declared with a `[` bracket
// literal instead of a `{` brace literal (e.g. `int[] x = [1,2];`) is not
// valid Java or C++ syntax at all.
const JAVA_RED_FLAGS = [
  { pattern: /\bObject\s+\w+\s*=/, reason: "declares an argument as Object (won't compile against a primitive/String parameter)" },
  { pattern: /\[\]\s*\w+\s*=\s*\[/, reason: "declares an array using an invalid `[` bracket literal instead of `{`" },
];

function checkArgumentGeneration(problem) {
  if (DESIGN_PROBLEM_SLUGS.has(problem.slug)) return [];

  const testcase = problem.testcases?.[0] || problem.hiddentestcases?.[0];
  if (!testcase) return [];

  const errors = [];

  if (problem.starterCode?.java) {
    try {
      const javaCode = generateDriverCode(
        "java",
        problem.starterCode.java,
        testcase.input,
        problem.functionName,
        problem.returnType?.java,
        problem.paramTypes?.java
      );

      for (const { pattern, reason } of JAVA_RED_FLAGS) {
        if (pattern.test(javaCode)) {
          errors.push(`${problem.slug}: generated Java driver ${reason}`);
        }
      }
    } catch (err) {
      errors.push(`${problem.slug}: generateDriverCode threw for Java — ${err.message}`);
    }
  }

  if (problem.starterCode?.cpp) {
    try {
      generateDriverCode(
        "cpp",
        problem.starterCode.cpp,
        testcase.input,
        problem.functionName,
        problem.returnType?.cpp,
        problem.paramTypes?.cpp
      );
    } catch (err) {
      errors.push(`${problem.slug}: generateDriverCode threw for C++ — ${err.message}`);
    }
  }

  return errors;
}

export function validateProblems(problemList) {
  return problemList.flatMap((p) => [
    checkJava(p),
    checkCpp(p),
    ...checkArgumentGeneration(p),
  ].filter(Boolean));
}

// Only run as a CLI script, not when imported by tests.
if (import.meta.url === `file://${process.argv[1]}`) {
  const { default: missions } = await import(
    "../../src/data/code-club-edition/index.js"
  );

  const errors = [
    ...validateProblems(problems),
    ...validateProblems(missions),
  ];

  if (errors.length) {
    console.error(`Found ${errors.length} problem contract mismatch(es):`);
    errors.forEach((e) => console.error(`  - ${e}`));
    process.exit(1);
  }

  console.log(
    `Validated ${problems.length} problems and ${missions.length} Code Club Edition missions — no contract mismatches.`
  );
  process.exit(0);
}