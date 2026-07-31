/**
 * dropNullInviteCodes.js
 *
 * One-time migration for the Fest Readiness Audit P1-5 fix
 * (models/Contest.js: inviteCode gained `unique: true`, alongside its
 * existing `sparse: true`).
 *
 * Why this is needed: under the OLD schema, `inviteCode` had
 * `default: null`, so every public contest (which never sets an invite
 * code) got `inviteCode: null` written explicitly onto its document. A
 * sparse index only excludes documents where the indexed field is
 * genuinely ABSENT — a document with the field explicitly set to `null`
 * still gets an index entry. Left as-is, every one of those pre-existing
 * `inviteCode: null` documents would collide with every other one under
 * the new unique index, and the index build on deploy would fail.
 *
 * This script removes the field entirely (not "set to null" — actually
 * unset) from every document where it's currently `null`, so the new
 * unique+sparse index has nothing to collide on. Private contests, which
 * always have a real string `inviteCode`, are untouched.
 *
 * Idempotent and safe to re-run: a second run finds zero matching
 * documents and does nothing.
 *
 * Usage:
 *   cd backend
 *   node scripts/dropNullInviteCodes.js --dry-run   # preview only
 *   node scripts/dropNullInviteCodes.js              # apply
 *
 * Run this BEFORE deploying the updated models/Contest.js — Mongoose
 * builds the new unique index on next connect, and that build will fail
 * if any duplicate (including null-vs-null) values still exist.
 */

import "../config/env.js";
import connectDB from "../config/db.js";
import mongoose from "mongoose";

const DRY_RUN = process.argv.includes("--dry-run");

async function run() {
  if (DRY_RUN) console.log("🔍 DRY RUN — no writes will occur\n");

  await connectDB();
  const db = mongoose.connection.db;
  const contests = db.collection("contests");

  const nullCodeDocs = await contests
    .find({ inviteCode: null })
    .project({ _id: 1, title: 1, type: 1 })
    .toArray();

  console.log(`[Contests] ${nullCodeDocs.length} document(s) with inviteCode explicitly set to null.`);

  const unexpected = nullCodeDocs.filter((c) => c.type === "private");
  if (unexpected.length > 0) {
    console.warn(
      `⚠️  [Contests] ${unexpected.length} PRIVATE contest(s) have inviteCode: null — this ` +
        `should be unreachable (every private contest is created with a real code). Inspect ` +
        `before proceeding, these will otherwise be left without a working invite code: ` +
        `${unexpected.map((c) => c._id).join(", ")}`
    );
  }

  if (nullCodeDocs.length === 0) {
    console.log("[Contests] Nothing to migrate.");
  } else {
    const result = DRY_RUN
      ? { modifiedCount: nullCodeDocs.length }
      : await contests.updateMany({ inviteCode: null }, { $unset: { inviteCode: "" } });

    console.log(
      `[Contests] ${DRY_RUN ? "Would unset" : "Unset"} inviteCode on ${result.modifiedCount} document(s).`
    );
  }

  console.log(
    `\n${DRY_RUN ? "Dry run complete — re-run without --dry-run to apply." : "Migration complete."}`
  );
  console.log(
    "Next step: deploy the updated application code; Mongoose will build the new unique+sparse index on next connect (or run a one-off `Contest.syncIndexes()`)."
  );

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});