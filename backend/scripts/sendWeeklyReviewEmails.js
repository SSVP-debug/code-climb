/**
 * sendWeeklyReviewEmails.js
 *
 * Commit 097 — AI weekly review email.
 *
 * For every user who has solved at least one problem in the last 7 days
 * and hasn't opted out (`emailPreferences.weeklyReview !== false`), this:
 *   1. Pulls their submissions from the last 7 days
 *   2. Asks Claude for a short, specific review + one recommendation
 *      (same fetch-based Claude pattern as controllers/insightsController.js,
 *      via utils/anthropicClient.js — see that file's header comment)
 *   3. Sends the result via Resend
 *
 * Design choices worth knowing before changing this:
 *   - Users with zero activity this week are skipped entirely — an AI
 *     "review" of someone who didn't practice is either empty filler or
 *     guilt-tripping, neither of which is the goal here.
 *   - This does NOT feed anything back into totalXP/solvedSlugs. It only
 *     reads existing state. Same invariant as the rest of the codebase:
 *     XP is only ever computed by progressController from solvedSlugs.
 *   - `lastWeeklyReviewSentAt` is set after a successful send purely so a
 *     re-run within the same week doesn't double-send if the cron
 *     schedule ever misfires — it is NOT a queue or scheduling mechanism.
 *
 * Usage:
 *   cd backend
 *   node scripts/sendWeeklyReviewEmails.js
 *
 * Add --dry-run to preview who would be emailed and what the AI review
 * would say, without actually calling Resend or writing to MongoDB:
 *   node scripts/sendWeeklyReviewEmails.js --dry-run
 *
 * Railway: set this up as a separate Cron Job service (not the main web
 * service) with start command `node scripts/sendWeeklyReviewEmails.js`
 * and a weekly schedule, e.g. `0 9 * * 1` (Mondays, 9am UTC).
 */

import "../config/env.js";
import connectDB from "../config/db.js";
import mongoose from "mongoose";
import User from "../models/User.js";
import Submission from "../models/Submission.js";
import problems from "../../src/data/problems.js";
import { logger } from "../config/logger.js";
import { getResendClient, getFromAddress } from "../config/resend.js";
import { callClaudeJSON } from "../utils/anthropicClient.js";
import { buildWeeklyReviewEmail } from "../utils/weeklyReviewEmailTemplate.js";

const DRY_RUN = process.argv.includes("--dry-run");
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const DASHBOARD_URL = `${process.env.FRONTEND_URL || "https://code-club-one.vercel.app"}/dashboard`;

const slugToTopic = new Map(problems.map((p) => [p.slug, p.topic]));

function buildSystemPrompt() {
  return `You are a senior DSA coach writing a short weekly email to a student. \nYou'll be given this week's practice data. Respond with ONLY a JSON object with exactly these keys:\n{\n  "headline": "one short, specific sentence opening the email — mention an actual number or topic from their data, not generic praise",\n  "review": "2-3 sentences, direct and specific, based only on the numbers given — what they did well and what's weak",\n  "recommendation": "one concrete next step, naming a specific topic or problem type to focus on next"\n}\nNo markdown, no preamble, valid JSON only.`;
}

async function buildAIReview({ weekSolvedCount, weekAttempted, acceptanceRate, topicsThisWeek, totalSolved, currentStreak }) {
  const userMessage = `This week's data:\n${JSON.stringify(
    { weekSolvedCount, weekAttempted, acceptanceRate, topicsThisWeek, totalSolved, currentStreak },
    null,
    2
  )}`;

  return callClaudeJSON({
    systemPrompt: buildSystemPrompt(),
    userMessage,
    maxTokens: 300,
  });
}

