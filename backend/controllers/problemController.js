import Problem from "../models/Problem.js";
import Submission from "../models/Submission.js";
import { getOrSetCache, invalidateCache } from "../utils/cache.js";
import { XP_BY_DIFFICULTY } from "../utils/computeXP.js";
import { getNextBestProblem } from "../utils/recommendNextProblem.js";

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
        const problems = await Problem.find({})
          // editorial.content is gated (solve-to-unlock / premium — see
          // backend/routes/editorial.js) and must only ever be served through
          // that dedicated, gated endpoint. Excluding it here too, not just
          // hiddentestcases — otherwise every user gets the full editorial
          // for free on every problem-list load, bypassing the gate entirely.
          .select("-hiddentestcases -editorial.content")
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
      // come from the gated GET /api/problems/:slug/editorial endpoint.
      .select("-hiddentestcases -editorial.content")
      .lean();

    if (!problem) {
      return res.status(404).json({
        message: "Problem not found",
      });
    }

    // `recommendedNext` also drives the Submission Experience's "Next Best
    // Problem" card — see utils/recommendNextProblem.js for the swap seam.
    // nextSlug is kept as its own field (rather than removed in favor of
    // recommendedNext.slug) purely for backward compatibility with existing
    // consumers (ProblemLayout's prev/next topbar nav) that only ever
    // needed the slug.
    const [prevProblem, recommendedNext] =
      await Promise.all([
        Problem.findOne({
          id: { $lt: problem.id },
        })
          .select("slug")
          .sort({ id: -1 })
          .lean(),

        getNextBestProblem(problem),
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