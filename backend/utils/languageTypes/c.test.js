import { describe, expect, it } from "vitest";
import { inferCType, formatCValue, cDeclaration } from "./c.js";

describe("inferCType", () => {
  it("prefers a declared type over structural guessing", () => {
    expect(inferCType([1, 2], "int[]")).toBe("int[]");
  });

  it("infers int[] for a numeric array", () => {
    expect(inferCType([1, 2, 3])).toBe("int[]");
  });

  it("infers char*[] for an array of strings", () => {
    expect(inferCType(["eat", "tea"])).toBe("char*[]");
  });

  it("infers int[][] for a numeric matrix", () => {
    expect(inferCType([[1, 2], [3, 4]])).toBe("int[][]");
  });

  it("infers bool/char* for scalar values", () => {
    expect(inferCType(true)).toBe("bool");
    expect(inferCType("hi")).toBe("char*");
  });

  it("infers double for a non-integer number", () => {
    expect(inferCType(1.5)).toBe("double");
  });
});

describe("formatCValue", () => {
  it("formats a string array with quotes", () => {
    expect(formatCValue(["eat", "tea"])).toBe('{"eat", "tea"}');
  });

  it("formats a boolean array using true/false", () => {
    expect(formatCValue([true, false])).toBe("{true, false}");
  });

  it("formats a numeric matrix with nested braces", () => {
    expect(formatCValue([[1, 2], [3, 4]])).toBe("{{1, 2}, {3, 4}}");
  });
});

describe("cDeclaration", () => {
  it("declares a scalar argument correctly", () => {
    expect(cDeclaration("target", 9, "int")).toBe("int target = 9;");
  });

  it("declares a string argument correctly", () => {
    expect(cDeclaration("s", "hi", "char*")).toBe('char* s = "hi";');
  });

  // The one thing C needs that C++ doesn't: a companion `<key>Size`
  // variable, since a C array parameter can't report its own length —
  // see this module's header comment.
  it("declares a 1D array argument with a companion Size variable", () => {
    expect(cDeclaration("nums", [2, 7, 11, 15], "int[]")).toBe(
      "int nums[] = {2, 7, 11, 15};\n  int numsSize = 4;"
    );
  });

  it("declares a 2D array argument with companion Rows/Cols variables", () => {
    expect(cDeclaration("grid", [[1, 2], [3, 4]], "int[][]")).toBe(
      "int grid[2][2] = {{1, 2}, {3, 4}};\n  int gridRows = 2;\n  int gridCols = 2;"
    );
  });
});