/**
 * backfillTypescriptStarter.js
 *
 * Phase 6 (Language Expansion, plan 010) — see
 * plans/010-language-expansion-scoping.md.
 *
 * Mechanically adds a `typescript` key to every problem's `starterCode`
 * object in src/data/problems.js (the catalog's single source of truth —
 * see checkProblemsFolderDrift.js's own header for why that, not
 * backend/problems/*, is authoritative). Value is a byte-identical copy
 * of that problem's existing `javascript` starter: TypeScript is a
 * structural superset of JS, so every existing JS starter is already
 * valid TS under a permissive (non-`--noImplicitAny`) compile, and
 * generateDriverCode.js's `typescript` branch reuses the exact same
 * call-and-print driver shape JS already uses — see that file's own
 * comment on why there's no separate languageTypes/typescript.js.
 *
 * This is a one-time, idempotent text transform of a hand-authored file,
 * not a database backfill like this directory's other backfill*.js
 * scripts — flagged as a genuine judgment call in plan 010's writeup
 * rather than silently treated as the same kind of operation.
 *
 * Safety approach: parse-verify the count of `javascript:` template-
 * literal starters via the ALREADY-IMPORTED module (not just regex)
 * against a regex match count before touching anything. The regex is
 * deliberately format-agnostic — src/data/problems.js actually mixes two
 * formats (a pretty-printed one-field-per-line style, and a compact
 * single-line-per-problem style used by a subset of entries), and an
 * earlier version of this script assumed only the pretty-printed one;
 * its own count-mismatch guard below caught that (205 matches vs. 250
 * expected) before anything was written. The fix matches on the
 * `javascript: `...`,` → `java:` boundary directly, capturing whatever
 * whitespace/newline separates them in each entry and reusing that same
 * separator for the inserted `typescript:` field, rather than assuming
 * one fixed layout.
 *
 * Usage:
 *   node backend/scripts/backfillTypescriptStarter.js [--dry-run]
 *
 * After running, regenerate the derived folder mirror:
 *   node backend/scripts/exportProblemsToFolders.js
 * and re-seed if you have a live MongoDB connection:
 *   node backend/scripts/seedProblems.js
 */
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import problems from "../../src/data/problems.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROBLEMS_JS_PATH = path.join(__dirname, "..", "..", "src", "data", "problems.js");

// Captures the javascript starter's template-literal body and the exact
// whitespace/newline that separates it from the following `java:` key —
// format-agnostic across this file's mixed pretty-printed/compact
// layouts (see header comment).
const JS_TO_JAVA_RE = /javascript: (`(?:[^`\\]|\\.)*`),(\s*)java:/g;

async function main() {
  const dryRun = process.argv.includes("--dry-run");

  const alreadyBackfilled = problems.filter((p) => p.starterCode?.typescript);
  if (alreadyBackfilled.length > 0) {
    console.log(
      `${alreadyBackfilled.length}/${problems.length} problems already have starterCode.typescript. ` +
        `Aborting — re-run against a file with no existing typescript starters, or extend this ` +
        `script to skip already-backfilled entries if a genuine partial re-run is needed.`
    );
    process.exit(1);
  }

  const raw = await fs.readFile(PROBLEMS_JS_PATH, "utf8");

  const matches = [...raw.matchAll(JS_TO_JAVA_RE)];
  const expectedCount = problems.filter((p) => p.starterCode?.javascript).length;

  if (matches.length !== expectedCount) {
    console.error(
      `Aborting: found ${matches.length} "javascript: ... java:" boundaries via regex, but ` +
        `${expectedCount} problems have starterCode.javascript per the imported module. These ` +
        `must match exactly before any text transform — the file's formatting may have drifted ` +
        `from what this script assumes. Not writing anything.`
    );
    process.exit(1);
  }

  const updated = raw.replace(JS_TO_JAVA_RE, (fullMatch, literal, sep) => {
    return `javascript: ${literal},${sep}typescript: ${literal},${sep}java:`;
  });

  const insertedTypescriptCount = (updated.match(/typescript: `/g) || []).length;
  console.log(
    `Matched ${matches.length} problems; inserted ${insertedTypescriptCount} "typescript:" starter entries.`
  );

  if (insertedTypescriptCount !== expectedCount) {
    console.error(
      `Aborting: expected ${expectedCount} inserted typescript: entries, got ${insertedTypescriptCount}. Not writing anything.`
    );
    process.exit(1);
  }

  if (dryRun) {
    console.log("--dry-run: not writing. Re-run without --dry-run to apply.");
    return;
  }

  await fs.writeFile(PROBLEMS_JS_PATH, updated, "utf8");
  console.log(`Wrote ${PROBLEMS_JS_PATH}.`);
  console.log(
    "Next: node backend/scripts/exportProblemsToFolders.js (regenerate backend/problems/*), " +
      "then re-seed if you have a live MongoDB connection."
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});