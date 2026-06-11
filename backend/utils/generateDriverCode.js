function formatJsArg(value) {
  return JSON.stringify(value);
}

function formatPythonArg(value) {
  if (value === null) return "None";
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

function formatJavaValue(value) {
  if (Array.isArray(value)) {
    if (value.length === 0) return "new int[] {}";
    if (value.every((v) => typeof v === "number")) return `new int[] {${value.join(", ")}}`;
    return JSON.stringify(value);
  }
  if (typeof value === "number") return String(value);
  if (typeof value === "string") return `"${value}"`;
  if (value === null) return "null";
  return JSON.stringify(value);
}

function formatCppValue(value) {
  if (Array.isArray(value)) {
    if (value.length === 0) return "{}";
    if (value.every((v) => typeof v === "number")) return `{${value.join(", ")}}`;
    return JSON.stringify(value);
  }
  if (typeof value === "number") return String(value);
  if (typeof value === "string") return `"${value}"`;
  return JSON.stringify(value);
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

function inferReturnType(userCode, language) {
  if (language === "java") {
    const match = userCode.match(
      /public\s+(int\[\]|boolean|int|String)\s+\w+\s*\(/
    );

    return match?.[1] || "int";
  }

  if (language === "cpp") {
    const match = userCode.match(
      /(vector<int>|bool|int|string)\s+\w+\s*\(/
    );

    return match?.[1] || "int";
  }

  return null;
}

export function generateDriverCode(language, userCode, testcaseInput, functionName) {
  const fn = functionName || "solve";
  const returnType = inferReturnType(userCode, language);
  console.log("JAVA RETURN TYPE:", returnType);
  const args = buildCallArgs(testcaseInput);
  const isDev = process.env.NODE_ENV !== "production"; // was: import.meta.env.DEV

  if (isDev) console.log("[generateDriverCode] TESTCASE INPUT:", testcaseInput);
  if (isDev) console.log("[generateDriverCode] ARGS:", args);

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

    if (isDev) console.log("[generateDriverCode] PYTHON INVOCATION:", invocation);

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

  if (language === "java") {
    const declarations = args
      .map(({ key, value }) => {
        const javaValue = formatJavaValue(value);
        if (Array.isArray(value)) return `int[] ${key} = ${javaValue};`;
        if (typeof value === "number") return `int ${key} = ${javaValue};`;
        return `Object ${key} = ${javaValue};`;
      })
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
      .map(({ key, value }) => {
        const cppValue = formatCppValue(value);
        if (Array.isArray(value)) return `vector<int> ${key} = ${cppValue};`;
        if (typeof value === "number") return `int ${key} = ${cppValue};`;
        return `auto ${key} = ${cppValue};`;
      })
      .join("\n  ");

    const cppCallArgs = args.map((a) => a.key).join(", ");

    const generated = `
#include <iostream>
#include <vector>
#include <string>
using namespace std;

${userCode}

int main() {
  try {
    ${declarations}
    Solution solution;

    ${returnType === "vector<int>"
        ? `
    ${returnType === "bool"
          ? `
auto result = solution.${fn}(${cppCallArgs});
cout << (result ? "true" : "false") << endl;
`
          : `
auto result = solution.${fn}(${cppCallArgs});
cout << result << endl;
`
        }
    `
        : `
    auto result = solution.${fn}(${cppCallArgs});
    cout << result << endl;
    `
      }

  } catch (exception& e) {
    cout << "RUNTIME_ERROR:" << e.what();
  }

  return 0;
}
`;

    console.log("CPP RETURN TYPE:", returnType);

    return generated;
  }

}