/**
 * operationSequenceDriver.js
 *
 * Driver generation for the "operation-sequence" contract (see
 * operationSequenceShape.js for the shape this is built from) — audit
 * finding P0-2. Unlike generateDriverCode.js's single-call templates,
 * these construct one instance of the user's class and replay a known
 * sequence of method calls against it, collecting a result per call.
 *
 * `resultMode` controls whether void-returning calls contribute an entry
 * to the output array:
 *   "all"           — every call contributes an entry (null for void calls)
 *   "returningOnly" — void calls are omitted entirely
 * This exists because the real problem data itself is inconsistent about
 * which convention it was authored against (confirmed by inspecting every
 * affected problem's actual expectedOutput length against its op count —
 * see docs/execution-audit/phase-4-operation-sequence-changes.md) — rather
 * than picking one and rewriting the other half's stored expected outputs
 * (out of scope/risk for this phase), the driver supports both and each
 * problem declares which one it was authored against via
 * Problem.operationSequence.resultMode.
 *
 * Plan 011 (Batch 3): the per-language template bodies that used to live
 * directly in this file's `if (language === "...")` chain — a SECOND,
 * independent dispatch chain from generateDriverCode.js's, with nothing
 * enforcing the two stayed in sync — now live in
 * backend/utils/languageDrivers/<key>.js, alongside each language's
 * generate() counterpart. See that directory's index.js for the
 * load-time check that makes "a language has generate() but not
 * generateOperationSequence()" (exactly what happened to TypeScript here)
 * structurally impossible going forward.
 */
import { getDriver } from "./languageDrivers/index.js";

/**
 * generateOperationSequenceDriver — public entry point, mirrors
 * generateDriverCode()'s call shape.
 *
 * @param {string} language - "python" | "javascript" | "typescript" | "java" | "cpp"
 * @param {string} userCode - the user's class implementation
 * @param {{opNames: string[], opArgsList: any[][], constructorArgs: [string, any][]}} shape
 *   - the result of operationSequenceShape.js's identifyOperationSequence()
 * @param {string} className - the class to instantiate (Problem.functionName)
 * @param {"all"|"returningOnly"} resultMode
 */
export function generateOperationSequenceDriver(language, userCode, shape, className, resultMode = "all") {
  const { constructorArgs, opNames, opArgsList } = shape;

  const driver = getDriver(language);
  if (!driver) {
    throw new Error(`Unsupported language: ${language}`);
  }

  return driver.generateOperationSequence({
    userCode,
    className,
    constructorArgs,
    opNames,
    opArgsList,
    resultMode,
  });
}