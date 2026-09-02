/**
 * Single source of truth for language identity across Code Club's backend
 * — Judge0 IDs, internal language strings, file extensions, and which
 * languages are currently enabled for new Run/Submit requests.
 *
 * Content & Execution Architecture, Phase 2. This module supersedes the
 * original "Judge0 Integration Hardening" registry documented below by
 * folding in ENABLED state (previously implicit — every language was
 * always on) and consolidating what used to be several independent
 * hand-maintained lists into one:
 *   - compilerController.js's JUDGE0_LANGUAGE_NAMES / LANGUAGE_STRINGS
 *     (already derived from this file before this phase — unchanged)
 *   - judgeController.js's own separate `languageIdMap` literal (now
 *     replaced with LANGUAGE_KEY_TO_ID from here — see that file)
 *   - routes/judge.js's two hand-written `z.enum([...])` literals (now
 *     ENABLED_LANGUAGE_KEYS)
 *   - routes/compiler.js's SUPPORTED_LANGUAGE_IDS check (now additionally
 *     gates on ENABLED_LANGUAGE_IDS)
 *   - the frontend's hardcoded <select> in ProblemEditor.jsx (now fetches
 *     GET /api/languages, backed by getEnabledLanguagesForApi() below)
 *
 * ── IMPORTANT: "supported" vs. "enabled" are not the same thing ──────────
 * A language appearing in LANGUAGES below means Code Club has real
 * implementation for it — generateDriverCode.js / languageTypes/*.js know
 * how to build a driver for it, and it has a Judge0 ID. That is what
 * "supported" means throughout this codebase, and it is NOT something a
 * config flag can create by itself: making a genuinely new language work
 * still requires writing that driver-generation code (see the module
 * comment at the top of ../utils/generateDriverCode.js).
 *
 * `enabled` is the separate, narrower thing this phase adds: a runtime-ish
 * (config-deploy-level, not database-level — see the audit's §F for why)
 * on/off switch for an *already-supported* language. Flipping it to
 * `false` immediately removes that language from GET /api/languages and
 * causes new Run/Submit requests using it to be rejected — see
 * ENABLED_LANGUAGE_KEYS / ENABLED_LANGUAGE_IDS below and their call sites
 * in routes/judge.js and routes/compiler.js. It does NOT remove the
 * language's driver-generation code, and it does NOT touch historical
 * Submission documents already stored with that language (see
 * models/Submission.js's own comment on why its enum is intentionally
 * NOT filtered to only-enabled languages).
 *
 * ── Original "Judge0 Integration Hardening" context (kept for history) ───
 * `routes/compiler.js` previously validated `language_id` as any positive
 * integer, so an authenticated client could submit a Judge0 language Code
 * Club never intended to expose (e.g. 46 for Bash) and have it forwarded
 * to Judge0 as-is. `compilerController.js` and `judgeController.js` each
 * separately hardcoded the same 4 IDs in their own local maps, so there
 * was no one place to update if the supported set ever changed. This
 * module was created to be that one place, and Phase 2 above finished the
 * job by removing the one map (`judgeController.js`'s `languageIdMap`)
 * that a prior, narrower-scoped task had deliberately left untouched.
 *
 * ── Adding a genuinely new language (e.g. Rust) — where everything lives ─
 *   1. Register it below in LANGUAGES (its Judge0 ID, display name, file
 *      extension). Start it with `enabled: false` until steps 2-3 are done.
 *   2. Implement driver generation for it in ../utils/generateDriverCode.js
 *      (and ../utils/languageTypes/ if it needs its own type-declaration
 *      logic the way java/cpp do).
 *   3. Implement Problem.starterCode support for it — see
 *      models/Problem.js's `starterCode` sub-schema; it's currently 4
 *      fixed named fields, not a map, so adding a language there is a
 *      small schema change, not a config change (see the audit's §F).
 *   4. Flip `enabled: true` here. It now appears in GET /api/languages
 *      and becomes usable for new Run/Submit requests — no other file in
 *      the backend needs to change for that last step.
 * Steps 1-3 are genuine implementation work no registry can eliminate;
 * step 4 is the "flip a switch" step this phase was actually asked for.
 */

