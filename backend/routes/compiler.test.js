import { describe, expect, it } from "vitest";
import { runCodeSchema } from "./compiler.js";
import { ENABLED_LANGUAGE_IDS, SUPPORTED_LANGUAGE_IDS } from "../config/languages.js";

/**
 * Judge0 Integration Hardening, items 1-2.
 *
 * Previously `language_id` was validated only as `z.number().int().positive()`
 * — any positive integer was accepted and forwarded to Judge0 as-is, so an
 * authenticated client could request a Judge0 language Code Club never
 * intended to expose. Restricted to the allow-list in config/languages.js.
 *
 * Tests the real `runCodeSchema` directly via `.safeParse()` — same pattern
 * as routes/judge.contract.test.js's runSchema/submitSchema — since this
 * backend doesn't use supertest for full HTTP-layer route tests.
 */
describe("routes/compiler.js — runCodeSchema language_id allow-list", () => {
  const validBody = (overrides = {}) => ({
    source_code: "print(1)",
    language_id: 71,
    ...overrides,
  });

  // Gated on ENABLED_LANGUAGE_IDS, not SUPPORTED_LANGUAGE_IDS — see
  // compiler.js's own comment on this. Phase 6 (Language Expansion, plan
  // 010) is the first time these two lists actually diverge (typescript
  // is registered/supported but ships `enabled: false`), which is exactly
  // why this test asserts against ENABLED_LANGUAGE_IDS specifically now
  // rather than the (pre-Phase-6-equivalent) SUPPORTED_LANGUAGE_IDS.
  it.each(ENABLED_LANGUAGE_IDS)("accepts enabled language_id %i", (id) => {
    const result = runCodeSchema.safeParse(validBody({ language_id: id }));
    expect(result.success).toBe(true);
  });

  it("rejects any supported-but-currently-disabled language_id, if one exists (plan 010's ENABLED-vs-SUPPORTED split)", () => {
    // Was hardcoded to "typescript, 74" specifically — broke the moment
    // TypeScript's own `enabled` flipped to `true` (confirmed against
    // the real Judge0 instance via verifyLanguageRegistry.js, see plan
    // 010). Computed from the live registry instead, so this test keeps
    // proving the ENABLED-vs-SUPPORTED distinction is enforced whenever
    // it's actually relevant again (the next language shipped disabled),
    // rather than asserting a fact about one specific language that was
    // always going to become false.
    const disabledIds = SUPPORTED_LANGUAGE_IDS.filter((id) => !ENABLED_LANGUAGE_IDS.includes(id));

    if (disabledIds.length === 0) {
      // Nothing currently disabled-but-supported — SUPPORTED and ENABLED
      // are the same set right now (true again as of TypeScript's
      // enable). Not a gap: the "unsupported entirely" case right below
      // still proves the allow-list itself works; this specific
      // disabled-vs-supported distinction just has nothing live to
      // assert against until a future language ships disabled.
      return;
    }

    const result = runCodeSchema.safeParse(validBody({ language_id: disabledIds[0] }));
    expect(result.success).toBe(false);
    expect(result.error.issues[0].message).toMatch(/supported languages/i);
  });

  it("rejects an unsupported (but structurally valid) Judge0 language_id, e.g. Bash (46)", () => {
    const result = runCodeSchema.safeParse(validBody({ language_id: 46 }));

    expect(result.success).toBe(false);
    expect(result.error.issues[0].path).toEqual(["language_id"]);
    expect(result.error.issues[0].message).toMatch(/supported languages/i);
  });

  it("rejects language_id 0", () => {
    const result = runCodeSchema.safeParse(validBody({ language_id: 0 }));
    expect(result.success).toBe(false);
  });

  it("rejects a negative language_id", () => {
    const result = runCodeSchema.safeParse(validBody({ language_id: -71 }));
    expect(result.success).toBe(false);
  });

  it("rejects a decimal language_id", () => {
    const result = runCodeSchema.safeParse(validBody({ language_id: 71.5 }));
    expect(result.success).toBe(false);
  });

  it("rejects a string language_id", () => {
    const result = runCodeSchema.safeParse(validBody({ language_id: "71" }));
    expect(result.success).toBe(false);
  });

  it("rejects a missing language_id", () => {
    const { language_id: _omit, ...body } = validBody();
    const result = runCodeSchema.safeParse(body);

    expect(result.success).toBe(false);
    expect(result.error.issues[0].path).toEqual(["language_id"]);
  });

  it("rejection happens at schema validation — before any request would reach Judge0 (no network call is possible from a synchronous safeParse)", () => {
    // safeParse is synchronous and does no I/O — this is a structural
    // guarantee, not just an assertion, but it's asserted explicitly here
    // so the intent is documented alongside the other tests in this file.
    const result = runCodeSchema.safeParse(validBody({ language_id: 999 }));
    expect(result.success).toBe(false);
  });
});