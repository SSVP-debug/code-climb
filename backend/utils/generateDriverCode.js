// =============================================================================
// generateDriverCode.js  —  schema-driven, three-layer architecture
//
// Layer 1: Schema  — callers pass an explicit { params, returnType } descriptor.
//                    inferReturnType() is kept as a FALLBACK only (legacy support).
// Layer 2: Serializers — one per language, dispatch by declared type, not JS typeof.
// Layer 3: Template Emitters — one per language, output format driven by returnType.
//
// Fixes addressed (see audit report):
//   Bug 1 — C++ nested ternary dead-code (vector<int> + bool mutually exclusive)
//   Bug 2 — C++ float values narrowed into vector<int>
//   Bug 3 — Java boolean input declared as Object
//   Bug 4 — Java String[] / int[][] fell through to raw JSON.stringify
//   Bug 5 — Python bool serialized to lowercase true/false → NameError
//   Bug 6 — inferReturnType matched first method, not target function
//   Bug 7 — C++ string initialised as const char* instead of std::string
//   Bug 8 — Python TreeNode return crashed json.dumps
//   Bug 9 — Java String param declared as Object → type mismatch on call
// =============================================================================

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normalizeTestcaseInput(testcaseInput) {
  if (
    typeof testcaseInput === "object" &&
    testcaseInput !== null &&
    !Array.isArray(testcaseInput)
  ) {
    return testcaseInput;
  }
  console.warn("[generateDriverCode] Expected object testcase input, got:", testcaseInput);
  return {};
}

function buildCallArgs(testcaseInput) {
  const normalized = normalizeTestcaseInput(testcaseInput);
  return Object.entries(normalized).map(([key, value]) => ({ key, value }));
}

// ---------------------------------------------------------------------------
// Layer 1 — Schema / return-type resolution
//
// Preferred: callers pass a `schema` object:
//   {
//     functionName: "twoSum",
//     params: [{ name: "nums", type: "int[]" }, { name: "target", type: "int" }],
//     returnType: "int[]"
//   }
//
// Fallback: inferReturnType() — regex-based, kept for legacy callers that do
// not yet supply a schema.  Bug 6 is mitigated by anchoring the match to the
// declared functionName so helper methods are skipped.
// ---------------------------------------------------------------------------