// ── The registry ────────────────────────────────────────────────────────
// Order here is preserved by every derived list/message below (e.g. the
// "language must be: python, javascript, java, or cpp" validation
// message) — insertion order in a plain object is preserved by
// Object.keys/values/entries in modern JS, so reordering these entries
// reorders that message too. Kept in the same order as the four languages
// have always been listed throughout the codebase.
export const LANGUAGES = {
  python: {
    name: "Python",
    judge0Id: 71,
    extension: "py",
    // Content & Execution Architecture cross-check follow-up (Phase 6):
    // this exists specifically to replace a hardcoded
    // `language === "javascript" ? 2 : 4` conditional found in
    // src/components/problem/ProblemEditor.jsx — TypeScript conventionally
    // indents like JavaScript (2), not like Java/C++ (4), and that
    // conditional had no way to express that without becoming a growing
    // per-language if/else chain in a frontend file no language addition
    // should need to touch. This is exactly the `configuration` field the
    // original Content & Execution Architecture spec's `Language` shape
    // proposed — added narrowly (just this one property) rather than a
    // generic catch-all bag, per that same spec's explicit
    // "do not blindly implement this schema" / avoid-over-engineering
    // instruction.
    editorIndentSize: 4,
    enabled: true,
  },
  javascript: {
    name: "JavaScript",
    judge0Id: 63,
    extension: "js",
    editorIndentSize: 2,
    enabled: true,
  },
  java: {
    name: "Java",
    judge0Id: 62,
    extension: "java",
    editorIndentSize: 4,
    enabled: true,
  },
  cpp: {
    name: "C++",
    judge0Id: 54,
    extension: "cpp",
    editorIndentSize: 4,
    enabled: true,
  },
  // Phase 6 (Language Expansion) — see plans/010-language-expansion-scoping.md
  // for why TypeScript went first (structural superset of JS → driver-gen
  // reuses formatJsArg/the JS call-and-print pattern almost entirely, and
  // the 250-problem starter-code backfill is mechanical rather than
  // hand-authored — see scripts/backfillTypescriptStarter.js). Starts
  // disabled until that backfill + a real run against this deployment's
  // Judge0 instance both happen — see the note on judge0Id below.
  typescript: {
    name: "TypeScript",
    // Judge0 CE's well-known id for "TypeScript (3.7.4)". Not yet
    // confirmed against this project's actual self-hosted Judge0
    // instance/version — confirm before flipping `enabled: true` (see
    // docs/judge0-setup.md's instance-specific language list, if one
    // gets added there, or query the instance's /languages endpoint).
    judge0Id: 74,
    extension: "ts",
    editorIndentSize: 2,
    enabled: false,
  },
};

// ── Derived exports — ALL registered languages (supported, regardless of
// enabled state) ──────────────────────────────────────────────────────────

// Judge0 language ID → display name. Same shape/name as before this phase
// (compilerController.js's JUDGE0_LANGUAGE_NAMES aliases this) —
// deliberately includes every registered language, not just enabled ones,
// since this is used for display/logging of results for submissions that
// may have been made while a language was still enabled.
export const SUPPORTED_LANGUAGES = Object.fromEntries(
  Object.values(LANGUAGES).map((lang) => [lang.judge0Id, lang.name])
);

// Judge0 language ID → internal language string (used by
// generateDriverCode/generateOperationSequenceDriver to pick the right
// code-generation path).
export const LANGUAGE_ID_TO_STRING = Object.fromEntries(
  Object.entries(LANGUAGES).map(([key, lang]) => [lang.judge0Id, key])
);

// Internal language string → Judge0 language ID. Replaces
// judgeController.js's own previously-separate `languageIdMap` literal —
// same values, single source now.
export const LANGUAGE_KEY_TO_ID = Object.fromEntries(
  Object.entries(LANGUAGES).map(([key, lang]) => [key, lang.judge0Id])
);

// The full allow-list of registered Judge0 IDs — unrelated to `enabled`.
// Used where "is this a Judge0 ID Code Club has ever heard of" is the
// actual question (e.g. interpreting/labeling a historical result), as
// opposed to "can a NEW request use this" (see ENABLED_LANGUAGE_IDS).
export const SUPPORTED_LANGUAGE_IDS = Object.values(LANGUAGES).map((lang) => lang.judge0Id);

export function isSupportedLanguageId(languageId) {
  return SUPPORTED_LANGUAGE_IDS.includes(languageId);
}

// All registered internal language keys, regardless of enabled state.
// Used by models/Submission.js's `language` enum specifically BECAUSE it
// must stay valid for historical documents even if a language is later
// disabled — see that file's own comment.
export const SUPPORTED_LANGUAGE_KEYS = Object.keys(LANGUAGES);

// ── Derived exports — ENABLED languages only (Phase 2) ───────────────────
// These are the ones that gate new Run/Submit requests and populate
// GET /api/languages. A disabled language stays in every export above
// (it's still "supported"/registered) but disappears from all of these.

export const ENABLED_LANGUAGE_KEYS = Object.entries(LANGUAGES)
  .filter(([, lang]) => lang.enabled)
  .map(([key]) => key);

export const ENABLED_LANGUAGE_IDS = Object.values(LANGUAGES)
  .filter((lang) => lang.enabled)
  .map((lang) => lang.judge0Id);

export function isEnabledLanguageKey(languageKey) {
  return Boolean(LANGUAGES[languageKey]?.enabled);
}

export function isEnabledLanguageId(languageId) {
  return ENABLED_LANGUAGE_IDS.includes(languageId);
}

// Shape consumed by GET /api/languages (see controllers/languageController.js)
// and, on the frontend, by useLanguages.js / ProblemEditor.jsx's language
// selector — a plain list an admin toggling `enabled` above (and
// redeploying) will see reflected here with no other change required.
export function getEnabledLanguagesForApi() {
  return Object.entries(LANGUAGES)
    .filter(([, lang]) => lang.enabled)
    .map(([key, lang]) => ({
      id: key,
      name: lang.name,
      extension: lang.extension,
      editorIndentSize: lang.editorIndentSize,
    }));
}

// Oxford-comma-joined list of currently enabled language keys, e.g.
// "python, javascript, java, or cpp" — used to build a human-readable
// Zod validation message in routes/judge.js without hand-maintaining that
// sentence as a separate literal (previously it was one, and had already
// drifted out of sync with the actual allow-list once before).
export function formatEnabledLanguageKeysMessage() {
  const keys = ENABLED_LANGUAGE_KEYS;
  if (keys.length === 0) return "no languages are currently enabled";
  if (keys.length === 1) return keys[0];
  if (keys.length === 2) return `${keys[0]} or ${keys[1]}`;
  return `${keys.slice(0, -1).join(", ")}, or ${keys[keys.length - 1]}`;
}