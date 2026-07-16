/**
 * archiveOldSubmissionCode.js
 *
 * Phase 4 (database scalability) — Submission.code has no retention policy
 * today: every submission stores up to 50,000 chars of raw code, forever,
 * with no deletion or archival. The collection grows unbounded even though
 * nothing in the app ever reads beyond the most recent 100 submissions
 * (see controllers/submissionController.js's listSubmissions, capped at
 * .limit(100), and routes/init.js's boot fetch, capped at .limit(50)).
 *
 * This script clears (nulls out) the `code` field on submissions older
 * than SUBMISSION_CODE_RETENTION_DAYS — it does NOT delete the submission
 * documents themselves.
 *
 * Why null the field instead of deleting the document:
 *   - The global per-problem acceptance-rate aggregation
 *     (problemController.getAcceptanceRates, indexed on
 *     { problemSlug: 1, status: 1 }) groups ALL submissions ever made by
 *     ALL users. Deleting old submission documents would silently corrupt
 *     that aggregation over time — old accepted/failed attempts would
 *     drop out of both the numerator and denominator. Nulling `code`
 *     preserves status/passed/total/timestamps, which is everything any
 *     stats, streak, or aggregation feature actually needs.
 *   - `code` (up to 50,000 chars) is by far the largest field on the
 *     document — clearing it recovers the vast majority of the storage
 *     this collection consumes, without touching anything else.
 *   - Softest possible UX regression: old entries still show up in
 *     Submission History with full metadata, just with source no longer
 *     viewable. (Checked: the current UI — SubmissionDetailsModal.jsx,
 *     SubmissionHistory.jsx — doesn't actually render `code` anywhere
 *     today, so this has zero visible effect right now. If/when a "view
 *     submitted code" feature is added, it'll need to handle an empty
 *     string for old submissions.)
 *
 * Retention window: SUBMISSION_CODE_RETENTION_DAYS below (default 180).
 * Change the constant, not the query — keeps the "what counts as old"
 * decision in one obvious place.
 *
 * Usage:
 *   cd backend
 *   node scripts/archiveOldSubmissionCode.js
 *
 * Add --dry-run to see how many submissions WOULD be affected without
 * writing anything:
 *   node scripts/archiveOldSubmissionCode.js --dry-run
 *
 * Railway: set this up as a separate Cron Job service (not the main web
 * service) with start command `node scripts/archiveOldSubmissionCode.js`
 * and a weekly schedule, e.g. `0 3 * * 0` (Sundays, 3am UTC) — same
 * pattern as scripts/sendWeeklyReviewEmails.js.
 */

import "../config/env.js";
import connectDB from "../config/db.js";
import mongoose from "mongoose";
import Submission from "../models/Submission.js";
import { logger } from "../config/logger.js";

const SUBMISSION_CODE_RETENTION_DAYS = 180;

const DRY_RUN = process.argv.includes("--dry-run");

async function run() {
  await connectDB();

  const cutoff = new Date(Date.now() - SUBMISSION_CODE_RETENTION_DAYS * 24 * 60 * 60 * 1000);

  const filter = {
    createdAt: { $lt: cutoff },
    code: { $ne: "" },
  };

  const matchCount = await Submission.countDocuments(filter);

  if (DRY_RUN) {
    logger.info(
      { matchCount, cutoff: cutoff.toISOString(), retentionDays: SUBMISSION_CODE_RETENTION_DAYS },
      "[archive-submission-code] DRY RUN — would clear code on this many submissions"
    );
    await mongoose.disconnect();
    return;
  }

  const result = await Submission.updateMany(filter, { $set: { code: "" } });

  logger.info(
    {
      matched: result.matchedCount ?? matchCount,
      modified: result.modifiedCount,
      cutoff: cutoff.toISOString(),
      retentionDays: SUBMISSION_CODE_RETENTION_DAYS,
    },
    "[archive-submission-code] Done"
  );

  await mongoose.disconnect();
}

run().catch((err) => {
  logger.error({ err }, "[archive-submission-code] Fatal error");
  process.exit(1);
});