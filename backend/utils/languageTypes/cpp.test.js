import { describe, expect, it } from "vitest";
import { inferCppType, formatCppValue, cppDeclaration } from "./cpp.js";

describe("inferCppType", () => {
  it("prefers a declared type over structural guessing", () => {
    expect(inferCppType([1.5, 2.5], "vector<double>")).toBe("vector<double>");
  });

  it("infers vector<string> for an array of strings", () => {
    expect(inferCppType(["eat", "tea"])).toBe("vector<string>");
  });

  it("infers vector<vector<int>> for a numeric matrix (unchanged default)", () => {
    expect(inferCppType([[1, 2], [3, 4]])).toBe("vector<vector<int>>");
  });

  it("infers vector<vector<string>> for a string matrix", () => {
    expect(inferCppType([["a", "b"], ["c"]])).toBe("vector<vector<string>>");
  });

  it("infers vector<bool> for an array of booleans", () => {
    expect(inferCppType([true, false])).toBe("vector<bool>");
  });

  it("infers bool/string for scalar values", () => {
    expect(inferCppType(true)).toBe("bool");
    expect(inferCppType("hi")).toBe("string");
  });
});

describe("formatCppValue", () => {
  it("formats a string array with quotes", () => {
    expect(formatCppValue(["eat", "tea"])).toBe('{"eat", "tea"}');
  });

  it("formats a boolean array using true/false", () => {
    expect(formatCppValue([true, false])).toBe("{true, false}");
  });

  it("formats a numeric matrix with nested braces", () => {
    expect(formatCppValue([[1, 2], [3, 4]])).toBe("{{1, 2}, {3, 4}}");
  });
});

describe("cppDeclaration", () => {
  it("declares a string argument correctly", () => {
    expect(cppDeclaration("s", "()[]{}", "string")).toBe('string s = "()[]{}";');
  });

  it("declares a string-array argument correctly", () => {
    expect(cppDeclaration("strs", ["eat", "tea"], "vector<string>")).toBe(
      'vector<string> strs = {"eat", "tea"};'
    );
  });
});
