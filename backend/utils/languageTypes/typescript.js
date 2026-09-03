/**
 * typescript.js — Java-signature-derived TypeScript type inference for
 * generated starter code.
 *
 * Root cause this exists to fix: backend/scripts/backfillTypescriptStarter.js
 * (Phase 6, Language Expansion) populated every problem's
 * `starterCode.typescript` as a byte-identical copy of `starterCode.javascript`
 * — i.e. completely untyped (`function threeSumSmaller(nums, target) {}`).
 * That's invalid/unclean under TypeScript's implicit-any checking, and
 * simply adding types by hand for one problem doesn't scale to 250 problems
 * across function-style and class/"design"-style starters.
 *
 * This module is the general fix: `starterCode.java` is the one per-problem
 * field that already declares a real, hand-authored type for every
 * parameter and return value (Problem.paramTypes/returnType are the
 * *explicit*, opt-in contract — see backend/models/Problem.js — but as of
 * this writing only 1/250 problems actually sets them; the Java starter
 * signature is the de facto contract every problem already has, and is
 * exactly what generateDriverCode.js's own `inferReturnType()` already
 * falls back to via regex for the same reason). We parse that signature and
 * map each Java type to its TypeScript equivalent, so the generated starter
 * only ever needs `any` for the small set of Java types that don't correspond
 * to any type actually usable in the TS execution environment (see
 * OPAQUE_JAVA_TYPES below) — never for an ordinary number/string/array
 * parameter just because nobody wrote it down twice.
 */

// Java type string (as it appears in a hand-authored `starterCode.java`
// signature) -> TypeScript type string. Deliberately only covers types that
// actually appear across the current problem set (see the module-level
// survey in the audit notes for this change) rather than every Java type in
// existence — an unmapped type falls back to `any` (see toTsType below),
// which is always a safe, compiling default, not a silent correctness bug.
const JAVA_TO_TS_TYPE = {
  int: "number",
  long: "number",
  double: "number",
  boolean: "boolean",
  String: "string",
  void: "void",
  "int[]": "number[]",
  "long[]": "number[]",
  "double[]": "number[]",
  "boolean[]": "boolean[]",
  "String[]": "string[]",
  "int[][]": "number[][]",
  "String[][]": "string[][]",
  // Java has no first-class string-of-length-1 type; a char in the
  // execution contract is carried as a single-character JS/TS string (the
  // driver never constructs an actual Java `char`, so there's nothing
  // char-specific to preserve on the TS side).
  "char[]": "string[]",
  "char[][]": "string[][]",
  "List<Integer>": "number[]",
  "List<String>": "string[]",
  "List<List<Integer>>": "number[][]",
  "List<List<String>>": "string[][]",
  "java.util.List<String>": "string[]",
};

// Java types that name a class (ListNode, TreeNode, Node, ...) which only
// exists in the Java/C++ driver's own generated preamble — the JavaScript
// and TypeScript drivers (generateDriverCode.js's javascript/typescript
// branches) never construct or inject any such class, and pass the
// testcase's raw JSON value (an array, e.g. a level-order tree encoding)
// straight through instead. Emitting `TreeNode` as a TS parameter type
// would therefore reference a name that doesn't exist in the compiled
// program and fail with "Cannot find name" — worse than the implicit-any
// error this whole change fixes. These must resolve to `any`, not to the
// Java class name.
const OPAQUE_JAVA_TYPES = new Set(["ListNode", "ListNode[]", "TreeNode", "Node"]);

/**
 * Map one Java type string to its TypeScript equivalent. Always returns a
 * usable, compiling TS type — `any` is the deliberate, explicit fallback
 * for anything unrecognized or structurally opaque in the TS execution
 * environment (see OPAQUE_JAVA_TYPES), never an omitted/implicit type.
 */
export function javaTypeToTs(javaType) {
  if (!javaType) return "any";
  const trimmed = javaType.trim();
  if (OPAQUE_JAVA_TYPES.has(trimmed)) return "any";
  return JAVA_TO_TS_TYPE[trimmed] ?? "any";
}

// Splits a Java parameter list on top-level commas only — i.e. not commas
// nested inside `<...>` generic type arguments (`List<List<Integer>>` has
// none here today, but a param list could in principle combine a generic
// type with other params). Simple depth counter over `<`/`>` is sufficient
// since Java parameter lists never contain unbalanced angle brackets
// outside of generics.
function splitJavaParams(paramsStr) {
  const parts = [];
  let depth = 0;
  let current = "";
  for (const ch of paramsStr) {
    if (ch === "<") depth++;
    if (ch === ">") depth--;
    if (ch === "," && depth === 0) {
      parts.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  if (current.trim()) parts.push(current);
  return parts.map((p) => p.trim()).filter(Boolean);
}

/**
 * Parse one `<Type> <name>, <Type> <name>, ...` Java parameter list into
 * [{ name, tsType }]. The last whitespace-separated token in each entry is
 * always the parameter name (Java has no trailing modifiers after it in
 * this codebase's starters); everything before it is the type.
 */
function parseJavaParams(paramsStr) {
  return splitJavaParams(paramsStr).map((param) => {
    const lastSpace = param.lastIndexOf(" ");
    if (lastSpace === -1) return { name: param, tsType: "any" };
    const type = param.slice(0, lastSpace).trim();
    const name = param.slice(lastSpace + 1).trim();
    return { name, tsType: javaTypeToTs(type) };
  });
}

const JAVA_METHOD_RE = /public\s+([\w<>[\],\s.]+?)\s+(\w+)\s*\(([^)]*)\)/g;
const JAVA_CTOR_RE = /public\s+(\w+)\s*\(([^)]*)\)\s*\{/;

/**
 * Parse a hand-authored Java starter's class into a lookup of
 * methodName -> { params: [{name, tsType}], returnTsType } plus an optional
 * `constructor` entry, all TS-mapped via javaTypeToTs(). Returns null if no
 * `class <Name> {` is found (shouldn't happen for this codebase's starters,
 * but callers must treat that as "no metadata available" and fall back to
 * `any` rather than throw, since a hand-authored starter could in principle
 * be malformed).
 */
export function parseJavaSignatures(javaStarter) {
  if (!javaStarter) return null;
  const classMatch = javaStarter.match(/class\s+(\w+)/);
  if (!classMatch) return null;
  const className = classMatch[1];

  const methods = {};

  const ctorMatch = javaStarter.match(JAVA_CTOR_RE);
  if (ctorMatch && ctorMatch[1] === className) {
    methods.constructor = {
      params: parseJavaParams(ctorMatch[2]),
      returnTsType: null, // constructors have no return type in TS either
    };
  }

  for (const match of javaStarter.matchAll(JAVA_METHOD_RE)) {
    const [, returnType, name, paramsStr] = match;
    if (name === className) continue; // already handled as the constructor above
    methods[name] = {
      params: parseJavaParams(paramsStr),
      returnTsType: javaTypeToTs(returnType),
    };
  }

  return { className, methods };
}
