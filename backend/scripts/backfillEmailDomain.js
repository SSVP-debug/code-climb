/**
 * backfillEmailDomain.js
 *
 * One-time migration: populates `emailDomain` on every existing User
 * document from their `email` field.
 *
 * Why this is needed: `emailDomain` was added to the User schema (with a
 * pre-save hook that derives it from `email` going forward) as part of
 * the state-coverage audit fix — see models/User.js's comment on the
 * field. That hook only runs on `.save()`, so it only takes effect for
 * NEW writes from this point on. Every user document created before this
 * fix has `emailDomain: null` (the schema default) and needs it computed
 * once, here — otherwise routes/tpo.js and routes/recruiter.js's
 * emailDomain-based queries keep silently matching zero pre-existing
 * users even after the schema fix ships.
 *
 * Safe to re-run — result is always deterministic from `email`, and
 * users who already have the correct emailDomain are skipped.
 *
 * Usage:
 *   cd backend
 *   node scripts/backfillEmailDomain.js
 *
 * Add --dry-run to preview changes without writing to MongoDB:
 *   node scripts/backfillEmailDomain.js --dry-run
 */

import "../config/env.js";
import connectDB from "../config/db.js";
import mongoose from "mongoose";
import User from "../models/User.js";

const DRY_RUN = process.argv.includes("--dry-run");

function deriveDomain(email) {
  if (!email) return null;
  const domain = email.split("@")[1];
  return domain ? domain.toLowerCase() : null;
}

async function backfillEmailDomain() {
  await connectDB();

  if (DRY_RUN) {
    console.log("🔍 DRY RUN — no writes will occur\n");
  }

  // Only the two fields this script actually needs — same reasoning as
  // backfillXP.js's projected .find(): keeps the read cheap on a
  // collection that can otherwise be large.
  const users = await User.find({}, "email emailDomain").lean();

  let updated = 0;
  let skipped = 0;
  let errors = 0;
  let noEmail = 0;

  for (const user of users) {
    const label = user.email || String(user._id);
    const correctDomain = deriveDomain(user.email);

    if (!correctDomain) {
      // No email on the account at all (shouldn't normally happen given
      // Firebase auth always provides one, but accounts can predate that
      // guarantee) — nothing to derive, and forcing a null write for
      // something that's already null by schema default would just be
      // a no-op with extra steps.
      console.log(`  ⚠️  ${label}  no email on account — skipped`);
      noEmail++;
      continue;
    }

    if (user.emailDomain === correctDomain) {
      console.log(`  ✅ ${label}  → ${correctDomain}  (already correct)`);
      skipped++;
      continue;
    }

    console.log(`  ${DRY_RUN ? "🔸" : "✏️ "} ${label}  ${user.emailDomain ?? "(none)"} → ${correctDomain}`);

    if (!DRY_RUN) {
      try {
        await User.updateOne(
          { _id: user._id },
          { $set: { emailDomain: correctDomain } }
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

  console.log(
    `\nDone. ${updated} updated, ${skipped} already correct, ${noEmail} skipped (no email), ${errors} errors. Total: ${users.length}.`
  );

  await mongoose.disconnect();
}

backfillEmailDomain().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
