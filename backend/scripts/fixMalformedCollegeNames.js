/**
 * fixMalformedCollegeNames.js
 *
 * One-off cleanup for the "unnecessary box" bug: College records whose
 * `name` field is literally an email address — the College console card
 * that renders as e.g. "nerella.varaprasad131220@marwadiuniversity.ac.in"
 * instead of an institution name. This predates the email-shaped-name
 * guard added to routes/tpo.js and routes/collegeVerification.js (and to
 * the new admin rename endpoint, collegeController.js's renameCollege) —
 * this script is for cleaning up records that slipped through BEFORE that
 * guard existed. It is not needed going forward for new submissions.
 *
 * For each match, replaces `name` with a best-effort guess derived from
 * the record's own `domains[0]` (same heuristic
 * services/collegeAutoProvision.js uses for brand-new signups — see
 * utils/collegeNameHeuristics.js). This is still just a guess: review the
 * dry-run output and rename anything wrong via the admin Colleges
 * console afterward.
 *
 * Usage:
 *   cd backend
 *   node scripts/fixMalformedCollegeNames.js --dry-run   # preview only
 *   node scripts/fixMalformedCollegeNames.js              # apply
 */

import "../config/env.js";
import connectDB from "../config/db.js";
import mongoose from "mongoose";
import College from "../models/College.js";
import { looksLikeEmailAddress, deriveCollegeNameFromDomain } from "../utils/collegeNameHeuristics.js";

const DRY_RUN = process.argv.includes("--dry-run");

async function run() {
  if (DRY_RUN) console.log("🔍 DRY RUN — no writes will occur\n");

  await connectDB();

  const colleges = await College.find({});
  const malformed = colleges.filter((c) => looksLikeEmailAddress(c.name));

  console.log(`Found ${malformed.length} college(s) with an email-shaped name.\n`);

  for (const college of malformed) {
    const newName = deriveCollegeNameFromDomain(college.domains?.[0]);
    console.log(
      `  ${DRY_RUN ? "[dry-run] " : ""}${college._id}: "${college.name}" → "${newName}" (domain: ${college.domains?.[0]})`
    );
    if (!DRY_RUN) {
      college.name = newName;
      await college.save();
    }
  }

  console.log(
    `\n${DRY_RUN ? "Dry run complete — re-run without --dry-run to apply." : "Done."} Review the results in the admin Colleges console and rename any still-wrong guesses.`
  );

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error("fixMalformedCollegeNames failed:", err);
  process.exit(1);
});
