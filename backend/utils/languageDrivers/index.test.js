import { describe, expect, it, vi, afterEach } from "vitest";

describe("languageDrivers/index.js — registry", () => {
  afterEach(() => {
    vi.resetModules();
    vi.doUnmock("../../config/languages.js");
    vi.doUnmock("./typescript.js");
  });

  it("getDriver() returns a module with generate() and generateOperationSequence() for every real registered language", async () => {
    const { getDriver } = await import("./index.js");
    const { LANGUAGES } = await import("../../config/languages.js");

    for (const key of Object.keys(LANGUAGES)) {
      const driver = getDriver(key);
      expect(driver, `driver for "${key}"`).toBeDefined();
      expect(typeof driver.generate, `"${key}".generate`).toBe("function");
      expect(typeof driver.generateOperationSequence, `"${key}".generateOperationSequence`).toBe("function");
    }
  });

  it("getDriver() returns undefined for an unregistered language key", async () => {
    const { getDriver } = await import("./index.js");
    expect(getDriver("rust")).toBeUndefined();
  });

  // This is the actual regression test for the bug class this whole
  // registry exists to prevent: TypeScript's rollout shipped generate()
  // without generateOperationSequence(), undetected by lint/tests/review,
  // and was only caught by manually running validateProblemContracts.js.
  // This test proves the same gap now fails at import time instead.
  it("throws at import time if a registered language's driver module is missing generateOperationSequence()", async () => {
    vi.resetModules();
    vi.doMock("./typescript.js", async (importOriginal) => {
      const actual = await importOriginal();
      return { ...actual, generateOperationSequence: undefined };
    });

    await expect(import("./index.js")).rejects.toThrow(
      /language "typescript" driver is missing generateOperationSequence/
    );
  });

  it("throws at import time if a registered language's driver module is missing generate()", async () => {
    vi.resetModules();
    vi.doMock("./typescript.js", async (importOriginal) => {
      const actual = await importOriginal();
      return { ...actual, generate: undefined };
    });

    await expect(import("./index.js")).rejects.toThrow(
      /language "typescript" driver is missing generate/
    );
  });

  // Simulates registering a 6th language in backend/config/languages.js
  // without yet creating its languageDrivers/<key>.js module — the very
  // first step of docs/adding-a-language.md's step 2. Should fail loudly
  // and immediately, not silently fall through to "Unsupported language"
  // at request time for the first real user hitting Run/Submit.
  it("throws at import time if LANGUAGES registers a language with no matching driver module at all", async () => {
    vi.resetModules();
    vi.doMock("../../config/languages.js", async (importOriginal) => {
      const actual = await importOriginal();
      return {
        ...actual,
        LANGUAGES: {
          ...actual.LANGUAGES,
          rust: { name: "Rust", judge0Id: 999, extension: "rs", editorIndentSize: 4, enabled: false },
        },
      };
    });

    await expect(import("./index.js")).rejects.toThrow(
      /no driver module registered for language "rust"/
    );
  });
});