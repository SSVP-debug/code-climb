/**
 * timeBuckets.js
 *
 * Pure, dependency-free time-bucketing for admin analytics (plan 007).
 * Deliberately separate from adminAnalyticsController.js: the controller
 * only needs to fetch raw timestamps (`Model.find(...).select("createdAt")`)
 * and hand them to bucketByPeriod() below — all the boundary-math logic
 * lives here, in a form that's trivial to unit test against a small fixed
 * set of mock dates (per plan 007's test plan: "assert the bucketing
 * boundaries are correct... assert specific counts land in specific
 * buckets," not just "returns an array").
 *
 * All boundaries are UTC — this codebase has no established timezone
 * convention elsewhere (checked: no dayjs/date-fns usage for this), so UTC
 * is the least-surprising default, same reasoning plan 004 used for
 * "new registrations today."
 *
 * Bucket shapes (all buckets always present, even with count 0 — so a
 * chart never has to guess whether a gap means "no data" or "no bucket"):
 *   - daily:   UTC calendar days,   default window 30 days
 *   - weekly:  rolling 7-day windows ending today, default window 12 weeks
 *              (NOT calendar/ISO weeks — avoids Mon-vs-Sun ambiguity this
 *              codebase has no existing convention for; documented here
 *              as a judgment call, not silently assumed)
 *   - monthly: UTC calendar months, default window 12 months
 */

export const DEFAULT_PERIODS = { daily: 30, weekly: 12, monthly: 12 };

function startOfUTCDay(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function startOfUTCMonth(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function buildDailyBuckets(periods, now) {
  const todayStart = startOfUTCDay(now);
  const firstStart = new Date(todayStart);
  firstStart.setUTCDate(firstStart.getUTCDate() - (periods - 1));

  const buckets = [];
  for (let i = 0; i < periods; i++) {
    const start = new Date(firstStart);
    start.setUTCDate(start.getUTCDate() + i);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);
    buckets.push({ label: start.toISOString().slice(0, 10), start, end });
  }
  return buckets;
}

function buildWeeklyBuckets(periods, now) {
  const todayEnd = startOfUTCDay(now);
  todayEnd.setUTCDate(todayEnd.getUTCDate() + 1); // exclusive upper bound = start of tomorrow
  const firstStart = new Date(todayEnd);
  firstStart.setUTCDate(firstStart.getUTCDate() - periods * 7);

  const buckets = [];
  for (let i = 0; i < periods; i++) {
    const start = new Date(firstStart);
    start.setUTCDate(start.getUTCDate() + i * 7);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 7);
    buckets.push({ label: `Week of ${start.toISOString().slice(0, 10)}`, start, end });
  }
  return buckets;
}

function buildMonthlyBuckets(periods, now) {
  const currentMonthStart = startOfUTCMonth(now);
  const firstStart = new Date(currentMonthStart);
  firstStart.setUTCMonth(firstStart.getUTCMonth() - (periods - 1));

  const buckets = [];
  for (let i = 0; i < periods; i++) {
    const start = new Date(firstStart);
    start.setUTCMonth(start.getUTCMonth() + i);
    const end = new Date(start);
    end.setUTCMonth(end.getUTCMonth() + 1);
    const label = `${start.getUTCFullYear()}-${String(start.getUTCMonth() + 1).padStart(2, "0")}`;
    buckets.push({ label, start, end });
  }
  return buckets;
}

/**
 * bucketByPeriod(dates, unit, periods?, now?)
 *
 * dates: array of Date | ISO string | anything `new Date(x)` accepts
 *   (e.g. plain `{ createdAt }` values pulled via `.select("createdAt")`).
 * unit: "daily" | "weekly" | "monthly"
 * periods: how many buckets to build (defaults per DEFAULT_PERIODS above).
 * now: inject a fixed Date for deterministic tests; defaults to `new Date()`.
 *
 * Returns buckets in ascending chronological order:
 *   [{ label, start: ISOString, end: ISOString, count }]
 */
export function bucketByPeriod(dates, unit, periods = DEFAULT_PERIODS[unit], now = new Date()) {
  if (!["daily", "weekly", "monthly"].includes(unit)) {
    throw new Error(`bucketByPeriod: unknown unit "${unit}"`);
  }

  const buckets =
    unit === "daily"
      ? buildDailyBuckets(periods, now)
      : unit === "weekly"
        ? buildWeeklyBuckets(periods, now)
        : buildMonthlyBuckets(periods, now);

  for (const bucket of buckets) bucket.count = 0;

  for (const raw of dates) {
    const t = new Date(raw).getTime();
    if (Number.isNaN(t)) continue;
    // Buckets are contiguous and non-overlapping, ascending — a simple
    // linear scan is fine at admin-analytics volumes (see plan 007's
    // "zero real users yet" framing, same premature-optimization call
    // plan 004 made for its own aggregations).
    for (const bucket of buckets) {
      if (t >= bucket.start.getTime() && t < bucket.end.getTime()) {
        bucket.count++;
        break;
      }
    }
  }

  return buckets.map(({ label, start, end, count }) => ({
    label,
    start: start.toISOString(),
    end: end.toISOString(),
    count,
  }));
}