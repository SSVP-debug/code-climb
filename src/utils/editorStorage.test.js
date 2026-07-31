import { describe, expect, it, beforeEach } from "vitest";
import {
  getCodeStorageKey,
  loadSavedCode,
  saveCode,
  saveLanguage,
  loadLanguage,
} from "./editorStorage";

// Gate 3 audit, P1-2 — correction: the original audit reported "no code
// persistence across problem navigation" based on a grep that (due to a
// literal-pipe bug in the pattern) never actually matched this file.
// useProblemSolver.js already saves to, and restores from, localStorage on
// every mount via these exact functions (loadSavedCode as the useState
// initializer, saveCode on every code/language change). These tests pin
// down that the underlying persistence primitive behaves correctly, since
// the audit's original claim turned out to be false and no code fix was
// made — see the Gate 3 implementation report for the full explanation.
describe("editorStorage — code persists across problem navigation (Gate 3 P1-2)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("round-trips code for a given slug + language", () => {
    saveCode("two-sum", "python", "def two_sum(nums, target): pass");
    expect(loadSavedCode("two-sum", "python")).toBe("def two_sum(nums, target): pass");
  });

  it("keeps code isolated per problem — switching problems and back does not lose or mix code", () => {
    saveCode("two-sum", "python", "# in-progress attempt on two-sum");
    saveCode("reverse-list", "python", "# in-progress attempt on reverse-list");

    // Simulates navigating from Problem A -> Problem B -> back to A, which
    // remounts the solver (ProblemDetailsPage uses key={slug}) — the only
    // thing that survives a remount is whatever's in localStorage.
    expect(loadSavedCode("two-sum", "python")).toBe("# in-progress attempt on two-sum");
    expect(loadSavedCode("reverse-list", "python")).toBe("# in-progress attempt on reverse-list");
  });

  it("keeps code isolated per language for the same problem", () => {
    saveCode("two-sum", "python", "# python attempt");
    saveCode("two-sum", "javascript", "// js attempt");

    expect(loadSavedCode("two-sum", "python")).toBe("# python attempt");
    expect(loadSavedCode("two-sum", "javascript")).toBe("// js attempt");
  });

  it("falls back to the provided starter code when nothing is saved yet", () => {
    expect(loadSavedCode("brand-new-problem", "python", "# starter template")).toBe(
      "# starter template"
    );
  });

  it("persists the last-selected language per problem", () => {
    saveLanguage("two-sum", "cpp");
    expect(loadLanguage("two-sum")).toBe("cpp");
  });

  it("defaults to python when no language has been selected yet", () => {
    expect(loadLanguage("never-opened-problem")).toBe("python");
  });

  it("uses a distinct storage key per slug+language so problems can never collide", () => {
    expect(getCodeStorageKey("two-sum", "python")).not.toBe(getCodeStorageKey("reverse-list", "python"));
    expect(getCodeStorageKey("two-sum", "python")).not.toBe(getCodeStorageKey("two-sum", "javascript"));
  });
});
