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
    let updated  = 0;

    for (const problem of problems) {
      const existing = await Problem.findOne({ slug: problem.slug }).lean();

      await Problem.findOneAndUpdate(
        { slug: problem.slug },
        { $set: problem },
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

    const total = await Problem.countDocuments();


    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:");
    console.error(error);
    process.exit(1);
  }
};

seedProblems();
