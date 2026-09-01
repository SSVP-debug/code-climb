/**
 * verifyLanguageRegistry.js
 *
 * Phase 6 (Language Expansion, plan 010) follow-up. Queries the ACTUAL
 * configured Judge0 instance's `/languages` endpoint and cross-checks
 * every entry in config/languages.js's `LANGUAGES` registry against it —
 * both `judge0Id` correctness (does that ID exist on this instance, and
 * does its name roughly match what we call it) and, as a bonus, flags
 * any Judge0 language your instance supports that isn't registered here
 * at all (useful context when picking the *next* language to add, not
 * just for verifying this one).
 *
 * Why this exists: languages.js's own header documents "flip
 * `enabled: true`" as the last, trivial step of adding a language — but
 * that's only safe once the `judge0Id` is actually confirmed correct for
 * YOUR deployment. TypeScript's `judge0Id: 74` is Judge0 CE's well-known
 * public value; this project's actual Judge0 instance (self-hosted or
 * RapidAPI, per JUDGE0_API_URL — see docs/judge0-setup.md) was never
 * confirmed to agree. Run this any time a language is added, or
 * periodically, rather than trusting a hardcoded ID from memory/docs.
 *
 * Reuses the exact same URL-derivation and auth-header logic as
 * controllers/compilerController.js's fetchJudge0() (JUDGE0_API_URL /
 * JUDGE0_RAPIDAPI_KEY / JUDGE0_API_KEY) — deliberately, so "does this
 * script reach the same instance production actually uses" is true by
 * construction, not by two independently-maintained copies of the same
 * env-var logic drifting apart.
 *
 * Usage:
 *   cd backend
 *   node scripts/verifyLanguageRegistry.js
 *
 * Requires network access to your configured Judge0 instance — this is
 * NOT runnable from a sandboxed environment with restricted egress (the
 * same reason this couldn't be run during the session that wrote it).
 */
import "../config/env.js";
import { LANGUAGES } from "../config/languages.js";

function buildJudge0LanguagesUrl() {
  const rawUrl = process.env.JUDGE0_API_URL || "https://ce.judge0.com/submissions?wait=true";
  const url = new URL(rawUrl);
  // /submissions?... → /languages?... (same host/auth, different Judge0
  // endpoint) — strip the submissions-specific query params, they don't
  // apply here.
  url.pathname = url.pathname.replace(/\/submissions\/?$/, "/languages");
  url.search = "";
  return url;
}

function buildAuthHeaders(url) {
  const headers = { "Content-Type": "application/json" };
  if (process.env.JUDGE0_RAPIDAPI_KEY) {
    headers["X-RapidAPI-Key"] = process.env.JUDGE0_RAPIDAPI_KEY;
    headers["X-RapidAPI-Host"] = url.hostname;
  }
  if (process.env.JUDGE0_API_KEY) {
    headers["X-Auth-Token"] = process.env.JUDGE0_API_KEY;
  }
  return headers;
}

async function main() {
  const url = buildJudge0LanguagesUrl();
  console.log(`Querying ${url.toString()} ...`);

  let judge0Languages;
  try {
    const res = await fetch(url.toString(), { headers: buildAuthHeaders(url) });
    if (!res.ok) {
      console.error(`Judge0 responded ${res.status} ${res.statusText}. Cannot verify — aborting.`);
      process.exit(1);
    }
    judge0Languages = await res.json();
  } catch (err) {
    console.error(
      `Could not reach ${url.toString()}: ${err.message}\n` +
        "This script needs real network access to your Judge0 instance " +
        "(not available in a sandboxed/restricted-egress environment)."
    );
    process.exit(1);
  }

  if (!Array.isArray(judge0Languages)) {
    console.error("Unexpected response shape from Judge0 /languages — expected an array. Aborting.");
    process.exit(1);
  }

  const byId = new Map(judge0Languages.map((l) => [l.id, l.name]));

  console.log(`\nJudge0 instance reports ${judge0Languages.length} available languages.\n`);
  console.log("── Cross-check against config/languages.js ──────────────────────\n");

  let anyMismatch = false;
  for (const [key, lang] of Object.entries(LANGUAGES)) {
    const actualName = byId.get(lang.judge0Id);
    if (actualName === undefined) {
      anyMismatch = true;
      console.log(
        `✗ ${key.padEnd(12)} judge0Id=${lang.judge0Id} — NOT FOUND on this Judge0 instance. ` +
          `Registry says "${lang.name}"; this ID does not exist here at all.`
      );
    } else if (!actualName.toLowerCase().includes(lang.name.toLowerCase().split(" ")[0])) {
      // Loose containment check, not exact-string equality — Judge0 names
      // include version numbers ("TypeScript (5.0.3)") that will
      // legitimately drift over time without that being a real problem.
      anyMismatch = true;
      console.log(
        `? ${key.padEnd(12)} judge0Id=${lang.judge0Id} — found, but name doesn't obviously match. ` +
          `Registry says "${lang.name}", Judge0 says "${actualName}". Verify by eye before trusting this ID.`
      );
    } else {
      console.log(`✓ ${key.padEnd(12)} judge0Id=${lang.judge0Id} — "${actualName}" (enabled: ${lang.enabled})`);
    }
  }

  console.log(
    anyMismatch
      ? "\nMismatches found above — do NOT flip `enabled: true` on an unresolved ✗/? entry until fixed."
      : "\nEvery registered language's judge0Id checks out against this instance."
  );

  process.exit(anyMismatch ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});