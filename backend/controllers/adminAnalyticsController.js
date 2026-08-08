/**
 * adminAnalyticsController.js — admin console analytics endpoints
 * (plan 007). Split into its own file for the same reason
 * collegeController.js/adminProblemController.js were: adminController.js
 * had already reached 898 lines by plan 006, well past judgeController.js
 * (588, the next-largest, never split).
 *
 * ── Scope note — read before extending this file ───────────────────────
 * This is admin-wide, aggregate analytics (registrations, retention,
 * submission trends across ALL users). It is NOT the same page as
 * src/pages/Analytics.jsx, which is an individual student's own personal
 * performance dashboard (scoped to req.userDoc via useAppContext on the
 * frontend, not touched by this plan at all — confirmed by reading it
 * before writing this file, per plan 007's Context section).
 *
 * ── Time-bucketing ──────────────────────────────────────────────────────
 * Bucket-boundary math lives in ../utils/timeBuckets.js, not here — kept
 * separate so it's unit-testable against fixed mock dates without mocking
 * Mongoose. This file's job is just: fetch raw timestamps, hand them to
 * bucketByPeriod().
 *
 * ── "Active users" — a judgment call, resolved here not in code review ──
 * The spec asks for "active-user counts over a rolling window." There's no
 * lastLogin-style timestamp on User (checked backend/models/User.js) — the
 * only real per-user activity signal is Submission.createdAt. So "active"
 * here means "made at least one submission in the window," not the
 * User.status account-status field plan 003/004 use (that's an admin
 * suspend/activate flag, not an activity signal — a suspended user made no
 * submissions either way, and an active-status user who's never opened the
 * app wouldn't show as "active" under that field). Returned as two rolling
 * snapshot numbers (last 7 / last 30 days), not a time series — a full
 * activity trend line is a reasonable future addition but out of scope for
 * "keep this simple," per the plan's own framing for the retention metric.
 */
import User from "../models/User.js";
import Problem from "../models/Problem.js";
import Submission from "../models/Submission.js";
import { bucketByPeriod } from "../utils/timeBuckets.js";
import { logger } from "../config/logger.js";

const VALID_BUCKETS = ["daily", "weekly", "monthly"];

function resolveBucket(req) {
  const bucket = req.query.bucket || "daily";
  return VALID_BUCKETS.includes(bucket) ? bucket : "daily";
}

// ── GET /api/admin/analytics/registrations?bucket=daily|weekly|monthly ─────
export async function getRegistrationTrends(req, res) {
  try {
    const bucket = resolveBucket(req);
    const users = await User.find({}).select("createdAt").lean();
    const trend = bucketByPeriod(
      users.map((u) => u.createdAt),
      bucket
    );
    return res.json({ bucket, trend });
  } catch (err) {
    logger.error({ err }, "[Admin] registration trends error");
    return res.status(500).json({ error: "Failed to load registration trends." });
  }
}

// ── GET /api/admin/analytics/submissions?bucket=daily|weekly|monthly ───────
export async function getSubmissionTrends(req, res) {
  try {
    const bucket = resolveBucket(req);
    const submissions = await Submission.find({}).select("createdAt").lean();
    const trend = bucketByPeriod(
      submissions.map((s) => s.createdAt),
      bucket
    );
    return res.json({ bucket, trend });
  } catch (err) {
    logger.error({ err }, "[Admin] submission trends error");
    return res.status(500).json({ error: "Failed to load submission trends." });
  }
}

// ── GET /api/admin/analytics/active-users ───────────────────────────────────
// See the "Active users" note in the file header for why this is
// submission-based, not User.status-based, and why it's two rolling
// snapshot numbers rather than a bucketed trend.
export async function getActiveUserTrends(req, res) {
  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 7);
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 30);

    const [last7Days, last30Days] = await Promise.all([
      Submission.distinct("userId", { createdAt: { $gte: sevenDaysAgo } }),
      Submission.distinct("userId", { createdAt: { $gte: thirtyDaysAgo } }),
    ]);

    return res.json({
      last7Days: last7Days.length,
      last30Days: last30Days.length,
    });
  } catch (err) {
    logger.error({ err }, "[Admin] active user trends error");
    return res.status(500).json({ error: "Failed to load active user trends." });
  }
}

