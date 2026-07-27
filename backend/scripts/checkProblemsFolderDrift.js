/**
 * checkProblemsFolderDrift.js
 *
 * Addresses audit finding P1-6: two independent paths seed problems into
 * MongoDB — src/data/problems.js (via seedProblems.js, and what the
 * deployed frontend bundles directly) and backend/problems/<slug>/* (via
 * importProblems.js, editable by hand). Nothing previously checked that
 * they agreed. This script regenerates what backend/problems/* SHOULD
 * contain from src/data/problems.js (using the same buildProblemFiles()
 * mapping exportProblemsToFolders.js uses) and diffs it against what's
 * actually checked in, failing loudly on any mismatch.
 *
 * This treats src/data/problems.js as the single source of truth. If a
 * legitimate hand-edit was made under backend/problems/*, the fix is to run
 * `npm run problems:export-to-folders` (which regenerates from
 * src/data/problems.js) — NOT to hand-edit the folder and expect it to
 * stick, and NOT to hand-edit src/data/problems.js to match a folder that
 * was itself hand-edited out of sync. If the two genuinely need to diverge,
 * that's a bigger architectural decision than this script should make
 * silently — see audit report §5, root cause 5.
 *
 * Usage:
 *   node backend/scripts/checkProblemsFolderDrift.js
 *
 * Exit code 0 = backend/problems/* matches src/data/problems.js exactly.
 * Exit code 1 = at least one file differs or is missing (details on stderr).
 */
import fs from "fs/promises";
import path from "path";
import problems from "../../src/data/problems.js";
import { buildProblemFiles } from "./lib/problemFolderFiles.js";

const PROBLEMS_DIR = path.join(process.cwd(), "problems");

async function readIfExists(filePath) {
  try {
    return await fs.readFile(filePath, "utf-8");
  } catch (err) {
    if (err.code === "ENOENT") return null;
    throw err;
  }
}

export async function findDrift(problemList, problemsDir) {
  const issues = [];

  for (const problem of problemList) {
    const folderPath = path.join(problemsDir, problem.slug);
    const expectedFiles = buildProblemFiles(problem);

    for (const [relativePath, expectedContent] of Object.entries(expectedFiles)) {
      const actualPath = path.join(folderPath, relativePath);
      const actualContent = await readIfExists(actualPath);

      if (actualContent === null) {
        issues.push(
          `${problem.slug}/${relativePath}: missing on disk (expected it to exist, generated from src/data/problems.js)`
        );
      } else if (actualContent !== expectedContent) {
        issues.push(
          `${problem.slug}/${relativePath}: content differs from what src/data/problems.js would generate`
        );
      }
    }
  }

  return issues;
}

// Only run as a CLI script, not when imported by tests.
if (import.meta.url === `file://${process.argv[1]}`) {
  const issues = await findDrift(problems, PROBLEMS_DIR);

  if (issues.length) {
    console.error(
      `Found ${issues.length} drift issue(s) between src/data/problems.js and backend/problems/*:`
    );
    issues.forEach((issue) => console.error(`  - ${issue}`));
    console.error(
      "\nRun `npm run problems:export-to-folders` from backend/ to regenerate backend/problems/* from src/data/problems.js, then commit the result."
    );
    process.exit(1);
  }

  console.log(
    `backend/problems/* matches src/data/problems.js for all ${problems.length} problems — no drift.`
  );
  process.exit(0);
}
