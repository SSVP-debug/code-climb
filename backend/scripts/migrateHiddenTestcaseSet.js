/**
 * migrateHiddenTestcaseSet.js
 *
 * Content & Execution Architecture, Phase 3.
 *
 * One-time migration: wraps every Problem document's flat
 * `hiddentestcases: [...]` array into the new
 * `hiddenTestcaseSet: { enabled: true, testcases: [...] }` sub-document
 * that backend/models/Problem.js now declares.
 *
 * SAFETY DESIGN — read this before running:
 *
 *  1. This migration is ADDITIVE, not destructive. It writes the new
 *     `hiddenTestcaseSet` field; it does NOT `$unset` the old
 *     `hiddentestcases` field. The old field is left physically in place,
 *     inert, on every migrated document.
 *
 *  2. This is deliberately different from "stage the migration, remove
 *     the old field later" in one specific way: because this field is
 *     security-sensitive (hidden testcases must never reach a client),
 *     every read path that used to exclude `hiddentestcases` has been
 *     updated to exclude BOTH `hiddentestcases` AND `hiddenTestcaseSet`
 *     (see Problem.js's `publicFields` static and problemController.js's
 *     two `.select()` calls) — in the SAME change that introduced this
 *     migration, not a follow-up. That means there is no window, before
 *     or after this script runs, where the old field's data could leak:
 *     it's excluded everywhere regardless of whether a given document has
 *     been migrated yet. This is what makes it safe to leave the old
 *     field in place rather than needing an atomic
 *     copy-and-delete-in-one-step migration.
 *
 *  3. Rollback: if this migration needs to be reversed, the old
 *     `hiddentestcases` field is still sitting on every document
 *     untouched — reverting is "stop reading hiddenTestcaseSet, read
 *     hiddentestcases again" in code, no data recovery step needed. A
 *     document that somehow only has `hiddenTestcaseSet` and no old field
 *     (e.g. one created by adminProblemController.js's admin-sourced
 *     create/update path AFTER this phase shipped) has no old field to
 *     roll back to — that's expected and fine, since those documents were
 *     never in the old shape to begin with.
 *
 *  4. A LATER, SEPARATE cleanup script (not part of this phase) can
 *     safely `$unset: { hiddentestcases: "" }` once the restructuring has
 *     been live and verified for a while. Not done here — out of scope
 *     for this phase, and unnecessary for correctness or security given
 *     point 2 above.
 *
 * Usage:
 *   cd backend
 *   node scripts/migrateHiddenTestcaseSet.js           # apply
 *   node scripts/migrateHiddenTestcaseSet.js --dry-run  # report only, no writes
 *
 * Exit code 0 = every document with a legacy `hiddentestcases` field was
 *               either already migrated or successfully migrated, and
 *               every migrated document's testcase count matches its
 *               source exactly.
 * Exit code 1 = at least one document failed the count-verification check
 *               after being written — see "MISMATCH" lines in the output.
 *               No further documents are skipped because of one mismatch;
 *               the script finishes the full pass and reports everything
 *               it found, then exits non-zero so CI/an operator notices.
 */
import "../config/env.js";
import connectDB from "../config/db.js";
import Problem from "../models/Problem.js";

const DRY_RUN = process.argv.includes("--dry-run");

