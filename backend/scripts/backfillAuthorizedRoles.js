/**
 * backfillAuthorizedRoles.js
 *
 * One-time migration for the role/profile isolation fix (see
 * models/User.js's role/roles comment for the full architecture writeup).
 *
 * Before this fix, `role` was the ONLY role concept on the schema — no
 * `roles` array existed. This backfills `roles` for every pre-existing
 * document so `roleGuard.js`, `routes/init.js`, and the new
 * POST /me/switch-role endpoint (userController.js's switchActiveRole)
 * all see a correctly-populated authorized-roles list instead of falling
 * back to the schema default (["student"]) for accounts that are
 * genuinely tpo/recruiter/admin.
 *
 * What this does NOT do, on purpose:
 *   - It does NOT retroactively grant multi-role access. A TPO account
 *     that was previously a Student (role overwritten at registration,
 *     per the old bug) gets `roles: ["tpo"]`, not `roles: ["student",
 *     "tpo"]` — we have no reliable way to know whether that account's
 *     leftover totalXP/solvedSlugs/etc. represent a real, still-wanted
 *     Student identity or just residue from before they converted, and
 *     granting access back could resurface exactly the kind of
 *     unintended cross-role exposure this fix exists to prevent. If a
 *     real person wants their Student access back, that's a conscious
 *     re-registration (or an admin action), not an automatic backfill.
 *   - It does NOT touch, move, or delete any student-track fields
 *     (totalXP, currentStreak, solvedSlugs, achievements, etc.) — those
 *     stay exactly where they are. They're simply no longer served by
 *     any role-gated read endpoint for a non-student active role (see
 *     progressController.js's progressToClientForRole and
 *     routes/init.js), which is the actual fix; nothing about the data
 *     itself needs to move.
 *   - admin accounts get `roles: ["admin"]` here for consistency, though
 *     nothing currently reads `roles` for admin gating (requireAdmin.js
 *     still checks `role`/`actingAdminDoc` directly, unchanged).
 *
 * Idempotent / safe to re-run: only touches documents where `roles` is
 * missing or empty; a second run is a no-op.
 *
 * Usage:
 *   cd backend
 *   node scripts/backfillAuthorizedRoles.js --dry-run   # preview only
 *   node scripts/backfillAuthorizedRoles.js              # apply
 */

import "../config/env.js";
import connectDB from "../config/db.js";
import mongoose from "mongoose";
import User from "../models/User.js";

const DRY_RUN = process.argv.includes("--dry-run");

async function backfillAuthorizedRoles() {
  await connectDB();

  if (DRY_RUN) {
    console.log("🔍 DRY RUN — no writes will occur\n");
  }

  const users = await User.find(
    { $or: [{ roles: { $exists: false } }, { roles: { $size: 0 } }] },
    "email role roles"
  );

  console.log(`Found ${users.length} user(s) with no roles[] set.\n`);

  let updated = 0;

  for (const user of users) {
    const inferredRole = user.role || "student";

    console.log(`  ${user.email || user._id} → roles: ["${inferredRole}"]`);

    if (!DRY_RUN) {
      user.roles = [inferredRole];
      await user.save();
    }

    updated++;
  }

  console.log(
    `\n${DRY_RUN ? "Would update" : "Updated"} ${updated} of ${users.length} user(s).`
  );

  await mongoose.disconnect();
}

backfillAuthorizedRoles().catch((err) => {
  console.error("Backfill failed:", err);
  process.exit(1);
});
