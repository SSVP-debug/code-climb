/**
 * backfillXP.js
 *
 * One-time migration: recalculates totalXP for every user from their
 * solvedSlugs using the canonical problems.js difficulty values.
 *
 * Safe to re-run — result is always deterministic from solvedSlugs.
 *
 * Usage:
 *   cd backend
 *   node scripts/backfillXP.js
 *
 * Add --dry-run to preview changes without writing to MongoDB:
 *   node scripts/backfillXP.js --dry-run
 */

import "../config/env.js";
import connectDB from "../config/db.js";
import mongoose from "mongoose";
import User from "../models/User.js";
import problems from "../../src/data/problems.js";
import { buildDifficultyMap, computeXPFromSlugs } from "../utils/computeXP.js";

const DRY_RUN = process.argv.includes("--dry-run");

async function backfillXP() {
  await connectDB();

  const difficultyMap = buildDifficultyMap(problems);
  console.log(`\n📚 Loaded ${difficultyMap.size} problems from problems.js`);

  if (DRY_RUN) {
    console.log("🔍 DRY RUN — no writes will occur\n");
  }

  const users = await User.find({}, "email displayName solvedSlugs totalXP").lean();
  console.log(`👥 Found ${users.length} user(s) to process\n`);

  let updated = 0;
  let skipped = 0;
  let errors  = 0;

  for (const user of users) {
    const solvedSlugs = user.solvedSlugs || [];
    const currentXP   = user.totalXP ?? 0;
    const correctXP   = computeXPFromSlugs(solvedSlugs, difficultyMap, { warnUnknown: true });

    const label = user.email || user.displayName || String(user._id);

    if (correctXP === currentXP) {
      console.log(`  ✅ ${label}  ${solvedSlugs.length} solves → ${correctXP} XP  (already correct)`);
      skipped++;
      continue;
    }

    console.log(`  🔧 ${label}  ${solvedSlugs.length} solves → ${currentXP} XP (stored) → ${correctXP} XP (correct)`);

    if (!DRY_RUN) {
      try {
        await User.updateOne(
          { _id: user._id },
          { $set: { totalXP: correctXP } }
        );
        updated++;
      } catch (err) {
        console.error(`  ❌ Failed to update ${label}:`, err.message);
        errors++;
      }
    } else {
      updated++; // count as "would update" in dry run
    }
  }

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${DRY_RUN ? "DRY RUN " : ""}Results
  Users processed : ${users.length}
  ${DRY_RUN ? "Would update" : "Updated"}     : ${updated}
  Already correct : ${skipped}
  Errors          : ${errors}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);

  await mongoose.disconnect();
}

backfillXP().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});