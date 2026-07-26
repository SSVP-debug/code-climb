/**
 * validateProblemContracts.js
 *
 * Read-only sanity check for every problem in src/data/problems.js: if a
 * problem declares an explicit returnType.java / returnType.cpp contract
 * (see backend/models/Problem.js), verify the starter code for that
 * language actually declares the same return type. Catches the class of
 * bug where starter code says `int` but the contract (and therefore the
 * generated runner) says `long`, or vice versa — before it reaches users.
 *
 * This is deliberately a lightweight regex check, not a real Java/C++
 * parser — it only needs to catch drift between two hand-authored strings
 * in the same problem entry, not validate general syntax.
 *
 * Usage:
 *   node backend/scripts/validateProblemContracts.js
 *
 * Exit code 0 = all declared contracts are consistent.
 * Exit code 1 = at least one mismatch found (details printed to stderr).
 */
import problems from "../../src/data/problems.js";

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

export function validateProblems(problemList) {
  return problemList.flatMap((p) => [checkJava(p), checkCpp(p)].filter(Boolean));
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