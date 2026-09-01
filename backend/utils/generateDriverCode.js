/**
 * generateDriverCode.js
 *
 * Single source of truth for turning (userCode, testcaseInput, functionName,
 * returnType, paramTypes) into a self-contained, compilable program per
 * language. There is only one copy of this file in the repo (backend/) —
 * the frontend never duplicates it, it only references the return-type
 * contract by name in comments (see src/data/problems.js). The previous
 * "frontend and backend copies must remain identical" header comment here
 * was stale and has been removed as part of the execution-pipeline audit.
 */
import { javaDeclaration } from "./languageTypes/java.js";
import { cppDeclaration } from "./languageTypes/cpp.js";

export function formatJsArg(value) {
  return JSON.stringify(value);
}

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

// Regex-based inference is a FALLBACK ONLY, for problems that don't declare
// an explicit `returnType` contract (see backend/models/Problem.js). It is
// intentionally a short whitelist and will always miss some valid type —
// any problem whose natural return type isn't on this list, or isn't on the
// list of common types below, MUST declare `returnType` explicitly rather
// than relying on this regex. Do not treat extending this list as a
// substitute for declaring the contract on the problem itself.
function inferReturnType(userCode, language, declaredReturnType) {
  if (declaredReturnType) return declaredReturnType;

  if (language === "java") {
    const match = userCode.match(
      /public\s+(int\[\]|boolean|long|double|int|String)\s+\w+\s*\(/
    );

    return match?.[1] || "int";
  }

  if (language === "cpp") {
    // vector<vector<int>> must be checked before vector<int> — the latter
    // is a substring of the former, so alternation order matters here.
    const match = userCode.match(
      /(vector<vector<int>>|vector<string>|vector<int>|long long|double|bool|string|int)\s+\w+\s*\(/
    );

    return match?.[1] || "int";
  }

  return null;
}

export function generateDriverCode(language, userCode, testcaseInput, functionName, declaredReturnType, declaredParamTypes) {
  const fn = functionName || "solve";
  const returnType = inferReturnType(userCode, language, declaredReturnType);
  const args = buildCallArgs(testcaseInput);
  // Per-language declared argument types (Problem.paramTypes[language]),
  // e.g. { s: "String", strs: "String[]" }. Optional — languageTypes'
  // inferJavaType/inferCppType fall back to structural inference from the
  // testcase value for any key not present here. See audit finding P0-1.
  const paramTypes = declaredParamTypes || {};
  // Gated behind an explicit opt-in flag rather than "NODE_ENV !==
  // production" (audit finding P2-3: the old check fired in every
  // non-production environment — staging, test, CI — not just local dev,
  // which is noisier than intended and not what "isDev" was meant to
  // mean). Set DRIVER_DEBUG=1 to see per-generation input/args/invocation
  // logging when actually debugging a driver-generation issue.
  const debugEnabled =
    typeof process !== "undefined" && process.env.DRIVER_DEBUG === "1";

  if (debugEnabled) console.log("[generateDriverCode] TESTCASE INPUT:", testcaseInput);
  if (debugEnabled) console.log("[generateDriverCode] ARGS:", args);

  if (language === "python") {
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

  if (language === "javascript") {
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

  if (language === "typescript") {
    // Deliberately reuses formatJsArg (not a separate formatTsArg) and the
    // same call-and-print shape JavaScript uses above — see
    // plans/006-language-expansion-scoping.md: TS is a structural
    // superset of JS, and unlike Java/C++ there is no separate
    // declared-variable step here, so there is nothing meaningfully
    // TS-specific about literal formatting to extract into its own
    // languageTypes/typescript.js module the way java.js/cpp.js exist for
    // their languages' declaration syntax.
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

  if (language === "java") {
    const declarations = args
      .map(({ key, value }) => javaDeclaration(key, value, paramTypes[key]))
      .join("\n    ");

    const javaCallArgs = args.map((a) => a.key).join(", ");

    return `
import java.util.Arrays;

${userCode}

class Main {
  public static void main(String[] args) {
    try {
      ${declarations}
      ${returnType === "int[]"
        ? `
      Solution solution = new Solution();
      int[] result = solution.${fn}(${javaCallArgs});
      System.out.println(Arrays.toString(result));
      `
        : `
      Solution solution = new Solution();
      ${returnType} result = solution.${fn}(${javaCallArgs});
      System.out.println(result);
      `
      }
    } catch (Exception e) {
      System.out.println("RUNTIME_ERROR:" + e.getMessage());
    }
  }
}
`;
  }

  if (language === "cpp") {
    const declarations = args
      .map(({ key, value }) => cppDeclaration(key, value, paramTypes[key]))
      .join("\n  ");

    const cppCallArgs = args.map((a) => a.key).join(", ");

    const generated = `
#include <bits/stdc++.h>
using namespace std;

void printResult(int x) { cout << x; }
void printResult(long long x) { cout << x; }
void printResult(double x) { cout << x; }

void printResult(bool x) {
  cout << (x ? "true" : "false");
}

void printResult(const string& x) {
  cout << "\\"";
  for (char c : x) {
    if (c == '"' || c == '\\\\') cout << '\\\\';
    cout << c;
  }
  cout << "\\"";
}

template<typename T>
void printResult(const vector<T>& v) {
  cout << "[";
  for (size_t i = 0; i < v.size(); i++) {
    if (i) cout << ",";
    printResult(v[i]);
  }
  cout << "]";
}

${userCode}

int main() {
  try {
    ${declarations}

    Solution solution;

    auto result = solution.${fn}(${cppCallArgs});

    printResult(result);
    cout << endl;

  } catch (exception& e) {
    cout << "RUNTIME_ERROR:" << e.what();
  }

  return 0;
}
`;

    return generated;
  }

  throw new Error(
    `Unsupported language: ${language}`
  );
}