/**
 * regenerateTypescriptStarters.js
 *
 * Root-cause fix for the untyped-TypeScript-starter bug: replaces every
 * problem's `starterCode.typescript` in src/data/problems.js (currently a
 * byte-identical, untyped copy of `starterCode.javascript` — see
 * backfillTypescriptStarter.js's own header) with a properly-typed
 * starter built by buildTypescriptStarter() (see
 * ./lib/typescriptStarterGenerator.js), which derives types from each
 * problem's existing `starterCode.java` signature and uses an explicit
 * `throw new Error("Not implemented")` body instead of an empty one.
 *
 * Text-transform safety approach mirrors backfillTypescriptStarter.js:
 * capture every `typescript: `...`,` template-literal boundary via a
 * format-agnostic regex, verify the match count equals the number of
 * problems that actually have a starterCode.typescript entry (via the
 * ALREADY-IMPORTED module, not just the regex) before writing anything,
 * and replace occurrences strictly in file order — which is also
 * `problems` array order, since the file is one array literal.
 *
 * Usage:
 *   node backend/scripts/regenerateTypescriptStarters.js [--dry-run]
 *
 * After running:
 *   node backend/scripts/exportProblemsToFolders.js   (regenerate backend/problems/*)
 *   node backend/scripts/checkProblemsFolderDrift.js  (verify no drift)
 */
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import problems from "../../src/data/problems.js";
import { buildTypescriptStarter } from "./lib/typescriptStarterGenerator.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROBLEMS_JS_PATH = path.join(__dirname, "..", "..", "src", "data", "problems.js");

// Same boundary this file's occurrences were originally inserted at by
// backfillTypescriptStarter.js — captures the typescript starter's
// template-literal body, format-agnostic across whatever
// whitespace/newline separates it from the following `java:` key.
const TS_TO_JAVA_RE = /typescript: (`(?:[^`\\]|\\.)*`),(\s*)java:/g;

function escapeForTemplateLiteral(code) {
  return code
    .replace(/\\/g, "\\\\")
    .replace(/`/g, "\\`")
    .replace(/\n/g, "\\n");
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");

  const expectedCount = problems.filter((p) => p.starterCode?.typescript).length;
  const raw = await fs.readFile(PROBLEMS_JS_PATH, "utf8");
  const matches = [...raw.matchAll(TS_TO_JAVA_RE)];

  if (matches.length !== expectedCount) {
    console.error(
      `Aborting: found ${matches.length} "typescript: ... java:" boundaries via regex, but ` +
        `${expectedCount} problems have starterCode.typescript per the imported module. These ` +
        `must match exactly before any text transform — the file's formatting may have drifted ` +
        `from what this script assumes. Not writing anything.`
    );
    process.exit(1);
  }

  // Problems with no starterCode.typescript are skipped entirely (nothing
  // to regenerate for them), so the sequence of regex matches lines up
  // 1:1, in order, with the sequence of problems that DO have one.
  const problemsWithTs = problems.filter((p) => p.starterCode?.typescript);

  let i = 0;
  let unrecognizedCount = 0;
  const unrecognizedSlugs = [];

  const updated = raw.replace(TS_TO_JAVA_RE, (fullMatch, _literal, sep) => {
    const problem = problemsWithTs[i];
    i++;

    const newStarter = buildTypescriptStarter(problem);
    if (newStarter === null) {
      // Unrecognized starter shape (see buildTypescriptStarter's own
      // comment) — leave this one exactly as it was rather than guess.
      unrecognizedCount++;
      unrecognizedSlugs.push(problem?.slug ?? `<index ${i - 1}>`);
      return fullMatch;
    }

    const literal = `\`${escapeForTemplateLiteral(newStarter)}\``;
    return `typescript: ${literal},${sep}java:`;
  });

  console.log(`Matched ${matches.length} problems; regenerated ${matches.length - unrecognizedCount}.`);
  if (unrecognizedCount > 0) {
    console.log(
      `Left ${unrecognizedCount} unrecognized starter(s) untouched: ${unrecognizedSlugs.join(", ")}`
    );
  }

  if (dryRun) {
    console.log("--dry-run: not writing. Re-run without --dry-run to apply.");
    return;
  }

  await fs.writeFile(PROBLEMS_JS_PATH, updated, "utf8");
  console.log(`Wrote ${PROBLEMS_JS_PATH}.`);
  console.log(
    "Next: node backend/scripts/exportProblemsToFolders.js (regenerate backend/problems/*), " +
      "then node backend/scripts/checkProblemsFolderDrift.js to verify."
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
