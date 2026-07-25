import Reflection from "../models/Reflection.js";
import Submission from "../models/Submission.js";

// ── POST /api/reflections ───────────────────────────────────────────────────
// Records the one-click "how difficult did this feel?" rating shown after
// an Accepted submission. Intentionally minimal: no analytics/rollups yet
// (per spec) — this just persists the rating so it's available later.
//
// The submission is looked up (scoped to the caller's own userId) rather
// than trusted from the client, and must actually be Accepted — this
// mirrors the "never trust client-claimed state" pattern used throughout
// progress/XP (see docs/security-fixes/2026-07-solve-integrity.md); a
// reflection tied to a submission that was never a real accepted solve
// wouldn't help anyone anyway.
export async function createReflection(req, res) {
  try {
    if (!req.userDoc) {
      return res.status(503).json({ error: "Database unavailable. Try again shortly." });
    }

    const { submissionId, difficultyRating } = req.body;

    const submission = await Submission.findOne({
      _id: submissionId,
      userId: req.userDoc._id,
    })
      .select("problemSlug status")
      .lean();

    if (!submission) {
      return res.status(404).json({ error: "Submission not found." });
    }

    if (submission.status !== "Accepted") {
      return res.status(400).json({
        error: "Reflections can only be recorded for accepted submissions.",
      });
    }

    try {
      await Reflection.create({
        userId: req.userDoc._id,
        submissionId,
        problemSlug: submission.problemSlug,
        difficultyRating,
      });
    } catch (err) {
      // Duplicate key (11000) = this exact submission was already reflected
      // on (e.g. a retried request, or the user double-clicked). Since the
      // UI never blocks on this and only wants one rating to stick, treat
      // it as a successful no-op rather than an error the client needs to
      // handle.
      if (err.code !== 11000) throw err;
    }

    return res.status(201).json({ saved: true });
  } catch (err) {
    req.log?.error?.({ err }, "[Reflections] createReflection failed");
    return res.status(500).json({ error: "Failed to save reflection." });
  }
}
