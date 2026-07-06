import Submission from "../models/Submission.js";

function toClientSubmission(doc) {
  return {
    id: doc._id.toString(),
    problemSlug: doc.problemSlug,
    problemTitle: doc.problemTitle,
    language: doc.language,
    status: doc.status,
    passed: doc.passed,
    total: doc.total,
    visiblePassed: doc.visiblePassed,
    hiddenPassed: doc.hiddenPassed,
    executionTime: doc.executionTime,
    expectedOutput: doc.expectedOutput,
    actualOutput: doc.actualOutput,
    time: new Date(doc.createdAt).toISOString(),
    date: new Date(doc.createdAt).toISOString().split("T")[0],
    createdAt: doc.createdAt,
  };
}

export async function createSubmission(req, res) {
  if (!req.userDoc) {
    return res.status(503).json({ error: "Database unavailable. Try again shortly." });
  }

  try {
    const submission = await Submission.create({
      userId: req.userDoc._id,
      ...req.body,
      statusDescription: req.body.statusDescription || req.body.status,
      judge0Time: req.body.judge0Time || req.body.executionTime,
      memory: req.body.memory || null,
    });

    return res.status(201).json(toClientSubmission(submission));
  } catch (err) {
    req.log.error({ err }, "[Submissions] createSubmission failed");
    return res.status(500).json({ error: "Failed to save submission. Try again." });
  }
}

export async function listSubmissions(req, res) {
  if (!req.userDoc) {
    return res.status(503).json({ error: "Database unavailable. Try again shortly." });
  }

  try {
    const { problemSlug } = req.query;

    const filter = { userId: req.userDoc._id };
    if (problemSlug) filter.problemSlug = problemSlug;

    const submissions = await Submission.find(filter)
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return res.json(submissions.map(toClientSubmission));
  } catch (err) {
    req.log.error({ err }, "[Submissions] listSubmissions failed");
    return res.status(500).json({ error: "Failed to fetch submissions. Try again." });
  }
}