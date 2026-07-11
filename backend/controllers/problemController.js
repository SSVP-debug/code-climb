import Problem from "../models/Problem.js";
import { getOrSetCache, invalidateCache } from "../utils/cache.js";

const PROBLEMS_CACHE_KEY = "problems:all";
const CACHE_TTL_SECONDS = 5 * 60; // 5 minutes — unchanged from the original TTL

/**
 * Call this after any problem create/update/delete (e.g. admin routes,
 * seed scripts) so the next GET /api/problems reflects the change instead
 * of waiting out the TTL.
 */
export async function invalidateProblemsCache() {
  await invalidateCache(PROBLEMS_CACHE_KEY);
}

export const getProblems = async (req, res) => {
  try {
    const { value: problems, cacheStatus } = await getOrSetCache(
      PROBLEMS_CACHE_KEY,
      CACHE_TTL_SECONDS,
      async () =>
        Problem.find({})
          // editorial.content is gated (solve-to-unlock / premium — see
          // backend/routes/editorial.js) and must only ever be served through
          // that dedicated, gated endpoint. Excluding it here too, not just
          // hiddentestcases — otherwise every user gets the full editorial
          // for free on every problem-list load, bypassing the gate entirely.
          .select("-hiddentestcases -editorial.content")
          .sort({ id: 1 })
          .lean()
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

    const [prevProblem, nextProblem] =
      await Promise.all([
        Problem.findOne({
          id: { $lt: problem.id },
        })
          .select("slug")
          .sort({ id: -1 })
          .lean(),

        Problem.findOne({
          id: { $gt: problem.id },
        })
          .select("slug")
          .sort({ id: 1 })
          .lean(),
      ]);

    return res.json({
      problem,
      prevSlug: prevProblem?.slug ?? null,
      nextSlug: nextProblem?.slug ?? null,
    });
  } catch (error) {
    req.log.error({ err: error }, "[Problems] getProblemBySlug failed");

    return res.status(500).json({
      message: "Failed to fetch problem",
    });
  }
};