// ── GET /api/admin/analytics/retention ──────────────────────────────────────
// Single rolling week-over-week percentage, per plan 007's explicit scope
// note ("one rolling week-over-week percentage is enough... a full cohort-
// retention engine is out of scope"). "Active in week N" = made >= 1
// submission during that 7-day window (same activity signal as
// getActiveUserTrends above).
export async function getRetentionMetric(req, res) {
  try {
    const now = new Date();
    const weekNStart = new Date(now);
    weekNStart.setUTCDate(weekNStart.getUTCDate() - 7);
    const weekN1Start = new Date(now);
    weekN1Start.setUTCDate(weekN1Start.getUTCDate() - 14);

    const [weekNUsers, weekN1Users] = await Promise.all([
      Submission.distinct("userId", { createdAt: { $gte: weekNStart, $lt: now } }),
      Submission.distinct("userId", { createdAt: { $gte: weekN1Start, $lt: weekNStart } }),
    ]);

    const weekN1Set = new Set(weekN1Users.map(String));
    const retainedCount = weekNUsers.filter((id) => weekN1Set.has(String(id))).length;

    // Divide-by-zero guard, same pattern as getDashboardMetrics'
    // acceptanceRate (plan 004) — no week-N-1 activity means "no data yet,"
    // not "0% retention" (which would misleadingly imply everyone churned).
    const retentionPercent = weekN1Set.size > 0 ? Math.round((retainedCount / weekN1Set.size) * 100) : null;

    return res.json({
      weekN1ActiveUsers: weekN1Set.size,
      weekNActiveUsers: weekNUsers.length,
      retainedUsers: retainedCount,
      retentionPercent,
    });
  } catch (err) {
    logger.error({ err }, "[Admin] retention metric error");
    return res.status(500).json({ error: "Failed to load retention metric." });
  }
}

// ── GET /api/admin/analytics/problems?limit=10 ──────────────────────────────
// Most/least solved, ranked by ACCEPTED-submission count — per plan 007's
// explicit definition, not by distinct-solver count (a different, also
// reasonable metric, but not what was asked for here).
//
// "Least solved" only ranks problems with >=1 accepted submission — a
// problem with zero accepted submissions never appears in a $group over
// Submission at all. Rather than silently treating "no data" as "tied for
// least popular" (which would misleadingly mix "barely solved" with
// "nobody has ever attempted it"), those are surfaced separately via
// `neverSolvedCount` — same "don't fabricate a number that looks
// plausible but isn't" principle plan 004's escape hatch used for
// acceptance rate.
export async function getProblemPopularity(req, res) {
  try {
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));

    const [grouped, totalCatalogProblems] = await Promise.all([
      Submission.aggregate([
        { $match: { status: "Accepted" } },
        { $group: { _id: "$problemSlug", acceptedCount: { $sum: 1 } } },
      ]),
      // Same catalog-visibility filter as getProblems (problemController.js)
      // — don't count contest-only problems the public list wouldn't show.
      Problem.countDocuments({ visibility: { $ne: "contest" } }),
    ]);

    const sorted = [...grouped].sort((a, b) => b.acceptedCount - a.acceptedCount);
    const mostSolvedSlugs = sorted.slice(0, limit);
    const leastSolvedSlugs = sorted.slice(-limit).reverse();
    // With fewer than 2*limit problems having any accepted submissions
    // (expected at "zero real users yet" volume), most/least legitimately
    // overlap — that's correct, not a bug: with only a handful of solved
    // problems, they ARE simultaneously the most- and least-solved ones.

    const slugsNeeded = [...new Set([...mostSolvedSlugs, ...leastSolvedSlugs].map((r) => r._id))];
    const problems = await Problem.find({ slug: { $in: slugsNeeded } })
      .select("slug title difficulty")
      .lean();
    const problemBySlug = Object.fromEntries(problems.map((p) => [p.slug, p]));

    const withTitles = (rows) =>
      rows
        .filter((r) => problemBySlug[r._id]) // drop slugs with no live Problem doc (e.g. deleted since)
        .map((r) => ({
          slug: r._id,
          title: problemBySlug[r._id].title,
          difficulty: problemBySlug[r._id].difficulty,
          acceptedCount: r.acceptedCount,
        }));

    return res.json({
      mostSolved: withTitles(mostSolvedSlugs),
      leastSolved: withTitles(leastSolvedSlugs),
      neverSolvedCount: Math.max(0, totalCatalogProblems - grouped.length),
    });
  } catch (err) {
    logger.error({ err }, "[Admin] problem popularity error");
    return res.status(500).json({ error: "Failed to load problem popularity." });
  }
}

// ── GET /api/admin/analytics/languages ──────────────────────────────────────
// By submission count per language (all submissions, any status) — per
// plan 007's definition, distinct from getProblemPopularity's
// accepted-only count. Submission.language is required on every document
// (backend/models/Submission.js) and records what an individual submission
// actually used, not what a problem merely supports (Problem's
// starterCode keys) — confirmed per plan 007 step 3 before building this,
// so there's no gap to flag here.
export async function getLanguagePopularity(req, res) {
  try {
    const grouped = await Submission.aggregate([
      { $group: { _id: "$language", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    return res.json({
      languages: grouped.map((row) => ({ language: row._id, count: row.count })),
    });
  } catch (err) {
    logger.error({ err }, "[Admin] language popularity error");
    return res.status(500).json({ error: "Failed to load language popularity." });
  }
}