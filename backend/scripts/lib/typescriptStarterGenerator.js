/**
 * typescriptStarterGenerator.js
 *
 * Pure function: given one problem object from src/data/problems.js, returns
 * a properly-typed `starterCode.typescript` string.
 *
 * Root cause this replaces: backfillTypescriptStarter.js (Phase 6) set
 * every problem's `starterCode.typescript` to a byte-identical copy of
 * `starterCode.javascript` — completely untyped, e.g.
 * `function threeSumSmaller(nums, target) {}`. That's structurally correct
 * TypeScript, but every parameter is an implicit `any`, which fails under
 * `noImplicitAny`/strict type-checking (the error the person using this
 * generator originally hit in VS Code). Hand-adding types to the empty
 * body-only starter doesn't work either: a declared non-void return type
 * with an empty body is *also* a TypeScript error ("not all code paths
 * return a value").
 *
 * The fix generates types from the problem's own `starterCode.java` (see
 * ../../utils/languageTypes/typescript.js — Java is the one already-typed,
 * hand-authored per-language starter this codebase has for literally every
 * problem, unlike the mostly-unused Problem.paramTypes/returnType schema
 * fields) and gives every generated function/method an explicit
 * `throw new Error("Not implemented")` body instead of an empty one — valid
 * under any declared return type (including `void`), and honest about the
 * starter not being a solution (never `return 0`/`return []`/etc.).
 *
 * Preserves the exact function/class/method/parameter *names* already in
 * `starterCode.javascript` (those are correct — the execution driver in
 * generateDriverCode.js/operationSequenceDriver.js calls by exactly those
 * names) and only adds type annotations + a real placeholder body.
 */
import { parseJavaSignatures } from "../../utils/languageTypes/typescript.js";

function splitParamNames(paramsStr) {
  return paramsStr
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
}

function typedParamList(paramNames, javaParams) {
  return paramNames
    .map((name, i) => `${name}: ${javaParams?.[i]?.tsType ?? "any"}`)
    .join(", ");
}

const FUNCTION_RE = /^function\s+(\w+)\s*\(([^)]*)\)/;
const CLASS_RE = /^class\s+(\w+)\s*\{/;
// Matches one flat (non-nested-brace) method/constructor body within a
// class starter, e.g. `get(key) {\n\n}` or `search(word) { return false; }`.
// Every class-based JS/TS starter in this codebase is this shape today
// (see the generator's own audit notes) — a method containing another
// `{...}` block would not match and this function throws rather than
// silently emitting a malformed starter (see buildTypescriptStarter below).
const METHOD_RE = /(\w+)\s*\(([^)]*)\)\s*\{([^{}]*)\}/g;

/**
 * Build a typed TypeScript starter string for one problem. Returns null if
 * the problem has no `starterCode.typescript` at all (nothing to
 * regenerate — matches problemFolderFiles.js's own "absent key means no
 * file expected" convention) or if the existing starter isn't a plain
 * `function ...` / `class ...` shape this generator understands (falls back
 * to leaving it untouched rather than guessing).
 */
export function buildTypescriptStarter(problem) {
  const jsStarter = problem.starterCode?.javascript;
  if (!jsStarter || !problem.starterCode?.typescript) return null;

  const javaSig = parseJavaSignatures(problem.starterCode?.java);
  const trimmed = jsStarter.trim();

  const fnMatch = trimmed.match(FUNCTION_RE);
  if (fnMatch) {
    const [, fnName, paramsStr] = fnMatch;
    const paramNames = splitParamNames(paramsStr);
    const javaEntry = javaSig?.methods?.[fnName];
    const params = typedParamList(paramNames, javaEntry?.params);
    const returnTsType = javaEntry?.returnTsType ?? "any";
    return `function ${fnName}(${params}): ${returnTsType} {\n    throw new Error("Not implemented");\n}`;
  }

  const classMatch = trimmed.match(CLASS_RE);
  if (classMatch) {
    const [outerMatch, className] = classMatch;
    // Body between the class's outer braces (drop the trailing `}` too).
    const body = trimmed.slice(outerMatch.length, -1);

    const methodLines = [];
    for (const m of body.matchAll(METHOD_RE)) {
      const [, methodName, paramsStr] = m;
      const paramNames = splitParamNames(paramsStr);

      if (methodName === "constructor") {
        const params = typedParamList(paramNames, javaSig?.methods?.constructor?.params);
        methodLines.push(`  constructor(${params}) {\n    throw new Error("Not implemented");\n  }`);
        continue;
      }

      const javaEntry = javaSig?.methods?.[methodName];
      const params = typedParamList(paramNames, javaEntry?.params);
      const returnTsType = javaEntry?.returnTsType ?? "any";
      methodLines.push(
        `  ${methodName}(${params}): ${returnTsType} {\n    throw new Error("Not implemented");\n  }`
      );
    }

    return `class ${className} {\n${methodLines.join("\n")}\n}`;
  }

  // Unrecognized shape — don't guess, leave the caller to keep the
  // existing (untyped) starter rather than emit something wrong.
  return null;
}
