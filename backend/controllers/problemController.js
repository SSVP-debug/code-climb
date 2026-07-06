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
          .select("-hiddentestcases")
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

    const problems = await Problem.find({})
      .select("slug")
      .sort({ id: 1 })
      .lean();

    const index = problems.findIndex(
      (p) => p.slug === slug
    );

    if (index === -1) {
      return res.status(404).json({
        message: "Problem not found",
      });
    }

    const problem = await Problem.findOne({
      slug,
    })
      .select("-hiddentestcases")
      .lean();

    return res.json({
      problem,
      prevSlug:
        index > 0
          ? problems[index - 1].slug
          : null,
      nextSlug:
        index < problems.length - 1
          ? problems[index + 1].slug
          : null,
    });
  } catch (error) {
    req.log.error({ err: error }, "[Problems] getProblemBySlug failed");

    return res.status(500).json({
      message: "Failed to fetch problem",
    });
  }
};