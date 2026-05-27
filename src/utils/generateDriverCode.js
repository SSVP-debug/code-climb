function formatJsArg(value) {
  return JSON.stringify(value);
}

function formatJavaValue(value) {
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return "new int[] {}";
    }

    if (value.every((v) => typeof v === "number")) {
      return `new int[] {${value.join(", ")}}`;
    }

    return JSON.stringify(value);
  }

  if (typeof value === "number") {
    return String(value);
  }

  if (typeof value === "string") {
    return `"${value}"`;
  }

  if (value === null) {
    return "null";
  }

  return JSON.stringify(value);
}

function formatCppValue(value) {
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return "{}";
    }

    if (value.every((v) => typeof v === "number")) {
      return `{${value.join(", ")}}`;
    }

    return JSON.stringify(value);
  }

  if (typeof value === "number") {
    return String(value);
  }

  if (typeof value === "string") {
    return `"${value}"`;
  }

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

  console.warn(
    "[generateDriverCode] Expected object testcase input, got:",
    testcaseInput
  );

  return {};
}

function buildCallArgs(testcaseInput) {
  const normalized =
    normalizeTestcaseInput(testcaseInput);

  return Object.entries(normalized).map(
    ([key, value]) => ({ key, value })
  );
}

export function generateDriverCode(
  language,
  userCode,
  testcaseInput,
  functionName
) {
  const fn = functionName || "solve";
  const args = buildCallArgs(testcaseInput);
  const callArgs = args
    .map((a) => formatJsArg(a.value))
    .join(", ");

  if (language === "python") {
    return `
import json
${userCode}

_result = ${fn}(${callArgs})
print(json.dumps(_result))
`;
  }

  if (language === "javascript") {
    return `
${userCode}

const _result = ${fn}(${callArgs});
console.log(JSON.stringify(_result));
`;
  }

  if (language === "java") {
    const declarations = args
      .map(({ key, value }) => {
        const javaValue = formatJavaValue(value);

        if (Array.isArray(value)) {
          return `int[] ${key} = ${javaValue};`;
        }

        if (typeof value === "number") {
          return `int ${key} = ${javaValue};`;
        }

        return `Object ${key} = ${javaValue};`;
      })
      .join("\n    ");

    const javaCallArgs = args
      .map((a) => a.key)
      .join(", ");

    return `
import java.util.Arrays;

${userCode}

class Main {
  public static void main(String[] args) {
    ${declarations}
    Solution solution = new Solution();
    int[] result = solution.${fn}(${javaCallArgs});
    System.out.println(Arrays.toString(result));
  }
}
`;
  }

  if (language === "cpp") {
    const declarations = args
      .map(({ key, value }) => {
        const cppValue = formatCppValue(value);

        if (Array.isArray(value)) {
          return `vector<int> ${key} = ${cppValue};`;
        }

        if (typeof value === "number") {
          return `int ${key} = ${cppValue};`;
        }

        return `auto ${key} = ${cppValue};`;
      })
      .join("\n  ");

    const cppCallArgs = args
      .map((a) => a.key)
      .join(", ");

    return `
#include <iostream>
#include <vector>
#include <string>
using namespace std;

${userCode}

int main() {
  ${declarations}
  Solution solution;
  auto result = solution.${fn}(${cppCallArgs});
  cout << "[";
  for (size_t i = 0; i < result.size(); ++i) {
    if (i > 0) cout << ",";
    cout << result[i];
  }
  cout << "]" << endl;
  return 0;
}
`;
  }

  return userCode;
}
