/**
 * seedCodeClubEdition.js
 *
 * Seeds the Code Club Edition content library
 * (src/data/code-club-edition/index.js) into MongoDB — kept as its own
 * script, separate from seedProblems.js, so this collection can be
 * expanded and re-deployed independently of the standard interview
 * catalog. Same upsert-by-slug pattern as seedProblems.js, safe to re-run.
 *
 * Usage:
 *   cd backend
 *   node scripts/seedCodeClubEdition.js
 */

import "../config/env.js";
import connectDB from "../config/db.js";
import Problem from "../models/Problem.js";
import missions from "../../src/data/code-club-edition/index.js";

const seedCodeClubEdition = async () => {
  try {
    await connectDB();

    let inserted = 0;
    let updated = 0;

    for (const mission of missions) {
      const existing = await Problem.findOne({ slug: mission.slug }).lean();

      await Problem.findOneAndUpdate(
        { slug: mission.slug },
        { $set: mission },
        { upsert: true, new: true }
      );

      if (!existing) {
        inserted++;
        console.log(`  + [${mission.campaignCode}] ${mission.title}`);
      } else {
        updated++;
        console.log(`  ~ [${mission.campaignCode}] ${mission.title} (updated)`);
      }
    }

    console.log(`\nCode Club Edition seed complete: ${inserted} inserted, ${updated} updated, ${missions.length} total missions.`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Code Club Edition seeding failed:");
    console.error(error);
    process.exit(1);
  }
};

seedCodeClubEdition();