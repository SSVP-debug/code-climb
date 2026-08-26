import Problem from "../models/Problem.js";
import Submission from "../models/Submission.js";
import { getOrSetCache, invalidateCache } from "../utils/cache.js";
import { XP_BY_DIFFICULTY } from "../utils/computeXP.js";
import { getNextBestProblem } from "../utils/recommendNextProblem.js";
import { canAccessContestProblem } from "../services/contestProblemAccess.js";

const PROBLEMS_CACHE_KEY = "problems:all";
const CACHE_TTL_SECONDS = 5 * 60; // 5 minutes — unchanged from the original TTL

const ACCEPTANCE_CACHE_KEY = "problems:acceptanceRates";
// Longer TTL than the problems list: this aggregates ALL submissions across
// ALL users, so it's a heavier query and doesn't need to be as fresh —
// a card showing "82%" instead of "82.4%" for 15 minutes is fine.
const ACCEPTANCE_CACHE_TTL_SECONDS = 15 * 60;

// XP_BY_DIFFICULTY (backend/utils/computeXP.js) is the single source of
// truth for XP values — reused here purely for *display* on problem cards.
// Do not hardcode these numbers anywhere else; import this instead.
function withXP(problem) {
  return { ...problem, xp: XP_BY_DIFFICULTY[problem.difficulty] ?? null };
}

/**
 * Call this after any problem create/update/delete (e.g. admin routes,
 * seed scripts) so the next GET /api/problems reflects the change instead
 * of waiting out the TTL.
 */
export async function invalidateProblemsCache() {
  await invalidateCache(PROBLEMS_CACHE_KEY);
}

/**
 * Acceptance rates are driven by the Submission collection, not the Problem
 * collection, so they don't go stale when a problem is edited — only the
 * TTL above needs to expire. No admin/edit flow needs to call this; it
 * exists for completeness (e.g. a future "recompute now" admin action).
 */
export async function invalidateAcceptanceRatesCache() {
  await invalidateCache(ACCEPTANCE_CACHE_KEY);
}

export const getProblems = async (req, res) => {
  try {
    const { value: problems, cacheStatus } = await getOrSetCache(
      PROBLEMS_CACHE_KEY,
      CACHE_TTL_SECONDS,
      async () => {
        const problems = await Problem.find({
          // Fest Readiness Audit, P0-2: contest-only problems must never
          // appear in the general catalog. This is a shared, unpersonalized
          // cache (see PROBLEMS_CACHE_KEY above) — the same response is
          // served to every caller regardless of contest membership or
          // timing, so there's no way to personalize this list per-user
          // without breaking that. The simple, safe rule instead: a
          // "contest" visibility problem is never in the browsable catalog
          // at all, even after its contest ends (unlike the single-problem
          // detail endpoint below, which does open up post-contest) — it's
          // reachable only by direct slug/URL, gated by getProblemBySlug.
          visibility: { $ne: "contest" },
          // Content & Execution Architecture, Phase 1: a disabled problem
          // must disappear from normal discovery entirely. `$ne: false`
          // (not `enabled: true`) is deliberate — this is a `.lean()`
          // query, so Mongoose's `default: true` on the schema never gets
          // applied to documents fetched here; every problem seeded before
          // this field existed has no `enabled` key at all in Mongo, and
          // `{ enabled: true }` would wrongly exclude every one of them.
          // "missing or true" is the correct definition of "enabled" here,
          // and means no backfill migration is required for this field to
          // behave correctly on day one.
          enabled: { $ne: false },
        })
          // editorial.content is gated (solve-to-unlock / premium — see
          // backend/routes/editorial.js) and must only ever be served through
          // that dedicated, gated endpoint. Excludes BOTH the current
          // (hiddenTestcaseSet) and legacy (hiddentestcases, kept physically
          // in place post-migration for rollback safety — see
          // scripts/migrateHiddenTestcaseSet.js) hidden-testcase field names,
          // not just editorial content — otherwise every user gets the full
          // editorial for free on every problem-list load, bypassing the
          // gate entirely.
          .select("-hiddentestcases -hiddenTestcaseSet -editorial.content")
          .sort({ id: 1 })
          .lean();

        // xp is purely a function of difficulty (see withXP above), so it's
        // safe to bake into the cached payload — it only changes if a
        // problem's difficulty changes, which already invalidates this cache.
        return problems.map(withXP);
      }
    );

    res.set("X-Cache", cacheStatus);
    return res.json(problems);
  } catch (error) {
    req.log.error({ err: error }, "[Problems] getProblems failed");

    return res.status(500).json({
      message: "Failed to fetch problems",
    });
  }
};

