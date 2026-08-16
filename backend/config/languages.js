/**
 * Single source of truth for the Judge0 language IDs Code Club supports.
 *
 * Judge0 Integration Hardening: `routes/compiler.js` previously validated
 * `language_id` as any positive integer, so an authenticated client could
 * submit a Judge0 language ID Code Club never intended to expose (e.g. 46
 * for Bash) and have it forwarded to Judge0 as-is. `compilerController.js`
 * and `judgeController.js` each separately hardcoded the same 4 IDs in
 * their own local maps, so there was no one place to update if the
 * supported set ever changes.
 *
 * This module is that one place. `compilerController.js`'s
 * `JUDGE0_LANGUAGE_NAMES` / `LANGUAGE_STRINGS` now import from here instead
 * of redeclaring the same 4 entries. `judgeController.js`'s `languageIdMap`
 * (submission/judging path) is deliberately left untouched — it's keyed by
 * language name rather than validating arbitrary client-provided IDs, so it
 * was never exposed to this issue, and the task explicitly scopes out
 * touching it without a concrete reason.
 */

// Judge0 language ID → display name.
export const SUPPORTED_LANGUAGES = {
  54: "C++",
  62: "Java",
  63: "JavaScript",
  71: "Python",
};

// Judge0 language ID → internal language string (used by generateDriverCode
// and generateOperationSequenceDriver to pick the right code-generation path).
export const LANGUAGE_ID_TO_STRING = {
  54: "cpp",
  62: "java",
  63: "javascript",
  71: "python",
};

// The allow-list itself, derived from the map above rather than duplicated
// as a separate literal — one edit (add/remove a key in SUPPORTED_LANGUAGES)
// keeps everything in sync.
export const SUPPORTED_LANGUAGE_IDS = Object.keys(SUPPORTED_LANGUAGES).map(Number);

export function isSupportedLanguageId(languageId) {
  return SUPPORTED_LANGUAGE_IDS.includes(languageId);
}
