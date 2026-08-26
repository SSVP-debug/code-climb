/**
 * seedProblems.js
 *
 * Seeds all problems from src/data/problems.js into MongoDB.
 * Uses upsert on slug — safe to re-run without wiping existing data.
 *
 * Usage:
 *   cd backend
 *   node scripts/seedProblems.js
 */

import "../config/env.js";
import connectDB from "../config/db.js";
import Problem from "../models/Problem.js";
import problems from "../../src/data/problems.js";

const seedProblems = async () => {
  try {
    await connectDB();


    let inserted = 0;
    let updated = 0;

    for (const problem of problems) {
      const existing = await Problem.findOne({ slug: problem.slug }).lean();

      // ── Content & Execution Architecture, Phase 3 adapter ────────────────
      // src/data/problems.js still declares a flat `hiddentestcases` array
      // — the content-authoring format itself is explicitly out of scope
      // for this phase (see Phase 5, "problem-content consolidation," not
      // yet started). This is the one point that wraps that flat shape
      // into Problem.js's actual `hiddenTestcaseSet` sub-document before
      // writing; without it, Mongoose's default strict-schema behavior
      // would silently drop the unrecognized `hiddentestcases` key from
      // every future `$set`, and catalog problems' hidden testcases would
      // quietly stop updating from this file entirely.
      //
      // `enabled` is carried forward from whatever's already in Mongo
      // (defaulting to `true` only the first time a problem is seeded) —
      // NOT reset to `true` on every reseed. If an admin has disabled
      // grading for a catalog problem via the admin API, a routine reseed
      // must not silently turn it back on, the same way it already
      // wouldn't silently undo other admin-editable catalog fields.
      const { hiddentestcases, ...problemFields } = problem;
      const problemToSet = {
        ...problemFields,
        hiddenTestcaseSet: {
          enabled: existing?.hiddenTestcaseSet?.enabled ?? true,
          testcases: hiddentestcases ?? [],
        },
      };

      await Problem.findOneAndUpdate(
        { slug: problem.slug },
        { $set: problemToSet },
        { upsert: true, new: true }
      );

      if (!existing) {
        inserted++;
        console.log(`  + [${problem.difficulty.padEnd(6)}] #${String(problem.id).padStart(2, "0")} ${problem.title}`);
      } else {
        updated++;
        console.log(`  ~ [${problem.difficulty.padEnd(6)}] #${String(problem.id).padStart(2, "0")} ${problem.title} (updated)`);
      }
    }
    for (const [index, problem] of problems.entries()) {
      if (!problem) {
        console.log(`Problem at index ${index} is undefined`);
        continue;
      }

      console.log(problem.slug);
    }

    const total = await Problem.countDocuments();


    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:");
    console.error(error);
    process.exit(1);
  }
};

seedProblems();
