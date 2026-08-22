# Solve-integrity fix — progress and submissions were client-authoritative

**Status:** Fixed 2026-07-17
**Severity:** Critical (data integrity, not RCE/data-exposure)
**Source:** flagged as finding S1 in the July 2026 staff engineering review.

## The problem

Two endpoints trusted the client for data that should only ever come from
the server's own grading run:

1. **`POST /api/submissions`** (`submissionController.createSubmission`) did
   `Submission.create({ userId, ...req.body })`. Zod validated the *shape*
   of `status`/`passed`/`total`/`expectedOutput`/`actualOutput`, but nothing
   validated their *truthfulness*. Any authenticated user could POST
   `{ status: "Accepted", passed: total, problemSlug: "any-real-slug" }`
   directly and have it saved as if Judge0 had graded it.

2. **`PUT /api/progress`** (`progressController.putProgress`) accepted a
   `solvedSlugs` array and saved it (almost) verbatim. `routes/progress.js`
   already had a `validateSlugs` middleware — but it only checked that each
   slug *existed in the Problem catalog*, not that *this user* had ever
   solved it. `{ solvedSlugs: [...every real slug in the catalog] }` sailed
   straight through, because every one of those slugs is real. The same
   gap applied to `topicStats`, `solvedDifficulty`, and `activityDates` —
   all client-supplied, all trusted.

XP itself was already recomputed server-side from `solvedSlugs` — the
right instinct, applied one layer too late. The *inputs* to that
computation were exactly what was forgeable.

Because this app is explicitly recruiter/TPO-facing (public profiles,
certificates, a "profile signature" described elsewhere in the codebase as
proof the data wasn't tampered with), this wasn't just a leaderboard
vanity-metric bug.

## The fix

**Submissions are now written in exactly one place:** inside
`routes/judge.js`'s `submitHandler`, immediately after a real Judge0-graded
run, via `controllers/submissionController.js`'s `recordVerifiedSubmission`.
Every field written — status, passed/total, visible/hidden split,
expected/actual output — is a value the server just computed, not a value
the client sent. The write is `await`-ed before the HTTP response is sent,
so the Submission row is guaranteed to exist by the time the client's next
request (the progress update) can reference it.

`POST /api/submissions` now returns `410 Gone`. It's kept mounted (rather
than deleted outright) so a stray caller gets a clear, actionable error
instead of a silent 404.

**`PUT /api/progress` no longer trusts `solvedSlugs` (or the maps derived
from it) directly.** A new `verifyAgainstSubmissions` middleware
(`routes/progress.js`) checks every newly-claimed slug against real
`Submission` documents with `status: "Accepted"` for that user. Only slugs
that pass this check ever reach `putProgress`, via `req.verifiedNewSlugs`.
Anything else is dropped and logged as a possible tampering attempt — the
request still succeeds (HTTP 200), it just silently doesn't count the
unverified slugs, so a client sending a mix of real and fabricated slugs
still makes progress on the real ones.

`putProgress` was also changed to **derive** `topicStats`, `solvedDifficulty`,
and `recentActivity` from the `Problem` catalog for each newly-verified
slug, rather than trusting the client's own maps — the same trust gap
existed one level down (a client could claim a Hard problem was Easy to
skew stats even without a fake `solvedSlugs` entry). `activityDates` only
ever gains "today," and only when there's at least one newly-verified
solve to justify it — a client can no longer backfill arbitrary past dates
to inflate a streak.

`leetcodeUsername` is the one field still taken directly from the request
body it's self-reported by design elsewhere in the codebase (it doesn't
feed XP or any verified stat), so there's no trust boundary to enforce.

## Incidental fix discovered while implementing this

Several files compared `Submission.status` against the literal string
`"Accepted 🎉"`, while the value actually stored (and returned by
`/api/judge/submit`) is plain `"Accepted"` (see `models/Submission.js`'s
`SUBMISSION_STATUSES` enum). This meant:

- `ProblemDetailsPage.jsx`'s `handleSubmitCode` never actually called
  `markProblemSolved()` on a real accepted solve — the comparison never
  matched, so `PUT /api/progress` was never triggered from normal UI
  Submit clicks in the first place (only shows up if something else calls
  it, e.g. Settings/leetcode sync).
- `Analytics.jsx` and `AdvancedStatsSection.jsx`'s acceptance-rate /
  average-runtime stats always computed against zero "accepted"
  submissions.
- `publicProfileController.js`'s recruiter-facing language breakdown
  (`fetchProfile`) always queried zero accepted submissions.

All five were corrected to compare against `"Accepted"` as part of this
change, since they sit directly in the same code path being hardened here
and the fix (and the security fix above) would otherwise have had no
reachable code path to protect. `src/utils/statusMessages.js`'s
`isAccepted()` helper was already correct — the other call sites just
weren't using it.

## What's intentionally out of scope

- `Submission.code` retention/redaction — unrelated, already handled by
  `scripts/archiveOldSubmissionCode.js`.
- Full server-side derivation of `activityDates`/streak history from
  `Submission.createdAt` timestamps (rather than "today, if verified") —
  would let a resync fully reconstruct history, but adds a heavier query;
  not needed for the immediate integrity gap.
- Razorpay webhook event handling (tracked separately — see the "Top 20
  Improvements" list, item 4, in the main engineering review).
