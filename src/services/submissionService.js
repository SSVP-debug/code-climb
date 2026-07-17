import { apiFetch } from "./api";

export async function getSubmissions(problemSlug = null) {
  
  let url = "/api/submissions";

  if (problemSlug) {
    url += `?problemSlug=${encodeURIComponent(problemSlug)}`;
  }

  return apiFetch(url);
}

// NOTE: createSubmission (POST /api/submissions) was removed. It used to
// let the client report its own grading result — status/passed/total —
// directly, which the backend saved without verifying it against a real
// Judge0 run (see docs/security-fixes/2026-07-solve-integrity.md). The
// backend now records every submission itself, server-side, inside
// POST /api/judge/submit (see src/services/judgeService.js), from the
// actual graded result. The route still exists but returns 410 Gone if
// called, so nothing needs to call it anymore.