// Exported separately from the CLI wrapper below so it's unit-testable
// against a fake collection (no real MongoDB needed) — same "export
// testable core logic, keep the CLI thin" pattern already used by
// scripts/checkProblemsFolderDrift.js's findDrift(). `collection` is
// expected to expose the same subset of the MongoDB driver's Collection
// API used here: `.find(query, opts).toArray()`, `.updateOne(...)`,
// `.findOne(query, opts)`.
export async function migrateHiddenTestcaseSetCollection(collection, { dryRun = false, log = console.log } = {}) {
  const candidates = await collection
    .find(
      { hiddentestcases: { $exists: true } },
      { projection: { slug: 1, hiddentestcases: 1, hiddenTestcaseSet: 1 } }
    )
    .toArray();

  log(`Found ${candidates.length} document(s) with a legacy hiddentestcases field.`);

  let migrated = 0;
  let alreadyMigrated = 0;
  const mismatches = [];

  for (const doc of candidates) {
    const legacyTestcases = Array.isArray(doc.hiddentestcases) ? doc.hiddentestcases : [];

    if (doc.hiddenTestcaseSet && Array.isArray(doc.hiddenTestcaseSet.testcases)) {
      // Already has a hiddenTestcaseSet (e.g. this script already ran
      // once, or the document was hand-edited) — don't overwrite an
      // existing `enabled` decision an admin may have already made.
      // Just verify the counts still line up and move on.
      if (doc.hiddenTestcaseSet.testcases.length !== legacyTestcases.length) {
        mismatches.push({
          slug: doc.slug,
          reason: "already has hiddenTestcaseSet, but testcase count differs from legacy field",
          legacyCount: legacyTestcases.length,
          newCount: doc.hiddenTestcaseSet.testcases.length,
        });
      }
      alreadyMigrated++;
      continue;
    }

    log(`  ${dryRun ? "[DRY RUN] would migrate" : "migrating"} ${doc.slug} (${legacyTestcases.length} hidden testcase(s))`);

    if (dryRun) {
      migrated++;
      continue;
    }

    const result = await collection.updateOne(
      { _id: doc._id },
      {
        // Additive only — see this file's header comment, point 1. No
        // $unset here.
        $set: {
          hiddenTestcaseSet: {
            enabled: true,
            testcases: legacyTestcases,
          },
        },
      }
    );

    if (result.matchedCount === 0) {
      mismatches.push({ slug: doc.slug, reason: "document disappeared between read and write" });
      continue;
    }

    // Verify: re-read and confirm the testcase count round-tripped
    // exactly, per the task's explicit "verify counts" requirement.
    const verifyDoc = await collection.findOne(
      { _id: doc._id },
      { projection: { hiddenTestcaseSet: 1 } }
    );
    const writtenCount = verifyDoc?.hiddenTestcaseSet?.testcases?.length ?? -1;

    if (writtenCount !== legacyTestcases.length) {
      mismatches.push({
        slug: doc.slug,
        reason: "post-write count does not match source",
        legacyCount: legacyTestcases.length,
        writtenCount,
      });
    } else {
      migrated++;
    }
  }

  return { migrated, alreadyMigrated, mismatches };
}

async function migrate() {
  await connectDB();

  // Raw collection access (not the Mongoose model's `.find()`): the
  // Mongoose schema no longer declares `hiddentestcases`, so a normal
  // `Problem.find()` would never return it even though it may still be
  // physically present on un-migrated documents. This migration needs to
  // see that raw field directly, exactly once, to copy it forward.
  const { migrated, alreadyMigrated, mismatches } = await migrateHiddenTestcaseSetCollection(
    Problem.collection,
    { dryRun: DRY_RUN }
  );

  console.log("");
  console.log(`${DRY_RUN ? "Would migrate" : "Migrated"}: ${migrated}`);
  console.log(`Already migrated (verified, skipped): ${alreadyMigrated}`);
  console.log(`Mismatches: ${mismatches.length}`);

  if (mismatches.length > 0) {
    console.log("");
    console.log("MISMATCH details (needs manual review):");
    for (const m of mismatches) {
      console.log(`  - ${m.slug}: ${m.reason}`, m);
    }
  }

  console.log("");
  console.log(
    DRY_RUN
      ? "Dry run complete — no writes were made. Re-run without --dry-run to apply."
      : "Migration complete. The legacy `hiddentestcases` field was left in place on every " +
          "document (not deleted) — see this file's header comment for why that's safe. " +
          "Every read path already excludes both field names."
  );

  process.exit(mismatches.length > 0 ? 1 : 0);
}

// Only run as a CLI script, not when imported by tests — same guard
// checkProblemsFolderDrift.js uses.
if (import.meta.url === `file://${process.argv[1]}`) {
  migrate().catch((err) => {
    console.error("❌ Migration failed:");
    console.error(err);
    process.exit(1);
  });
}
