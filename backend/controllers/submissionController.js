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
    time: new Date(doc.createdAt).toLocaleTimeString(),
    date: new Date(doc.createdAt).toLocaleDateString(),
    createdAt: doc.createdAt,
  };
}

export async function createSubmission(req, res) {
  const submission = await Submission.create({
    userId: req.userDoc._id,
    ...req.body,
    statusDescription: parsed.status,
    judge0Time: parsed.time,
    memory: parsed.memory,
  });

  res.status(201).json(toClientSubmission(submission));
}

export async function listSubmissions(req, res) {
  const { problemSlug } = req.query;

  const filter = {
    userId: req.userDoc._id,
  };

  if (problemSlug) {
    filter.problemSlug = problemSlug;
  }

  const submissions = await Submission.find(filter)
    .sort({ createdAt: -1 })
    .limit(100);

  res.json(submissions.map(toClientSubmission));
}
