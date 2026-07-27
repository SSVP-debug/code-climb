/**
 * cpp.js — shared C++ type inference + literal formatting.
 *
 * Extracted (and extended) from backend/utils/generateDriverCode.js during
 * the execution-pipeline audit (finding P1-2): the previous
 * inferCppType()/formatCppValue() collapsed every array-of-numbers to
 * `vector<int>` and every nested array to `vector<vector<int>>` regardless
 * of actual element type, with no way to declare a different type. Not
 * currently causing a live failure (no problem today has a float array or
 * a string matrix argument), but the same class of bug as the Java one
 * (P0-1) and worth closing before the next problem needs it.
 *
 * Not yet wired into generateDriverCode.js as of this commit (Phase 1 /
 * foundation) — unit-tested standalone first, wired in during Phase 3.
 */

export function escapeCppString(str) {
  return String(str).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

/**
 * Infer the C++ type for a single value, preferring an explicitly declared
 * type (from Problem.paramTypes.cpp) over structural guessing.
 */
export function inferCppType(value, declaredType) {
  if (declaredType) return declaredType;

  if (Array.isArray(value)) {
    if (value.length === 0) return "vector<int>";

    if (Array.isArray(value[0])) {
      if (typeof value[0][0] === "string") return "vector<vector<string>>";
      return "vector<vector<int>>";
    }

    if (typeof value[0] === "string") return "vector<string>";
    if (typeof value[0] === "boolean") return "vector<bool>";
    return "vector<int>";
  }

  if (typeof value === "boolean") return "bool";
  if (typeof value === "string") return "string";
  if (typeof value === "number") {
    return Number.isInteger(value) ? "int" : "double";
  }

  return "auto";
}

/**
 * Format a value as a C++ literal. Unlike Java, C++'s brace-init syntax
 * (`{1, 2, 3}`, `{{1,2},{3,4}}`) is valid regardless of the declared
 * element type, so this doesn't need a full type-keyed switch the way
 * formatJavaLiteral does — it only needs to know how to quote/escape
 * strings and booleans correctly at each nesting level.
 */
export function formatCppValue(value) {
  if (Array.isArray(value)) {
    if (value.length === 0) return "{}";

    if (Array.isArray(value[0])) {
      return `{${value.map((v) => formatCppValue(v)).join(", ")}}`;
    }

    if (typeof value[0] === "string") {
      return `{${value.map((v) => `"${escapeCppString(v)}"`).join(", ")}}`;
    }

    if (typeof value[0] === "boolean") {
      return `{${value.map((v) => (v ? "true" : "false")).join(", ")}}`;
    }

    if (value.every((v) => typeof v === "number")) {
      return `{${value.join(", ")}}`;
    }

    return JSON.stringify(value);
  }

  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") return String(value);
  if (typeof value === "string") return `"${escapeCppString(value)}"`;

  return JSON.stringify(value);
}

/**
 * Build one `<Type> <name> = <literal>;` declaration line for a C++ driver.
 */
export function cppDeclaration(key, value, declaredType) {
  const type = inferCppType(value, declaredType);
  const literal = formatCppValue(value);
  return `${type} ${key} = ${literal};`;
}