async function run() {
  await connectDB();

  const resend = DRY_RUN ? null : await getResendClient();
  if (!DRY_RUN && !resend) {
    logger.warn("[weekly-review] RESEND_API_KEY not set — nothing will be sent. Exiting.");
    await mongoose.disconnect();
    return;
  }

  const weekStart = new Date(Date.now() - WEEK_MS);

  // Only consider users who aren't opted out. `$ne: false` (not `$eq: true`)
  // deliberately treats "field doesn't exist yet" as opted-in — this field
  // is new, and existing users shouldn't be silently excluded just because
  // they predate this migration.
  const candidates = await User.find({
    "emailPreferences.weeklyReview": { $ne: false },
    email: { $exists: true, $ne: null },
  }); // NOT .lean() — we call user.save() below to record lastWeeklyReviewSentAt

  logger.info(`[weekly-review] ${candidates.length} candidate user(s) to check`);

  let sent = 0;
  let skippedNoActivity = 0;
  let skippedAlreadySent = 0;
  let errors = 0;

  for (const user of candidates) {
    const label = user.email || String(user._id);

    // Guard against double-send if the cron ever fires twice in one window.
    if (
      user.lastWeeklyReviewSentAt &&
      Date.now() - new Date(user.lastWeeklyReviewSentAt).getTime() < 5 * 24 * 60 * 60 * 1000
    ) {
      skippedAlreadySent++;
      continue;
    }

    let weekSubmissions;
    try {
      weekSubmissions = await Submission.find({
        userId: user._id,
        createdAt: { $gte: weekStart },
      }).lean();
    } catch (err) {
      logger.error({ err, user: label }, "[weekly-review] Failed to fetch submissions — skipping user");
      errors++;
      continue;
    }

    const acceptedThisWeek = weekSubmissions.filter((s) => s.status === "Accepted");
    const weekSolvedSlugs = [...new Set(acceptedThisWeek.map((s) => s.problemSlug))];

    if (weekSolvedSlugs.length === 0) {
      skippedNoActivity++;
      continue;
    }

    const weekAttempted = new Set(weekSubmissions.map((s) => s.problemSlug)).size;
    const acceptanceRate =
      weekSubmissions.length > 0
        ? `${((acceptedThisWeek.length / weekSubmissions.length) * 100).toFixed(0)}%`
        : "N/A";
    const topicsThisWeek = [
      ...new Set(weekSolvedSlugs.map((slug) => slugToTopic.get(slug)).filter(Boolean)),
    ];

    let ai;
    try {
      ai = await buildAIReview({
        weekSolvedCount: weekSolvedSlugs.length,
        weekAttempted,
        acceptanceRate,
        topicsThisWeek,
        totalSolved: user.solvedSlugs?.length ?? 0,
        currentStreak: user.currentStreak ?? 0,
      });
    } catch (err) {
      logger.error({ err, user: label }, "[weekly-review] Claude call failed — skipping user this week");
      errors++;
      continue;
    }

    const { subject, html, text } = buildWeeklyReviewEmail({
      displayName: user.displayName,
      weekSolvedCount: weekSolvedSlugs.length,
      currentStreak: user.currentStreak ?? 0,
      totalXP: user.totalXP ?? 0,
      topicsThisWeek,
      ai,
      dashboardUrl: DASHBOARD_URL,
    });

    if (DRY_RUN) {
      logger.info({ user: label, subject, ai }, "[weekly-review] DRY RUN — would send");
      sent++;
      continue;
    }

    try {
      const result = await resend.emails.send({
        from: getFromAddress(),
        to: user.email,
        subject,
        html,
        text,
      });

      if (result.error) {
        throw new Error(result.error.message || "Resend returned an error");
      }

      user.lastWeeklyReviewSentAt = new Date();
      await user.save();
      sent++;
    } catch (err) {
      logger.error({ err, user: label }, "[weekly-review] Resend send failed — skipping user");
      errors++;
    }
  }

  logger.info(
    { sent, skippedNoActivity, skippedAlreadySent, errors },
    `[weekly-review] Done${DRY_RUN ? " (dry run)" : ""}`
  );

  await mongoose.disconnect();
}

run().catch((err) => {
  logger.error({ err }, "[weekly-review] Fatal error");
  process.exit(1);
});