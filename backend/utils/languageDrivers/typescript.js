/**
 * languageDrivers/typescript.js
 *
 * Plan 011 (Batch 3): TypeScript reuses JavaScript's driver templates —
 * see plans/010-language-expansion-scoping.md: TS is a structural
 * superset of JS for this purpose, and there is nothing meaningfully
 * TS-specific about either template to justify a separate implementation
 * ... almost. Confirmed via the full test suite catching a real
 * discrepancy while building this file: `generateOperationSequence` IS a
 * byte-for-byte reuse (operationSequenceDriver.js's original code
 * literally called `generateJsDriver(...)` for both languages — a true
 * re-export is correct here), but `generate()`'s original TypeScript
 * branch had a SLIGHTLY different catch block than JavaScript's:
 *
 *   TypeScript: e instanceof Error ? e.message : String(e)
 *   JavaScript: e.message
 *
 * — presumably because throwing a non-Error value is something TS's
 * stricter authoring conventions made someone think about and JS's
 * didn't. Re-exporting `generate` from javascript.js here would have
 * silently narrowed that behavior back to JS's, changing what a thrown
 * non-Error value in a TypeScript submission reports — exactly the kind
 * of "mechanical extraction" claim this whole plan is skeptical of taking
 * on faith, caught by generateDriverCode.test.js rather than by
 * inspection. `generate()` therefore keeps its own body below, verbatim
 * from the original branch; only `generateOperationSequence` is reused.
 */
import { formatJsArg } from "./javascript.js";

export { generateOperationSequence } from "./javascript.js";

export function generate({ userCode, fn, args }) {
  const callArgs = args.map((a) => formatJsArg(a.value)).join(", ");
  return `
${userCode}

try {
  const _result = ${fn}(${callArgs});
  console.log(JSON.stringify(_result));
} catch (e) {
  console.log("RUNTIME_ERROR:" + (e instanceof Error ? e.message : String(e)));
}
`;
}