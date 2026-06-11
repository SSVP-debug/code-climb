import Problem from "../models/Problem.js";

export const getProblems = async (req, res) => {
  try {
    const problems = await Problem.find({})
      .select("-hiddentestcases")
      .sort({ id: 1 });

    res.json(problems);
  } catch (error) {
    console.error("Error fetching problems:", error);

    res.status(500).json({
      message: "Failed to fetch problems",
    });
  }
};

export const getProblemBySlug = async (req, res) => {
  try {
    const problem = await Problem.findOne({
      slug: req.params.slug,
    }).select("-hiddentestcases");

    if (!problem) {
      return res.status(404).json({
        message: "Problem not found",
      });
    }

    res.json(problem);
  } catch (error) {
    console.error("Error fetching problem:", error);

    res.status(500).json({
      message: "Failed to fetch problem",
    });
  }
};