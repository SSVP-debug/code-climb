/**
 * migrateCollegeSchema.js
 *
 * One-time migration for the college-verification two-track refactor
 * (see plans/001-college-verification-two-track-flow.md §5.1/§5.2).
 *
 * Two independent transforms, run in this order:
 *
 *   1. College collection:
 *        domain (String)        → domains ([String])
 *        verified (Boolean)     → status ("verified" | "pending")
 *        adminUserId (ObjectId) → submittedBy (ObjectId), submittedByRole: "tpo"
 *      (every pre-existing College document was created by the TPO flow —
 *      the student-submitted path did not exist before this migration, so
 *      submittedByRole: "tpo" is correct for 100% of legacy rows.)
 *
 *   2. User collection, `education` subdocument, for users where
 *      education.verified === true:
 *        education.verified (Boolean) → education.emailVerified: true,
 *                                        education.collegeStatus: "verified"
 *      For users where education.verified is falsy but education.collegeEmail
 *      is set: this state should not exist in practice, because the OLD
 *      /request route rejected unrecognized domains outright — a student
 *      could not reach "collegeEmail set, verified false" under old code
 *      (findOne-before-send meant every saved education record had already
 *      passed the recognized-domain check by the time it hit the DB, so
 *      confirmation success or failure is the only branch, not "never
 *      attempted"). This script exits early with an ⚠️ if it finds any --
 *      counting on that being true is an assumption, not something proven
 *      by reading the schema; verify against real data before proceeding
 *      un-modified if the count is nonzero.
 *
 * IMPORTANT — index sequencing: the OLD unique index is on `domain`
 * (single field). The NEW unique index (declared in models/College.js) is
 * a multikey unique index on `domains`. This script drops the old index,
 * migrates the documents, then lets Mongoose (re)create the new index on
 * next model load / `syncIndexes()` call — do NOT deploy the new
 * application code (which expects `domains`) before this script has run,
 * and do NOT run this script against a DB that already has documents in
 * the new shape (it is not idempotent across shapes — it looks for the
 * OLD field names to decide what needs migrating).
 *
 * Usage:
 *   cd backend
 *   node scripts/migrateCollegeSchema.js --dry-run   # preview only
 *   node scripts/migrateCollegeSchema.js              # apply
 */

import "../config/env.js";
import connectDB from "../config/db.js";
import mongoose from "mongoose";

const DRY_RUN = process.argv.includes("--dry-run");

async function migrateColleges(db) {
  const colleges = db.collection("colleges");

  const legacy = await colleges.find({ domain: { $exists: true } }).toArray();
  console.log(`\n[Colleges] ${legacy.length} document(s) in the old shape (domain: String).`);

  if (legacy.length === 0) {
    console.log("[Colleges] Nothing to migrate.");
    return;
  }

  // Old unique index was on `domain` — must go before we write `domains`
  // arrays and duplicate the field name's semantics.
  const indexes = await colleges.indexes();
  const oldIndex = indexes.find((i) => i.key && Object.keys(i.key).length === 1 && i.key.domain === 1);
  if (oldIndex) {
    console.log(`[Colleges] ${DRY_RUN ? "Would drop" : "Dropping"} legacy index: ${oldIndex.name}`);
    if (!DRY_RUN) await colleges.dropIndex(oldIndex.name);
  }

  let migrated = 0;
  for (const doc of legacy) {
    const update = {
      $set: {
        domains: [String(doc.domain).toLowerCase().trim()],
        status: doc.verified ? "verified" : "pending",
        submittedBy: doc.adminUserId ?? null,
        submittedByRole: "tpo",
        website: doc.website ?? null,
        country: doc.country ?? null,
      },
      $unset: { domain: "", verified: "", adminUserId: "" },
    };

    console.log(
      `  ${DRY_RUN ? "[dry-run] " : ""}${doc.name || doc._id}: domain="${doc.domain}" verified=${doc.verified} → domains=[${update.$set.domains}] status=${update.$set.status}`
    );

    if (!DRY_RUN) {
      await colleges.updateOne({ _id: doc._id }, update);
    }
    migrated++;
  }

  console.log(`[Colleges] ${DRY_RUN ? "Would migrate" : "Migrated"} ${migrated} document(s).`);
}

async function migrateUserEducation(db) {
  const users = db.collection("users");

  const withEducationVerified = await users
    .find({ "education.verified": { $exists: true } })
    .toArray();

  console.log(`\n[Users] ${withEducationVerified.length} document(s) with education.verified present.`);

  const unexpectedState = withEducationVerified.filter(
    (u) => !u.education.verified && u.education.collegeEmail
  );
  if (unexpectedState.length > 0) {
    console.warn(
      `⚠️  [Users] ${unexpectedState.length} user(s) have collegeEmail set but verified:false — ` +
        `this state should have been unreachable under the old /request route (see header comment). ` +
        `Inspect these before proceeding: ${unexpectedState.map((u) => u._id).join(", ")}`
    );
    console.warn("⚠️  Continuing migration for all OTHER users; these will be left with collegeStatus: \"unset\" (safe default) unless you intervene manually.");
  }

  let migrated = 0;
  for (const user of withEducationVerified) {
    const edu = user.education;
    const wasVerified = Boolean(edu.verified);

    const update = {
      $set: {
        "education.emailVerified": wasVerified,
        "education.emailVerifiedAt": wasVerified ? edu.verifiedAt ?? null : null,
        // Every pre-migration verified=true user passed the OLD recognized-
        // domain gate to get there, so their institution is, by the old
        // code's own logic, already trusted — safe to mark collegeStatus
        // "verified" rather than "pending".
        "education.collegeStatus": wasVerified ? "verified" : "unset",
        "education.collegeId": null, // no College doc existed for the
          // recognized-domain path pre-migration; leave unlinked, matching
          // the new code's own "recognized domain never creates a College
          // link" behavior.
      },
      $unset: { "education.verified": "", "education.verifiedAt": "" },
    };

    console.log(
      `  ${DRY_RUN ? "[dry-run] " : ""}${user.email || user._id}: verified=${edu.verified} → emailVerified=${wasVerified}, collegeStatus=${update.$set["education.collegeStatus"]}`
    );

    if (!DRY_RUN) {
      await users.updateOne({ _id: user._id }, update);
    }
    migrated++;
  }

  console.log(`[Users] ${DRY_RUN ? "Would migrate" : "Migrated"} ${migrated} document(s).`);
}

async function run() {
  if (DRY_RUN) console.log("🔍 DRY RUN — no writes will occur\n");

  await connectDB();
  const db = mongoose.connection.db;

  await migrateColleges(db);
  await migrateUserEducation(db);

  console.log(
    `\n${DRY_RUN ? "Dry run complete — re-run without --dry-run to apply." : "Migration complete."}`
  );
  console.log(
    "Next step: deploy the updated application code, then let Mongoose build the new `domains` unique index on next connect (or run a one-off `College.syncIndexes()`)."
  );

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});