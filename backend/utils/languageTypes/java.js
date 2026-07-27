/**
 * java.js — shared Java type inference + literal formatting.
 *
 * Extracted (and extended) from backend/utils/generateDriverCode.js during
 * the execution-pipeline audit. Root cause being fixed here: the previous
 * `formatJavaValue()` in generateDriverCode.js only handled numeric arrays
 * correctly, and its caller only special-cased arrays and numbers when
 * building declarations — everything else (String, String[], boolean,
 * int[][]) fell into a catch-all `Object key = <value>;` declaration, which
 * does not compile when passed to a method expecting a primitive or String
 * parameter. See audit findings P0-1 and P1-5.
 *
 * This module is NOT yet wired into generateDriverCode.js as of this
 * commit (Phase 1 / foundation) — it is unit-tested standalone first, then
 * wired in during Phase 3, to keep this change reviewable and risk-free on
 * its own.
 */

/**
 * Infer the Java type for a single value, preferring an explicitly
 * declared type (from Problem.paramTypes.java) over structural guessing.
 * Structural guessing is a best-effort fallback for problems that haven't
 * declared a contract yet — same philosophy as inferReturnType() already
 * has for the return side.
 */
export function inferJavaType(value, declaredType) {
  if (declaredType) return declaredType;

  if (value === null) {
    // No current problem passes a literal null argument. There is no safe
    // structural guess for a reference type from `null` alone — this is a
    // case that MUST declare paramTypes explicitly rather than rely on this
    // fallback. Object is the least-wrong default and will still fail loudly
    // (a clear compile error) rather than silently doing the wrong thing.
    return "Object";
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return "int[]";

    if (Array.isArray(value[0])) {
      // Nested array (matrix). Only int and String element types are
      // inferable today — anything else needs an explicit paramTypes entry.
      if (typeof value[0][0] === "string") return "String[][]";
      return "int[][]";
    }

    if (typeof value[0] === "string") return "String[]";
    if (typeof value[0] === "boolean") return "boolean[]";
    return "int[]";
  }

  if (typeof value === "boolean") return "boolean";
  if (typeof value === "string") return "String";
  if (typeof value === "number") {
    return Number.isInteger(value) ? "int" : "double";
  }

  return "Object";
}

function escapeJavaString(str) {
  return String(str)
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t");
}

/**
 * Format a value as a Java literal, given its (declared-or-inferred) type.
 * `type` must be one produced by inferJavaType() (or an explicit
 * paramTypes.java entry using the same vocabulary).
 */
export function formatJavaLiteral(value, type) {
  switch (type) {
    case "String":
      return `"${escapeJavaString(value)}"`;

    case "String[]":
      return `{${value.map((v) => `"${escapeJavaString(v)}"`).join(", ")}}`;

    case "String[][]":
      return `{${value
        .map((row) => `{${row.map((v) => `"${escapeJavaString(v)}"`).join(", ")}}`)
        .join(", ")}}`;

    case "int[][]":
      return `{${value.map((row) => `{${row.join(", ")}}`).join(", ")}}`;

    case "boolean[]":
      return `{${value.map((v) => (v ? "true" : "false")).join(", ")}}`;

    case "int[]":
    case "long[]":
    case "double[]":
      return `{${value.join(", ")}}`;

    case "boolean":
      return value ? "true" : "false";

    case "long":
      // Integer literals beyond ~2^31 need an explicit `L` suffix to be
      // valid `long` literals in Java (a bare literal is parsed as `int`
      // first, which would fail to even compile for a value this large).
      return `${value}L`;

    case "char":
      return `'${value}'`;

    case "double":
    case "int":
      return String(value);

    default:
      // Unknown/unsupported declared type — surface the raw value rather
      // than guessing further; whoever declared this paramTypes entry needs
      // to extend this module rather than have it silently misformat.
      return JSON.stringify(value);
  }
}

/**
 * Build one `<Type> <name> = <literal>;` declaration line for a Java driver.
 */
export function javaDeclaration(key, value, declaredType) {
  const type = inferJavaType(value, declaredType);
  const literal = formatJavaLiteral(value, type);
  return `${type} ${key} = ${literal};`;
}
