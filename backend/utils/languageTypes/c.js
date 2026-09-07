/**
 * c.js — shared C type inference + literal formatting.
 *
 * Mirrors languageTypes/cpp.js's role for C++, adapted for C's much
 * thinner type vocabulary. Two things C needs that C++ doesn't, both
 * documented in backend/config/languages.js's `c` entry:
 *
 *   1. Arrays don't carry their own length. Every array argument gets a
 *      companion `<key>Size` int declared alongside it (or `<key>Rows` /
 *      `<key>Cols` for a 2D array) — the standard LeetCode-C convention
 *      is a function signature like `int* twoSum(int* nums, int
 *      numsSize, int target, int* returnSize)`, and the driver (see
 *      languageDrivers/c.js) needs these companion variables to build
 *      that call correctly.
 *   2. A 2D array is a genuine fixed-size C array (`int arr[3][4] =
 *      {{...}, ...}`), not vector<vector<int>> — C supports 2D array
 *      literals natively, which is actually simpler than C++'s
 *      equivalent, with one real constraint: every row must be the same
 *      length. A jagged testcase has no representation here — see
 *      cDeclaration()'s comment.
 *
 * Known, intentional limitation: only scalars, 1D arrays, and rectangular
 * 2D arrays of int/string/bool are covered. Extend this file (and its
 * test) the day a problem actually needs more — same posture
 * inferCppType/inferJavaType already take with their own short
 * whitelists, not an attempt at universal inference.
 */

export function escapeCString(str) {
  return String(str).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

/**
 * Infer the C type for a single value, preferring an explicitly declared
 * type (from Problem.paramTypes.c) over structural guessing.
 */
export function inferCType(value, declaredType) {
  if (declaredType) return declaredType;

  if (Array.isArray(value)) {
    if (value.length === 0) return "int[]";
    if (Array.isArray(value[0])) {
      if (typeof value[0][0] === "string") return "char*[][]";
      return "int[][]";
    }
    if (typeof value[0] === "string") return "char*[]";
    if (typeof value[0] === "boolean") return "bool[]";
    return "int[]";
  }

  if (typeof value === "boolean") return "bool";
  if (typeof value === "string") return "char*";
  if (typeof value === "number") {
    return Number.isInteger(value) ? "int" : "double";
  }

  return "int";
}

function formatCScalar(value) {
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") return String(value);
  if (typeof value === "string") return `"${escapeCString(value)}"`;
  return JSON.stringify(value);
}

/**
 * Format a value as a C literal — same brace-init syntax as C++ for
 * arrays (`{1, 2, 3}`, `{{1,2},{3,4}}`). Booleans need `<stdbool.h>`
 * (included by every languageDrivers/c.js template) for `true`/`false`
 * to be valid tokens.
 */
export function formatCValue(value) {
  if (Array.isArray(value)) {
    if (value.length === 0) return "{}";
    if (Array.isArray(value[0])) {
      return `{${value.map((v) => formatCValue(v)).join(", ")}}`;
    }
    return `{${value.map((v) => formatCScalar(v)).join(", ")}}`;
  }
  return formatCScalar(value);
}

/**
 * Build the declaration line(s) for one argument in a C driver. Returns a
 * single string — the array cases embed their own companion-variable
 * line(s) with `\n  ` so the caller can just join every argument's
 * declaration with `\n  ` the same way cppDeclaration's caller does,
 * without needing to know which arguments are scalars vs. arrays.
 */
export function cDeclaration(key, value, declaredType) {
  const type = inferCType(value, declaredType);
  const literal = formatCValue(value);

  if (Array.isArray(value) && Array.isArray(value[0])) {
    // 2D — requires every row to be the same length (see this file's
    // header comment). Not verified here: these values come from
    // testcases.json, not end-user input, and every current 2D-array
    // testcase across the catalog is already rectangular. A jagged one
    // would produce a C array literal with mismatched row lengths, which
    // fails to COMPILE (a loud, obvious failure) rather than silently
    // misbehaving — acceptable for a documented, currently-untriggered
    // edge case.
    const elementType = type.replace(/\[\]\[\]$/, "");
    const rows = value.length;
    const cols = value[0]?.length ?? 0;
    return `${elementType} ${key}[${rows}][${cols}] = ${literal};\n  int ${key}Rows = ${rows};\n  int ${key}Cols = ${cols};`;
  }

  if (Array.isArray(value)) {
    const elementType = type.replace(/\[\]$/, "");
    return `${elementType} ${key}[] = ${literal};\n  int ${key}Size = ${value.length};`;
  }

  return `${type} ${key} = ${literal};`;
}