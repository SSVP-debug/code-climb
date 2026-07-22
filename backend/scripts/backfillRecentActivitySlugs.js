// One-time backfill for plans/02-fix-recent-activity-schema.md.
//
// Historical `recentActivity` entries written before that fix only ever
// stored `{ title, time }` — `slug` and `difficulty` were silently dropped
// by Mongoose because the sub-schema didn't declare them. This script fills
// in `slug`/`difficulty` on existing entries by matching `title` against the
// Problem catalog, wherever that match is unambiguous.
//
// Safe to re-run: an entry that already has both `slug` and `difficulty`
// populated is left untouched, not re-written.
//
// Usage:
//   node scripts/backfillRecentActivitySlugs.js --dry-run   (default — logs only, writes nothing)
//   node scripts/backfillRecentActivitySlugs.js --execute   (writes changes)
//
// Per plans/02-fix-recent-activity-schema.md, this script's existence and a
// dry-run are the deliverable — it is not run against any real database as
// part of that plan. Whoever owns the data decides when/whether to run
// --execute, after reviewing the dry-run output below.

import "../config/env.js";
import connectDB from "../config/db.js";
import mongoose from "mongoose";
import User from "../models/User.js";
import Problem from "../models/Problem.js";

const EXECUTE = process.argv.includes("--execute");

async function main() {
  await connectDB();

  // Build a title -> [problems] index once, up front, rather than querying
  // per-entry — the catalog is small (currently ~50-250 problems) and this
  // keeps the script from making one query per recentActivity entry.
  const allProblems = await Problem.find({})
    .select("title slug difficulty")
    .lean();

  const byTitle = new Map();
  for (const p of allProblems) {
    if (!byTitle.has(p.title)) byTitle.set(p.title, []);
    byTitle.get(p.title).push(p);
  }

  const usersWithGaps = await User.find({
    $or: [
      { "recentActivity.slug": { $exists: false } },
      { "recentActivity.difficulty": { $exists: false } },
    ],
  }).select("_id username recentActivity");

  console.log(`Found ${usersWithGaps.length} user(s) with at least one incomplete recentActivity entry.`);

  let usersChanged = 0;
  let entriesFilled = 0;
  let entriesSkippedAmbiguous = 0;
  let entriesSkippedNoMatch = 0;
  let entriesAlreadyComplete = 0;

  for (const user of usersWithGaps) {
    let changedThisUser = false;

    const nextActivity = user.recentActivity.map((entry) => {
      if (entry.slug && entry.difficulty) {
        entriesAlreadyComplete += 1;
        return entry;
      }

      const matches = byTitle.get(entry.title) || [];

      if (matches.length === 0) {
        entriesSkippedNoMatch += 1;
        console.warn(
          `  [skip: no match] user=${user.username || user._id} title="${entry.title}" — no Problem with this exact title.`
        );
        return entry;
      }

      if (matches.length > 1) {
        entriesSkippedAmbiguous += 1;
        console.warn(
          `  [skip: ambiguous] user=${user.username || user._id} title="${entry.title}" — ${matches.length} problems share this title, refusing to guess.`
        );
        return entry;
      }

      const [problem] = matches;
      entriesFilled += 1;
      changedThisUser = true;
      return {
        ...entry.toObject?.() ?? entry,
        slug: problem.slug,
        difficulty: problem.difficulty,
      };
    });

    if (changedThisUser) {
      usersChanged += 1;
      if (EXECUTE) {
        user.recentActivity = nextActivity;
        await user.save();
      }
    }
  }

  console.log("\n--- Summary ---");
  console.log(`Mode:                        ${EXECUTE ? "EXECUTE (writes applied)" : "DRY RUN (no writes made)"}`);
  console.log(`Users scanned:               ${usersWithGaps.length}`);
  console.log(`Users with a fillable entry: ${usersChanged}`);
  console.log(`Entries filled:              ${entriesFilled}`);
  console.log(`Entries already complete:    ${entriesAlreadyComplete}`);
  console.log(`Entries skipped (no match):  ${entriesSkippedNoMatch}`);
  console.log(`Entries skipped (ambiguous): ${entriesSkippedAmbiguous}`);

  if (!EXECUTE && entriesFilled > 0) {
    console.log("\nThis was a dry run. Re-run with --execute to apply these changes.");
  }
}

main()
  .then(() => mongoose.disconnect())
  .catch((err) => {
    console.error("Backfill script failed:", err);
    return mongoose.disconnect().finally(() => process.exit(1));
  });