export const getProblemBySlug = async (req, res) => {
  try {
    const slug = req.params.slug;

    const problem = await Problem.findOne({
      slug,
    })
      // Same reasoning as getProblems above — editorial.content must only
      // come from the gated GET /api/problems/:slug/editorial endpoint, and
      // both hidden-testcase field names (current + legacy) are excluded
      // for the same rollback-safety reason documented there.
      .select("-hiddentestcases -hiddenTestcaseSet -editorial.content")
      .lean();

    if (!problem) {
      return res.status(404).json({
        message: "Problem not found",
      });
    }

    // ── Availability gate (Content & Execution Architecture, Phase 1) ─────
    // A disabled problem must not be directly reachable by slug either —
    // same generic 404 shape as "doesn't exist" above, deliberately, so a
    // caller can't distinguish "never existed" from "exists but is
    // disabled." Checked before the contest gate below: a disabled problem
    // is disabled regardless of contest context.
    if (problem.enabled === false) {
      return res.status(404).json({
        message: "Problem not found",
      });
    }

    // ── Contest access gate (Fest Readiness Audit, P0-2) ──────────────────
    // Deliberately the SAME 404 shape as "not found" above — a caller who
    // isn't entitled to a private contest problem should not be able to
    // tell the difference between "doesn't exist" and "exists but you
    // can't see it yet." See services/contestProblemAccess.js for the
    // full policy (including what happens once the contest ends).
    if (problem.visibility === "contest") {
      const allowed = await canAccessContestProblem(slug, req.userDoc);
      if (!allowed) {
        return res.status(404).json({
          message: "Problem not found",
        });
      }
    }

    // `recommendedNext` also drives the Submission Experience's "Next Best
    // Problem" card — see utils/recommendNextProblem.js for the swap seam.
    // nextSlug is kept as its own field (rather than removed in favor of
    // recommendedNext.slug) purely for backward compatibility with existing
    // consumers (ProblemLayout's prev/next topbar nav) that only ever
    // needed the slug.
    //
    // solvedSlugs comes from req.userDoc (populated by optionalAuth when a
    // session is present — see problemRoutes.js) so the recommendation
    // never points back at something already solved. pathId comes from
    // ?path=<id>, set by LearningPathProblemItem when the user opened this
    // problem from inside a Learning Path (mirrors the existing ?contest=
    // pattern) — see ProblemDetailsPage.jsx.
    const solvedSlugs = req.userDoc?.solvedSlugs ?? [];
    const pathId = req.query.path || null;

    const [prevProblem, recommendedNext] =
      await Promise.all([
        Problem.findOne({
          id: { $lt: problem.id },
        })
          .select("slug")
          .sort({ id: -1 })
          .lean(),

        getNextBestProblem(problem, { solvedSlugs, pathId }),
      ]);

    return res.json({
      problem: withXP(problem),
      prevSlug: prevProblem?.slug ?? null,
      nextSlug: recommendedNext?.slug ?? null,
      nextBestProblem: recommendedNext,
    });
  } catch (error) {
    req.log.error({ err: error }, "[Problems] getProblemBySlug failed");

    return res.status(500).json({
      message: "Failed to fetch problem",
    });
  }
};

/**
 * GET /api/problems/stats/acceptance
 *
 * Returns { [problemSlug]: { accepted, total, rate } } across every user's
 * submissions. This is a global aggregate, not tied to req.userDoc, so it's
 * cached and served the same way to every caller — same shared-cache
 * reasoning as getProblems above (see utils/cache.js header comment).
 *
 * Problems with zero submissions are simply absent from the map — the
 * frontend treats a missing entry as "not enough data yet" rather than 0%.
 */
export const getAcceptanceRates = async (req, res) => {
  try {
    const { value: rates, cacheStatus } = await getOrSetCache(
      ACCEPTANCE_CACHE_KEY,
      ACCEPTANCE_CACHE_TTL_SECONDS,
      async () => {
        const grouped = await Submission.aggregate([
          {
            $group: {
              _id: "$problemSlug",
              total: { $sum: 1 },
              accepted: {
                $sum: { $cond: [{ $eq: ["$status", "Accepted"] }, 1, 0] },
              },
            },
          },
        ]);

        const map = {};
        for (const row of grouped) {
          if (!row._id || row.total === 0) continue;
          map[row._id] = {
            accepted: row.accepted,
            total: row.total,
            rate: Math.round((row.accepted / row.total) * 100),
          };
        }
        return map;
      }
    );

    res.set("X-Cache", cacheStatus);
    return res.json(rates);
  } catch (error) {
    req.log.error({ err: error }, "[Problems] getAcceptanceRates failed");

    return res.status(500).json({
      message: "Failed to fetch acceptance rates",
    });
  }
};