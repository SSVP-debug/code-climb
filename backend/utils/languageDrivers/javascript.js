/**
 * languageDrivers/javascript.js
 *
 * Plan 011 (Batch 3): see languageDrivers/python.js's header for the full
 * reasoning — same mechanical, no-logic-change extraction, this time from
 * generateDriverCode.js's `formatJsArg` + javascript branch and
 * operationSequenceDriver.js's generateJsDriver(). Also reused directly by
 * languageDrivers/typescript.js (see that file) rather than duplicated —
 * unchanged from how generateDriverCode.js's typescript branch already
 * reused formatJsArg before this refactor.
 */

export function formatJsArg(value) {
  return JSON.stringify(value);
}

/**
 * generate — single-call driver template. Was the `if (language ===
 * "javascript")` branch body in generateDriverCode.js.
 */
export function generate({ userCode, fn, args }) {
  const callArgs = args.map((a) => formatJsArg(a.value)).join(", ");
  return `
${userCode}

try {
  const _result = ${fn}(${callArgs});
  console.log(JSON.stringify(_result));
} catch (e) {
  console.log("RUNTIME_ERROR:" + e.message);
}
`;
}

/**
 * generateOperationSequence — constructor + method-sequence replay driver.
 * Was operationSequenceDriver.js's generateJsDriver().
 */
export function generateOperationSequence({ userCode, className, constructorArgs, opNames, opArgsList, resultMode }) {
  const ctorArgsJs = constructorArgs.map(([, v]) => formatJsArg(v)).join(", ");

  const opLines = opNames
    .map((name, i) => {
      const argsJs = opArgsList[i].map((a) => formatJsArg(a)).join(", ");
      const callExpr = `_instance.${name}(${argsJs})`;
      if (resultMode === "all") {
        // `??` only coalesces null/undefined — a falsy-but-real result
        // (false, 0, "") is pushed as-is, only a genuinely void call
        // (undefined) becomes null.
        return `_results.push((${callExpr}) ?? null);`;
      }
      return `{ const _r = ${callExpr}; if (_r !== undefined) _results.push(_r); }`;
    })
    .join("\n  ");

  return `
${userCode}

try {
  const _instance = new ${className}(${ctorArgsJs});
  const _results = [];
  ${opLines}
  console.log(JSON.stringify(_results));
} catch (e) {
  console.log("RUNTIME_ERROR:" + e.message);
}
`;
}