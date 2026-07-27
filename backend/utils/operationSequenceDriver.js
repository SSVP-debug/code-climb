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
 */
import { formatJsArg, formatPythonArg } from "./generateDriverCode.js";
import { javaDeclaration, formatJavaLiteral, inferJavaType } from "./languageTypes/java.js";
import { cppDeclaration, formatCppValue, inferCppType } from "./languageTypes/cpp.js";

function generateJsDriver(userCode, className, constructorArgs, opNames, opArgsList, resultMode) {
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

function generatePythonDriver(userCode, className, constructorArgs, opNames, opArgsList, resultMode) {
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

// Java has no built-in dynamic dispatch by method-name string, so this
// uses reflection: find the declared method matching (name, argument
// count) and invoke it. Method.invoke performs unboxing + widening
// conversions automatically, and returns null for a void method — which
// conveniently already matches this driver's "null for void" convention
// without any special-casing.
function generateJavaDriver(userCode, className, constructorArgs, opNames, opArgsList, resultMode) {
  const ctorDecls = constructorArgs.map(([k, v]) => javaDeclaration(k, v)).join("\n      ");
  const ctorCallArgs = constructorArgs.map(([k]) => k).join(", ");

  const opNamesLiteral = opNames.map((n) => `"${n}"`).join(", ");
  const opArgsLiteral = opArgsList
    .map((argsRow) => {
      const items = argsRow.map((v) => formatJavaLiteral(v, inferJavaType(v))).join(", ");
      return `{ ${items} }`;
    })
    .join(", ");

  return `
import java.util.*;
import java.lang.reflect.Method;

${userCode}

class Main {
  // Minimal JSON encoder for reflection results — no JSON library is
  // guaranteed to be on the Judge0 Java classpath, so this only needs to
  // handle the value shapes these design problems actually return:
  // null, String, Boolean, any Number (int/long/double via autoboxing),
  // and List<...> (e.g. Twitter's getNewsFeed).
  static String toJson(Object o) {
    if (o == null) return "null";
    if (o instanceof String) {
      StringBuilder sb = new StringBuilder("\\"");
      for (char c : ((String) o).toCharArray()) {
        if (c == '"' || c == '\\\\') sb.append('\\\\');
        sb.append(c);
      }
      sb.append("\\"");
      return sb.toString();
    }
    if (o instanceof Boolean || o instanceof Number) return String.valueOf(o);
    if (o instanceof List) {
      StringBuilder sb = new StringBuilder("[");
      List<?> list = (List<?>) o;
      for (int i = 0; i < list.size(); i++) {
        if (i > 0) sb.append(",");
        sb.append(toJson(list.get(i)));
      }
      sb.append("]");
      return sb.toString();
    }
    if (o instanceof int[]) {
      int[] arr = (int[]) o;
      StringBuilder sb = new StringBuilder("[");
      for (int i = 0; i < arr.length; i++) {
        if (i > 0) sb.append(",");
        sb.append(arr[i]);
      }
      sb.append("]");
      return sb.toString();
    }
    return "\\"" + o.toString() + "\\"";
  }

  public static void main(String[] args) {
    try {
      ${ctorDecls}
      ${className} _instance = new ${className}(${ctorCallArgs});
      String[] _opNames = { ${opNamesLiteral} };
      Object[][] _opArgs = { ${opArgsLiteral} };
      List<Object> _results = new ArrayList<>();

      for (int _i = 0; _i < _opNames.length; _i++) {
        Method _method = null;
        for (Method m : _instance.getClass().getMethods()) {
          if (m.getName().equals(_opNames[_i]) && m.getParameterCount() == _opArgs[_i].length) {
            _method = m;
            break;
          }
        }
        if (_method == null) {
          throw new RuntimeException("No method named " + _opNames[_i] + " with " + _opArgs[_i].length + " argument(s)");
        }
        Object _res = _method.invoke(_instance, _opArgs[_i]);
        ${resultMode === "all" ? "_results.add(_res);" : "if (_res != null) _results.add(_res);"}
      }

      System.out.println(toJson(_results));
    } catch (Exception e) {
      Throwable _cause = e.getCause() != null ? e.getCause() : e;
      System.out.println("RUNTIME_ERROR:" + _cause.getMessage());
    }
  }
}
`;
}

// C++ has neither dynamic dispatch nor reflection, but the op sequence is
// known at driver-GENERATION time (not just at runtime) — every op call is
// unrolled into a direct, statically-typed method call. The remaining
// problem is that different ops can have different return types (some
// void, some not) within the same sequence; SFINAE (portable back to
// C++11, unlike `if constexpr` which needs C++17 and isn't guaranteed on
// every Judge0 environment) picks the right overload of callOp() based on
// whether the wrapped call expression is void, exactly mirroring Java's
// reflection-based "null for void" behavior without needing reflection.
function generateCppDriver(userCode, className, constructorArgs, opNames, opArgsList, resultMode) {
  const ctorDecls = constructorArgs
    .map(([k, v]) => cppDeclaration(k, v))
    .join("\n    ");
  const ctorCallArgs = constructorArgs.map(([k]) => k).join(", ");

  const includeVoid = resultMode === "all" ? "true" : "false";
  const opCallLines = opNames
    .map((name, i) => {
      const argsCpp = opArgsList[i].map((v) => formatCppValue(v)).join(", ");
      return `callOp(_results, ${includeVoid}, [&]{ return _instance.${name}(${argsCpp}); });`;
    })
    .join("\n    ");

  return `
#include <bits/stdc++.h>
using namespace std;

string toJsonStr(int x) { return to_string(x); }
string toJsonStr(long long x) { return to_string(x); }
string toJsonStr(long x) { return to_string(x); }
string toJsonStr(double x) { ostringstream oss; oss << x; return oss.str(); }
string toJsonStr(bool x) { return x ? "true" : "false"; }
string toJsonStr(const string& x) {
  string r = "\\"";
  for (char c : x) {
    if (c == '"' || c == '\\\\') r += '\\\\';
    r += c;
  }
  r += "\\"";
  return r;
}
template<typename T>
string toJsonStr(const vector<T>& v) {
  string r = "[";
  for (size_t i = 0; i < v.size(); i++) {
    if (i) r += ",";
    r += toJsonStr(v[i]);
  }
  r += "]";
  return r;
}

// SFINAE dispatch: exactly one of these two overloads is enabled per call
// site, depending on whether decltype(f()) is void. Portable to C++11.
template<typename F>
typename enable_if<is_void<decltype(declval<F>()())>::value>::type
callOp(vector<string>& results, bool includeVoid, F&& f) {
  f();
  if (includeVoid) results.push_back("null");
}

template<typename F>
typename enable_if<!is_void<decltype(declval<F>()())>::value>::type
callOp(vector<string>& results, bool /*includeVoid*/, F&& f) {
  auto r = f();
  results.push_back(toJsonStr(r));
}

${userCode}

int main() {
  try {
    ${ctorDecls}
    ${className} _instance{${ctorCallArgs}};
    vector<string> _results;

    ${opCallLines}

    cout << "[";
    for (size_t i = 0; i < _results.size(); i++) {
      if (i) cout << ",";
      cout << _results[i];
    }
    cout << "]" << endl;
  } catch (exception& e) {
    cout << "RUNTIME_ERROR:" << e.what();
  }
  return 0;
}
`;
}

/**
 * generateOperationSequenceDriver — public entry point, mirrors
 * generateDriverCode()'s call shape.
 *
 * @param {string} language - "python" | "javascript" | "java" | "cpp"
 * @param {string} userCode - the user's class implementation
 * @param {{opNames: string[], opArgsList: any[][], constructorArgs: [string, any][]}} shape
 *   - the result of operationSequenceShape.js's identifyOperationSequence()
 * @param {string} className - the class to instantiate (Problem.functionName)
 * @param {"all"|"returningOnly"} resultMode
 */
export function generateOperationSequenceDriver(language, userCode, shape, className, resultMode = "all") {
  const { constructorArgs, opNames, opArgsList } = shape;

  if (language === "javascript") {
    return generateJsDriver(userCode, className, constructorArgs, opNames, opArgsList, resultMode);
  }
  if (language === "python") {
    return generatePythonDriver(userCode, className, constructorArgs, opNames, opArgsList, resultMode);
  }
  if (language === "java") {
    return generateJavaDriver(userCode, className, constructorArgs, opNames, opArgsList, resultMode);
  }
  if (language === "cpp") {
    return generateCppDriver(userCode, className, constructorArgs, opNames, opArgsList, resultMode);
  }

  throw new Error(`Unsupported language: ${language}`);
}
