import { describe, expect, it } from "vitest";
import { inferJavaType, formatJavaLiteral, javaDeclaration } from "./java.js";

describe("inferJavaType", () => {
  it("prefers a declared type over structural guessing", () => {
    expect(inferJavaType("hi", "String")).toBe("String");
    expect(inferJavaType([1, 2], "long[]")).toBe("long[]");
  });

  it("infers String for a string value", () => {
    expect(inferJavaType("()[]{}")).toBe("String");
  });

  it("infers String[] for an array of strings", () => {
    expect(inferJavaType(["eat", "tea", "tan"])).toBe("String[]");
  });

  it("infers int[][] for a numeric matrix", () => {
    expect(inferJavaType([[1, 2], [3, 4]])).toBe("int[][]");
  });

  it("infers String[][] for a string matrix", () => {
    expect(inferJavaType([["a", "b"], ["c"]])).toBe("String[][]");
  });

  it("infers boolean for a boolean value", () => {
    expect(inferJavaType(true)).toBe("boolean");
  });

  it("infers boolean[] for an array of booleans", () => {
    expect(inferJavaType([true, false])).toBe("boolean[]");
  });

  it("infers int for an integer number and double for a fractional one", () => {
    expect(inferJavaType(5)).toBe("int");
    expect(inferJavaType(3.14)).toBe("double");
  });

  it("infers int[] for an empty array (unchanged default behavior)", () => {
    expect(inferJavaType([])).toBe("int[]");
  });
});

describe("formatJavaLiteral", () => {
  it("quotes and escapes a String literal", () => {
    expect(formatJavaLiteral('say "hi"', "String")).toBe('"say \\"hi\\""');
  });

  it("formats a String[] literal with each element quoted", () => {
    expect(formatJavaLiteral(["eat", "tea"], "String[]")).toBe('{"eat", "tea"}');
  });

  it("formats an int[][] literal with nested braces", () => {
    expect(formatJavaLiteral([[1, 2], [3, 4]], "int[][]")).toBe("{{1, 2}, {3, 4}}");
  });

  it("formats a boolean[] literal using true/false", () => {
    expect(formatJavaLiteral([true, false], "boolean[]")).toBe("{true, false}");
  });

  it("appends L suffix for long literals", () => {
    expect(formatJavaLiteral(4999950000, "long")).toBe("4999950000L");
  });
});

describe("javaDeclaration — regression tests for confirmed-broken problems (audit P0-1)", () => {
  it("valid-parentheses: a String argument declares as String, not Object", () => {
    const line = javaDeclaration("s", "()[]{}", "String");
    expect(line).toBe('String s = "()[]{}";');
    expect(line).not.toContain("Object");
  });

  it("group-anagrams: a String[] argument declares as String[], not int[]", () => {
    const line = javaDeclaration("strs", ["eat", "tea", "tan"], "String[]");
    expect(line).toBe('String[] strs = {"eat", "tea", "tan"};');
    expect(line).not.toContain("int[]");
  });

  it("matrix argument declares as int[][], not int[] with an invalid literal", () => {
    const line = javaDeclaration("grid", [[1, 2], [3, 4]], "int[][]");
    expect(line).toBe("int[][] grid = {{1, 2}, {3, 4}};");
  });

  it("falls back to structural inference when no paramTypes contract is declared", () => {
    const line = javaDeclaration("s", "hello");
    expect(line).toBe('String s = "hello";');
  });
});
