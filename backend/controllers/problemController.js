import Problem from "../models/Problem.js";

const CACHE_TTL_MS = 5 * 60 * 1000;

let problemsCache = null;
let cacheExpiresAt = 0;

export function invalidateProblemsCache() {
  problemsCache = null;
  cacheExpiresAt = 0;
}

export const getProblems = async (req, res) => {
  try {
    const now = Date.now();

    if (problemsCache && now < cacheExpiresAt) {
      res.set("X-Cache", "HIT");
      return res.json(problemsCache);
    }

    const problems = await Problem.find({})
      .select("-hiddentestcases")
      .sort({ id: 1 })
      .lean();

    problemsCache = problems;
    cacheExpiresAt = now + CACHE_TTL_MS;

    res.set("X-Cache", "MISS");

    return res.json(problems);
  } catch (error) {
    console.error("[Problems]", error);

    if (problemsCache) {
      res.set("X-Cache", "STALE");
      return res.json(problemsCache);
    }

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
    console.error(
      "[Problems] getProblemBySlug:",
      error
    );

    return res.status(500).json({
      message: "Failed to fetch problem",
    });
  }
};