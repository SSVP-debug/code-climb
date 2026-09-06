/**
 * languageDrivers/python.js
 *
 * Plan 011 (Batch 3): Python's half of what used to be two independent
 * `if (language === "python")` branches — one in generateDriverCode.js,
 * one in operationSequenceDriver.js — with nothing enforcing they stayed
 * in sync. See languageDrivers/index.js for the registry that now makes
 * "a language has one of these but not the other" impossible to ship.
 *
 * Mechanical extraction: every function body below is moved verbatim from
 * its old location (generateDriverCode.js's python branch +
 * formatPythonArg; operationSequenceDriver.js's generatePythonDriver). No
 * logic changes — see backend/utils/generateDriverCode.test.js and
 * backend/utils/operationSequenceDriver.test.js, both of which pass
 * unmodified against this file, as the evidence for that.
 */

// Was exported directly from generateDriverCode.js; still re-exported from
// there (see that file) since operationSequenceDriver.test.js and any
// other historical caller may import it from that path. Also used
// directly by this module's own generateOperationSequence() below.
export function formatPythonArg(value) {
  if (value === null) return "None";
  // Booleans MUST be checked before the generic array/object/string
  // branches and before the `String(value)` fallback: Python's boolean
  // literals are `True`/`False` (capitalized), not `true`/`false`. The
  // previous version had no boolean branch at all, so any boolean argument
  // fell through to `String(value)` → the literal text "true"/"false",
  // which are not valid Python identifiers and raise NameError at runtime
  // (misreported as a user RUNTIME_ERROR rather than the platform bug it
  // actually is). No current problem has a boolean-typed argument, so this
  // was latent rather than live — see audit finding P1-3.
  if (typeof value === "boolean") return value ? "True" : "False";
  if (typeof value === "string") return JSON.stringify(value);
  if (Array.isArray(value)) {
    return `[${value.map((v) => formatPythonArg(v)).join(", ")}]`;
  }
  if (typeof value === "object") {
    const entries = Object.entries(value)
      .map(([k, v]) => `${JSON.stringify(k)}: ${formatPythonArg(v)}`)
      .join(", ");
    return `{${entries}}`;
  }
  return String(value);
}

/**
 * generate — single-call driver template. Was the `if (language ===
 * "python")` branch body in generateDriverCode.js.
 */
export function generate({ userCode, fn, args, debugEnabled }) {
  const callArgs = args
    .map(({ key, value }) => {
      if (key.toLowerCase().includes("root") && Array.isArray(value)) {
        return `build_tree(${formatPythonArg(value)})`;
      }
      return formatPythonArg(value);
    })
    .join(", ");

  const hasClass = userCode.includes("class Solution");
  const invocation = hasClass
    ? `Solution().${fn}(${callArgs})`
    : `${fn}(${callArgs})`;

  if (debugEnabled) console.log("[generateDriverCode] PYTHON INVOCATION:", invocation);

  return `
import json
from collections import deque

class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

def build_tree(values):
    if not values:
        return None
    nodes = [None if v is None else TreeNode(v) for v in values]
    kids  = deque(nodes[1:])
    root  = nodes[0]
    for node in nodes:
        if node:
            if kids: node.left  = kids.popleft()
            if kids: node.right = kids.popleft()
    return root

${userCode}

try:
    _result = ${invocation}
    print(json.dumps(_result))
except Exception as e:
    print(f"RUNTIME_ERROR: {str(e)}")
`;
}

/**
 * generateOperationSequence — constructor + method-sequence replay driver.
 * Was operationSequenceDriver.js's generatePythonDriver().
 */
export function generateOperationSequence({ userCode, className, constructorArgs, opNames, opArgsList, resultMode }) {
  const ctorArgsPy = constructorArgs.map(([, v]) => formatPythonArg(v)).join(", ");

  const bodyLines = [];
  opNames.forEach((name, i) => {
    const argsPy = opArgsList[i].map((a) => formatPythonArg(a)).join(", ");
    const callExpr = `_instance.${name}(${argsPy})`;
    if (resultMode === "all") {
      // json.dumps already serializes Python's None as JSON null, so a
      // void method (implicitly returns None) needs no special-casing here.
      bodyLines.push(`_results.append(${callExpr})`);
    } else {
      bodyLines.push(`_r = ${callExpr}`);
      bodyLines.push(`if _r is not None:`);
      bodyLines.push(`    _results.append(_r)`);
    }
  });
  const indentedBody = bodyLines.map((l) => `    ${l}`).join("\n");

  return `
import json

${userCode}

try:
    _instance = ${className}(${ctorArgsPy})
    _results = []
${indentedBody}
    print(json.dumps(_results))
except Exception as e:
    print(f"RUNTIME_ERROR: {str(e)}")
`;
}