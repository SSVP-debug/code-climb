import { Router } from "express";
import {
  listSubmissions,
  createSubmission,
} from "../controllers/submissionController.js";

const router = Router();

// ── Routes ────────────────────────────────────────────────────────────────────
router.get("/", listSubmissions);

// POST /api/submissions — intentionally no longer accepts a body.
//
// Previously this accepted a client-supplied { status, passed, total, ... }
// and persisted it verbatim after only Zod shape validation — meaning any
// authenticated user could fabricate an "Accepted" submission without ever
// running their code through Judge0. Submissions are now recorded
// server-side, exclusively inside POST /api/judge/submit, from the actual
// graded result (see controllers/submissionController.js:recordVerifiedSubmission
// and routes/judge.js). This route is kept mounted (rather than removed
// outright) so any client still calling it gets a clear, actionable 410
// instead of a silent 404.
router.post("/", createSubmission);

export default router;
