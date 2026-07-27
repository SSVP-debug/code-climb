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
import { generateOperationSequenceDriver } from "../utils/operationSequenceDriver.js";
import { identifyOperationSequence } from "../utils/operationSequenceShape.js";

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
// LRUCache, MinStack) don't fit the single-call argument-generation check
// below — they're validated separately by checkOperationSequenceGeneration.
// Two problems remain explicitly excluded from BOTH checks, tracked as
// known follow-up work rather than silently ignored:
//   - binary-search-tree-iterator: constructor takes a tree (`root`), and
//     no driver (Java/C++/JS) has tree-construction support yet — only
//     Python's build_tree heuristic exists, and only for the single-call
//     contract (audit finding P2-1). Needs that generalized first.
//   - random-pick-with-weight: its own stored testcases have
//     non-deterministic placeholder expectedOutput ("varies", "0-3") —
//     this problem needs a custom range/distribution checker, which this
//     judge doesn't have, not just an operation-sequence driver. Enabling
//     it here would just always fail against a placeholder string.
const DEFERRED_DESIGN_PROBLEM_SLUGS = new Set([
  "binary-search-tree-iterator",
  "random-pick-with-weight",
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
  if (problem.operationSequence?.enabled) return [];
  if (DEFERRED_DESIGN_PROBLEM_SLUGS.has(problem.slug)) return [];

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

// Validates every operation-sequence problem (Problem.operationSequence.enabled)
// by actually running identifyOperationSequence + generateOperationSequenceDriver
// against every one of the problem's own testcases, for every language that
// has starter code. Catches shape-detection failures (a testcase that
// doesn't match either known storage shape) and generator exceptions
// before they reach a real submission. Java is included even though this
// script can't compile it (no JDK dependency for a fast pre-merge check) —
// generation-time exceptions (e.g. a malformed shape) still surface here.
function checkOperationSequenceGeneration(problem) {
  if (!problem.operationSequence?.enabled) return [];

  const errors = [];
  const testcases = [...(problem.testcases || []), ...(problem.hiddentestcases || [])];

  for (const [i, testcase] of testcases.entries()) {
    const shape = identifyOperationSequence(testcase.input);
    if (!shape) {
      errors.push(
        `${problem.slug}: testcase #${i} doesn't match either known operation-sequence shape (see operationSequenceShape.js)`
      );
      continue;
    }

    for (const lang of ["python", "javascript", "java", "cpp"]) {
      if (!problem.starterCode?.[lang]) continue;
      try {
        generateOperationSequenceDriver(
          lang, problem.starterCode[lang], shape, problem.functionName, problem.operationSequence.resultMode
        );
      } catch (err) {
        errors.push(`${problem.slug}: generateOperationSequenceDriver threw for ${lang} on testcase #${i} — ${err.message}`);
      }
    }
  }

  return errors;
}

export function validateProblems(problemList) {
  return problemList.flatMap((p) => [
    checkJava(p),
    checkCpp(p),
    ...checkArgumentGeneration(p),
    ...checkOperationSequenceGeneration(p),
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