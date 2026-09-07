/**
 * languageDrivers/c.js
 *
 * Plan 011 follow-up: adding C. Structurally wired in (registered in
 * backend/config/languages.js with `enabled: false`, both required
 * functions present so languageDrivers/index.js's contract check passes),
 * but NOT a drop-in the way TypeScript was — read this header fully
 * before writing the first real C starter code, and see
 * backend/utils/languageTypes/c.js's header for the type-system side of
 * the same story.
 *
 * Real, documented gaps vs. the other four languages:
 *
 *   1. Array-return support covers exactly one shape: a function
 *      returning `int*` with a trailing `int* returnSize` out-parameter
 *      (the standard LeetCode-C convention). Any other returned shape
 *      (char**, a struct, 2D array) is unsupported — see generate().
 *   2. No exception handling. Every other language's driver wraps the
 *      call in try/catch and prints "RUNTIME_ERROR:<message>" on the
 *      stdout stream that submissionController/judgeController compares
 *      against expected output. C has no such mechanism — a bug in user
 *      code that would be a caught exception in Java/Python/JS instead
 *      becomes a real crash (segfault, abort) that Judge0 reports via its
 *      own status field (SIGSEGV, etc.), not via this stdout convention.
 *      Anything consuming Judge0's response for C must handle that status
 *      separately rather than assuming errors always show up as a
 *      RUNTIME_ERROR-prefixed stdout line.
 *   3. generateOperationSequence() supports scalar (long-representable:
 *      int/long/bool) return values ONLY. C has no reflection (unlike
 *      Java) and no template/decltype mechanism (unlike C++'s SFINAE) to
 *      generically detect a method's return type or whether it's void —
 *      see that function's own comment for the convention this requires
 *      from C design-problem starter code, which does not exist yet
 *      anywhere in the catalog.
 */
import { cDeclaration } from "../languageTypes/c.js";

/**
 * inferReturnType — regex-based FALLBACK ONLY, for problems that don't
 * declare an explicit `returnType` contract (see backend/models/
 * Problem.js). Same posture as java.js/cpp.js's own inferReturnType: a
 * short, intentionally incomplete whitelist. Any C solution returning
 * something outside this list MUST declare `returnType.c` explicitly.
 */
export function inferReturnType(userCode) {
  const match = userCode.match(
    /(int\*|char\*|long long|double|bool|int)\s+\w+\s*\(/
  );
  return match?.[1] || "int";
}

/**
 * generate — single-call driver template.
 */
export function generate({ userCode, fn, returnType, args, paramTypes }) {
  const declarations = args
    .map(({ key, value }) => cDeclaration(key, value, paramTypes[key]))
    .join("\n  ");

  // C's array parameters don't carry their own length — the standard
  // LeetCode-C convention passes an explicit `<key>Size` right after each
  // array argument (`int* nums, int numsSize, ...`). cDeclaration()
  // always declares that companion variable for an array arg (see
  // languageTypes/c.js); this is where it gets threaded into the call.
  const callArgs = args
    .map(({ key, value }) => (Array.isArray(value) ? `${key}, ${key}Size` : key))
    .join(", ");

  const commonIncludes = `#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n#include <stdbool.h>`;

  // The one supported array-return shape: `int*` with a trailing
  // `int* returnSize` out-parameter. See this file's header comment for
  // why nothing else is supported.
  if (returnType === "int*") {
    return `
${commonIncludes}

${userCode}

int main() {
  ${declarations}
  int returnSize;
  int* result = ${fn}(${callArgs}${callArgs ? ", " : ""}&returnSize);
  printf("[");
  for (int i = 0; i < returnSize; i++) {
    if (i) printf(",");
    printf("%d", result[i]);
  }
  printf("]\\n");
  return 0;
}
`;
  }

  if (returnType === "bool") {
    return `
${commonIncludes}

${userCode}

int main() {
  ${declarations}
  bool result = ${fn}(${callArgs});
  printf(result ? "true" : "false");
  printf("\\n");
  return 0;
}
`;
  }

  if (returnType === "char*") {
    return `
${commonIncludes}

${userCode}

int main() {
  ${declarations}
  char* result = ${fn}(${callArgs});
  printf("\\"%s\\"\\n", result);
  return 0;
}
`;
  }

  // Remaining scalar cases: int, long long, double.
  const printFormat = returnType === "long long" ? "%lld" : returnType === "double" ? "%f" : "%d";

  return `
${commonIncludes}

${userCode}

int main() {
  ${declarations}
  ${returnType} result = ${fn}(${callArgs});
  printf("${printFormat}\\n", result);
  return 0;
}
`;
}

/**
 * generateOperationSequence — constructor + method-sequence replay
 * driver, using a struct + prefixed-function convention in place of a
 * class (C has neither): `typedef struct {...} ClassName;` plus
 * `ClassName* ClassName_create(...)` and `<ReturnType>
 * ClassName_<method>(ClassName* self, ...)` functions.
 *
 * SCALAR RESULTS ONLY — every method's result is stored as a `long` (an
 * int/long/bool result fits; a string, array, or struct result does not
 * and is unsupported). This is a real constraint, not an oversight: Java
 * detects void-vs-value at call time via reflection; C++ detects it at
 * compile time via SFINAE/decltype; C has neither mechanism available
 * without either GNU-specific extensions or requiring every method to be
 * written against a fixed, tagged-union result type. Given there is no
 * real C content for design problems yet, the pragmatic choice here is a
 * documented, working subset rather than either implementing a fragile
 * GNU-extension-dependent version or leaving generateOperationSequence()
 * unimplemented (which languageDrivers/index.js would refuse to allow
 * "c" into the registry at all without).
 *
 * `resultMode` ("all" vs "returningOnly") is NOT enforceable for C today:
 * because there is no void-detection mechanism, every call's result is
 * always recorded, matching "all" semantics regardless of what the
 * problem declares. Extend this the day real C design-problem content
 * needs `returningOnly` to actually exclude something.
 */
export function generateOperationSequence({ userCode, className, constructorArgs, opNames, opArgsList }) {
  const ctorDecls = constructorArgs.map(([k, v]) => cDeclaration(k, v)).join("\n  ");
  const ctorCallArgs = constructorArgs
    .map(([k, v]) => (Array.isArray(v) ? `${k}, ${k}Size` : k))
    .join(", ");

  const opBlocks = opNames
    .map((name, i) => {
      const opArgs = opArgsList[i];
      const argDecls = opArgs
        .map((v, j) => cDeclaration(`_op${i}_arg${j}`, v))
        .join("\n    ");
      const callArgs = opArgs
        .map((v, j) => (Array.isArray(v) ? `_op${i}_arg${j}, _op${i}_arg${j}Size` : `_op${i}_arg${j}`))
        .join(", ");
      const fullCallArgs = `_instance${callArgs ? ", " + callArgs : ""}`;
      return `  {\n    ${argDecls}\n    _results[${i}] = (long) ${className}_${name}(${fullCallArgs});\n  }`;
    })
    .join("\n");

  return `
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdbool.h>

${userCode}

int main() {
  ${ctorDecls}
  ${className}* _instance = ${className}_create(${ctorCallArgs});
  long _results[${opNames.length || 1}];
${opBlocks}
  printf("[");
  for (int i = 0; i < ${opNames.length}; i++) {
    if (i) printf(",");
    printf("%ld", _results[i]);
  }
  printf("]\\n");
  return 0;
}
`;
}