function inferReturnType(userCode, language, functionName) {
  if (language === "java") {
    // Anchor to the target function name to avoid matching helper methods (Bug 6).
    const fnPattern = functionName
      ? new RegExp(`public\\s+(int\\[\\]|boolean|int|String)\\s+${functionName}\\s*\\(`)
      : /public\s+(int\[\]|boolean|int|String)\s+\w+\s*\(/;
    const match = userCode.match(fnPattern);
    return match?.[1] ?? "int";
  }

  if (language === "cpp") {
    const fnPattern = functionName
      ? new RegExp(`(vector<int>|bool|int|string)\\s+${functionName}\\s*\\(`)
      : /(vector<int>|bool|int|string)\s+\w+\s*\(/;
    const match = userCode.match(fnPattern);
    return match?.[1] ?? "int";
  }

  return null;
}

// ---------------------------------------------------------------------------
// Layer 2 — Type-dispatched serializers
//
// Each serializer accepts (value, declaredType) and returns a string that is
// valid syntax in the target language.  declaredType drives the decision; the
// JS typeof / Array.isArray checks are only used for fallback / nested types.
// ---------------------------------------------------------------------------

// --- Python ------------------------------------------------------------------

function serializePython(value, type) {
  switch (type) {
    case "int":
    case "float":
      return String(value);

    case "bool":
      // Bug 5 fix: must be capitalised Python literals, not JS "true"/"false".
      return value ? "True" : "False";

    case "str":
    case "string":
      return JSON.stringify(value); // produces "..." with correct escaping

    case "null":
      return "None";

    case "int[]":
    case "number[]": {
      const items = (value ?? []).map((v) => serializePython(v, "int"));
      return `[${items.join(", ")}]`;
    }

    case "string[]": {
      const items = (value ?? []).map((v) => serializePython(v, "str"));
      return `[${items.join(", ")}]`;
    }

    case "int[][]":
    case "number[][]": {
      const rows = (value ?? []).map((row) => serializePython(row, "int[]"));
      return `[${rows.join(", ")}]`;
    }

    default:
      // Generic fallback — handles nested arrays / plain objects
      if (value === null) return "None";
      if (typeof value === "boolean") return value ? "True" : "False";
      if (typeof value === "string") return JSON.stringify(value);
      if (Array.isArray(value)) {
        return `[${value.map((v) => serializePython(v, "")).join(", ")}]`;
      }
      if (typeof value === "object") {
        const entries = Object.entries(value)
          .map(([k, v]) => `${JSON.stringify(k)}: ${serializePython(v, "")}`)
          .join(", ");
        return `{${entries}}`;
      }
      return String(value);
  }
}

// Python output serializer — converts the result value to something that can
// be printed after the user's function runs.
// Bug 8 fix: TreeNode return type uses a BFS serializer instead of json.dumps.
function pythonOutputSerializer(returnType) {
  switch (returnType) {
    case "TreeNode":
      return `
def _serialize_tree(node):
    if node is None:
        return []
    result, queue = [], deque([node])
    while queue:
        n = queue.popleft()
        if n:
            result.append(n.val)
            queue.append(n.left)
            queue.append(n.right)
        else:
            result.append(None)
    # trim trailing Nones
    while result and result[-1] is None:
        result.pop()
    return result

    _result = ${/* placeholder — filled in emitter */""}
    print(json.dumps(_serialize_tree(_result)))`;
    default:
      return `print(json.dumps(_result))`;
  }
}

// --- JavaScript --------------------------------------------------------------

function serializeJs(value /*, type not needed — JSON.stringify handles all */) {
  return JSON.stringify(value);
}

// --- Java --------------------------------------------------------------------

// Returns { decl: "int[]", literal: "new int[] {1, 2}" }
function serializeJava(value, type) {
  switch (type) {
    case "int":
      return { decl: "int", literal: String(value) };

    case "long":
      return { decl: "long", literal: String(value) + "L" };

    case "double":
    case "float":
      return { decl: "double", literal: String(value) };

    case "boolean":
      // Bug 3 fix: correct Java type + correct literal
      return { decl: "boolean", literal: value ? "true" : "false" };

    case "String":
    case "string":
      // Bug 9 fix: declared as String, not Object
      return { decl: "String", literal: `"${String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"` };

    case "int[]":
    case "number[]": {
      const items = (value ?? []).map((v) => String(v)).join(", ");
      return { decl: "int[]", literal: `new int[] {${items}}` };
    }

    case "String[]":
    case "string[]": {
      // Bug 4 fix: proper Java String[] literal
      const items = (value ?? [])
        .map((v) => `"${String(v).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`)
        .join(", ");
      return { decl: "String[]", literal: `new String[] {${items}}` };
    }

    case "int[][]":
    case "number[][]": {
      // Bug 4 fix: proper Java 2-D array literal
      const rows = (value ?? []).map((row) => {
        const items = (row ?? []).map((v) => String(v)).join(", ");
        return `new int[] {${items}}`;
      });
      return {
        decl: "int[][]",
        literal: `new int[][] {${rows.join(", ")}}`,
      };
    }

    default:
      // Best-effort fallback
      if (value === null) return { decl: "Object", literal: "null" };
      if (typeof value === "boolean") return { decl: "boolean", literal: String(value) };
      if (typeof value === "number") return { decl: "int", literal: String(value) };
      if (typeof value === "string") return { decl: "String", literal: `"${value}"` };
      return { decl: "Object", literal: JSON.stringify(value) };
  }
}

// Java result printer snippet — returns the println statement for the given return type.
function javaResultPrinter(returnType, fn, callArgs) {
  switch (returnType) {
    case "int[]":
      return `int[] result = solution.${fn}(${callArgs});\n      System.out.println(Arrays.toString(result));`;
    case "String[]":
      return `String[] result = solution.${fn}(${callArgs});\n      System.out.println(Arrays.toString(result));`;
    case "boolean":
      return `boolean result = solution.${fn}(${callArgs});\n      System.out.println(result);`;
    case "String":
      return `String result = solution.${fn}(${callArgs});\n      System.out.println(result);`;
    case "int[][]":
      return `int[][] result = solution.${fn}(${callArgs});\n      System.out.println(Arrays.deepToString(result));`;
    default:
      // covers int, long, double, etc.
      return `${returnType} result = solution.${fn}(${callArgs});\n      System.out.println(result);`;
  }
}

// --- C++ ---------------------------------------------------------------------

// Returns a string that is valid C++ initialiser syntax.
function serializeCpp(value, type) {
  switch (type) {
    case "int":
      return String(Math.trunc(value)); // ensure integer literal

    case "long":
    case "long long":
      return String(value) + "LL";

    case "double":
    case "float":
      return String(value);

    case "bool":
      return value ? "true" : "false";

    case "string":
    case "String":
      // Bug 7 fix: wrap in std::string(...) so the variable has the right type
      return `string(${JSON.stringify(value)})`;

    case "int[]":
    case "vector<int>":
    case "number[]": {
      // Bug 2 fix: truncate to integer to avoid narrowing-conversion errors
      const items = (value ?? []).map((v) => String(Math.trunc(v))).join(", ");
      return `{${items}}`;
    }

    case "string[]":
    case "vector<string>": {
      const items = (value ?? [])
        .map((v) => JSON.stringify(v))
        .join(", ");
      return `{${items}}`;
    }

    case "int[][]":
    case "vector<vector<int>>": {
      const rows = (value ?? []).map((row) => {
        const items = (row ?? []).map((v) => String(Math.trunc(v))).join(", ");
        return `{${items}}`;
      });
      return `{${rows.join(", ")}}`;
    }

    default:
      if (value === null) return "nullptr";
      if (typeof value === "boolean") return value ? "true" : "false";
      if (typeof value === "number") return String(value);
      if (typeof value === "string") return `string(${JSON.stringify(value)})`;
      return JSON.stringify(value);
  }
}

// C++ declaration line — maps declared type to the correct C++ type keyword.
function cppDeclaration(key, value, declaredType) {
  const literal = serializeCpp(value, declaredType);
  switch (declaredType) {
    case "int":          return `int ${key} = ${literal};`;
    case "long":         return `long long ${key} = ${literal};`;
    case "double":       return `double ${key} = ${literal};`;
    case "float":        return `float ${key} = ${literal};`;
    case "bool":         return `bool ${key} = ${literal};`;
    case "string":
    case "String":       return `string ${key} = ${literal};`;
    case "int[]":
    case "number[]":
    case "vector<int>":  return `vector<int> ${key} = ${literal};`;
    case "string[]":
    case "vector<string>": return `vector<string> ${key} = ${literal};`;
    case "int[][]":
    case "vector<vector<int>>": return `vector<vector<int>> ${key} = ${literal};`;
    default:             return `auto ${key} = ${literal};`;
  }
}

// C++ result output snippet.
// Bug 1 fix: separate top-level branches — no nested ternary, no dead code.
// Bug 1 fix: vector<int> uses a join loop, not cout << (no << operator on vectors).
function cppResultOutput(returnType, fn, callArgs) {
  switch (returnType) {
    case "bool":
      return `
    bool result = solution.${fn}(${callArgs});
    cout << (result ? "true" : "false") << endl;`;

    case "vector<int>":
      return `
    vector<int> result = solution.${fn}(${callArgs});
    cout << "[";
    for (int i = 0; i < (int)result.size(); i++) {
      if (i > 0) cout << ",";
      cout << result[i];
    }
    cout << "]" << endl;`;

    case "vector<string>":
      return `
    vector<string> result = solution.${fn}(${callArgs});
    cout << "[";
    for (int i = 0; i < (int)result.size(); i++) {
      if (i > 0) cout << ",";
      cout << "\\"" << result[i] << "\\"";
    }
    cout << "]" << endl;`;

    case "vector<vector<int>>":
      return `
    vector<vector<int>> result = solution.${fn}(${callArgs});
    cout << "[";
    for (int i = 0; i < (int)result.size(); i++) {
      if (i > 0) cout << ",";
      cout << "[";
      for (int j = 0; j < (int)result[i].size(); j++) {
        if (j > 0) cout << ",";
        cout << result[i][j];
      }
      cout << "]";
    }
    cout << "]" << endl;`;

    case "string":
      return `
    string result = solution.${fn}(${callArgs});
    cout << result << endl;`;

    default:
      // int, long, double, etc.
      return `
    auto result = solution.${fn}(${callArgs});
    cout << result << endl;`;
  }
}

// ---------------------------------------------------------------------------
// Layer 3 — Template Emitters
// ---------------------------------------------------------------------------

function emitPython(fn, userCode, args, schema, isDev) {
  // Resolve param type for each arg; fall back to value-shape if schema absent.
  const callArgs = args
    .map(({ key, value }, i) => {
      const declaredType = schema?.params?.[i]?.type ?? null;
      if (key.toLowerCase().includes("root") && Array.isArray(value)) {
        const serialized = declaredType
          ? serializePython(value, declaredType)
          : serializePython(value, "int[]");
        return `build_tree(${serialized})`;
      }
      return declaredType
        ? serializePython(value, declaredType)
        : serializePython(value, ""); // fallback: generic
    })
    .join(", ");

  const hasClass = userCode.includes("class Solution");
  const invocation = hasClass
    ? `Solution().${fn}(${callArgs})`
    : `${fn}(${callArgs})`;

  if (isDev) console.log("[generateDriverCode] PYTHON INVOCATION:", invocation);

  const returnType = schema?.returnType ?? null;

  // Bug 8 fix: tree return type gets BFS serializer; everything else json.dumps.
  const outputBlock =
    returnType === "TreeNode"
      ? `
def _serialize_tree(node):
    if node is None:
        return []
    result, queue = [], deque([node])
    while queue:
        n = queue.popleft()
        if n:
            result.append(n.val)
            queue.append(n.left)
            queue.append(n.right)
        else:
            result.append(None)
    while result and result[-1] is None:
        result.pop()
    return result

try:
    _result = ${invocation}
    print(json.dumps(_serialize_tree(_result)))
except Exception as e:
    print(f"RUNTIME_ERROR: {str(e)}")`
      : `
try:
    _result = ${invocation}
    print(json.dumps(_result))
except Exception as e:
    print(f"RUNTIME_ERROR: {str(e)}")`;

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
${outputBlock}
`;
}

function emitJavaScript(fn, userCode, args) {
  const callArgs = args.map((a) => serializeJs(a.value)).join(", ");
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

function emitJava(fn, userCode, args, schema, returnType) {
  const declarations = args
    .map(({ key, value }, i) => {
      const declaredType = schema?.params?.[i]?.type ?? null;
      if (declaredType) {
        const { decl, literal } = serializeJava(value, declaredType);
        return `${decl} ${key} = ${literal};`;
      }
      // Legacy fallback (no schema) — best-effort by JS typeof
      if (Array.isArray(value)) {
        const { decl, literal } = serializeJava(value, "int[]");
        return `${decl} ${key} = ${literal};`;
      }
      if (typeof value === "boolean") {
        const { decl, literal } = serializeJava(value, "boolean");
        return `${decl} ${key} = ${literal};`;
      }
      if (typeof value === "string") {
        const { decl, literal } = serializeJava(value, "String");
        return `${decl} ${key} = ${literal};`;
      }
      if (typeof value === "number") {
        return `int ${key} = ${value};`;
      }
      if (value === null) {
        return `Object ${key} = null;`;
      }
      return `Object ${key} = ${JSON.stringify(value)};`;
    })
    .join("\n      ");

  const callArgs = args.map((a) => a.key).join(", ");
  const resultBlock = javaResultPrinter(returnType, fn, callArgs);

  return `
import java.util.Arrays;

${userCode}

class Main {
  public static void main(String[] args) {
    try {
      ${declarations}
      Solution solution = new Solution();
      ${resultBlock}
    } catch (Exception e) {
      System.out.println("RUNTIME_ERROR:" + e.getMessage());
    }
  }
}
`;
}

function emitCpp(fn, userCode, args, schema, returnType) {
  const declarations = args
    .map(({ key, value }, i) => {
      const declaredType = schema?.params?.[i]?.type ?? null;
      if (declaredType) {
        return cppDeclaration(key, value, declaredType);
      }
      // Legacy fallback — best-effort by JS typeof
      if (Array.isArray(value)) return cppDeclaration(key, value, "vector<int>");
      if (typeof value === "boolean") return `bool ${key} = ${value ? "true" : "false"};`;
      if (typeof value === "string") return `string ${key} = string(${JSON.stringify(value)});`;
      if (typeof value === "number") return `int ${key} = ${Math.trunc(value)};`;
      return `auto ${key} = ${serializeCpp(value, "")};`;
    })
    .join("\n  ");

  const callArgs = args.map((a) => a.key).join(", ");
  const resultBlock = cppResultOutput(returnType, fn, callArgs);

  return `
#include <iostream>
#include <vector>
#include <string>
using namespace std;

${userCode}

int main() {
  try {
    ${declarations}
    Solution solution;
${resultBlock}
  } catch (exception& e) {
    cout << "RUNTIME_ERROR:" << e.what();
  }

  return 0;
}
`;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * generateDriverCode
 *
 * @param {string} language        - "python" | "javascript" | "java" | "cpp"
 * @param {string} userCode        - the user's submitted solution source
 * @param {object} testcaseInput   - { paramName: value, ... }
 * @param {string} functionName    - name of the target function / method
 * @param {object} [schema]        - optional explicit schema:
 *                                   {
 *                                     functionName: string,
 *                                     params: [{ name: string, type: string }],
 *                                     returnType: string
 *                                   }
 *                                   When provided, overrides regex inference entirely.
 */
export function generateDriverCode(language, userCode, testcaseInput, functionName, schema) {
  const fn = functionName || schema?.functionName || "solve";
  const isDev = process.env.NODE_ENV !== "production";

  // Resolve return type: schema wins, then regex inference, then default "int".
  const returnType =
    schema?.returnType ??
    inferReturnType(userCode, language, fn) ??
    "int";

  const args = buildCallArgs(testcaseInput);

  if (isDev) {
    console.log("[generateDriverCode] language:", language);
    console.log("[generateDriverCode] returnType:", returnType);
    console.log("[generateDriverCode] TESTCASE INPUT:", testcaseInput);
    console.log("[generateDriverCode] ARGS:", args);
  }

  if (language === "python") {
    return emitPython(fn, userCode, args, schema, isDev);
  }

  if (language === "javascript") {
    return emitJavaScript(fn, userCode, args);
  }

  if (language === "java") {
    return emitJava(fn, userCode, args, schema, returnType);
  }

  if (language === "cpp") {
    return emitCpp(fn, userCode, args, schema, returnType);
  }

  console.warn("[generateDriverCode] Unsupported language:", language);
  return null;
}