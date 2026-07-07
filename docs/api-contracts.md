# API Contracts

Base URL: `VITE_API_URL` (frontend) / `FRONTEND_URL` (backend CORS allowlist).
Locally: `http://localhost:5000`.

All routes return JSON. Authenticated routes expect `Authorization: Bearer <Firebase ID token>`.
"Auth" below means `requireAuth` middleware runs first — it verifies the Firebase token and attaches the matching MongoDB user as `req.userDoc` (creating one on first sign-in).

Rate limiters, from `backend/middleware/rateLimiter.js`, all key by `userId` (not IP):
- **apiLimiter** — general per-user limit, applied to most authenticated routes
- **aiLimiter** — stricter shared quota for Claude-backed routes (hints, insights, interview)
- **compilerLimiter** — separate limit for the `/api/compiler` run endpoint

This file only documents routes actually mounted in `backend/server.js`. Three route files (`editorial.js`, `premiumFeatures.js`, `health.js`) exist in `backend/routes/` but are not mounted and have no frontend caller — they're dead code, not part of the live API surface, and are excluded here. See `docs/phase8-progress.md` for status.

---

## Public (no auth)

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | Liveness check (inline in `server.js`, excluded from request logging). |
| GET | `/api/problems` | List all problems. |
| GET | `/api/problems/:slug` | Single problem by slug. |
| GET | `/api/stats` | Landing-page social-proof numbers (total users, problems solved, etc). |
| GET | `/api/leaderboard/global` | Global XP leaderboard. |
| GET | `/api/leaderboard/college` | Leaderboard scoped to the caller's college domain. |
| GET | `/api/leaderboard/domains` | List of college domains with active leaderboards. |
| GET | `/api/weekly/current` | Current weekly challenge. |
| GET | `/api/public/u/:username` | Public profile page data for a shareable username. |
| GET | `/api/cert/verify/:code` | Verify a certificate by its public code (recruiter-facing, no login required). |
| GET | `/api/cert/:code/pdf` | Download the certificate PDF for a verified code. |
| GET | `/api/recruiter/verify/:username` | Recruiter-facing candidate profile verification (signature-checked, no login required). |
| GET | `/api/billing/plans` | Public pricing list — returns `{ enabled: false, message }` while `MONETIZATION_ENABLED=false`. |

## Auth (student-facing, apiLimiter unless noted)

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/users/me` | Current user profile. |
| PATCH | `/api/users/me` | Update current user profile. |
| GET | `/api/progress` | Solved slugs, streak, topic stats, difficulty breakdown. |
| PUT | `/api/progress` | Update progress after a solve. |
| GET | `/api/submissions` | List the caller's submissions. |
| POST | `/api/submissions` | Create a submission record. |
| POST | `/api/compiler/run` *(compilerLimiter)* | Run code against custom stdin via Judge0 (no grading). |
| POST | `/api/judge/run` | Run code against visible test cases. |
| POST | `/api/judge/submit` | Submit code — graded against visible + hidden test cases, returns Accepted/Wrong Answer/Runtime Error/Compilation Error. |
| POST | `/api/hints` *(aiLimiter)* | AI-generated hint for a problem (Claude). |
| GET | `/api/notes/:slug` | Get the caller's personal notes for a problem. |
| PUT | `/api/notes/:slug` | Save notes for a problem. |
| DELETE | `/api/notes/:slug` | Delete notes for a problem. |
| GET | `/api/profile/pdf` | Generate a recruiter-ready profile PDF. |
| POST | `/api/profile/sign` | Sign/refresh the HMAC profile-verification hash. |
| GET | `/api/init` | Single boot call — replaces sequential initProgress + getProgress + getSubmissions calls on app load. |
| GET | `/api/referral/my-code` | Caller's referral code. |
| POST | `/api/referral/apply` | Apply a referral code (one-time, on signup). |
| GET | `/api/referral/stats` | Referral stats (redemptions, reward days earned). |
| GET | `/api/leetcode/fetch` | Fetch a linked LeetCode profile's public stats. |
| PUT | `/api/leetcode/stats` | Save imported LeetCode stats to the user profile. |
| GET | `/api/insights` *(aiLimiter)* | AI-generated dashboard insights (Claude). |
| POST | `/api/daily-challenge` | Submit/claim the daily challenge. |
| GET | `/api/cert/tracks` | List certification tracks and the caller's progress toward each. |
| POST | `/api/cert/claim/:trackId` | Claim a completed certification track. |
| GET | `/api/contests` | List contests visible to the caller. |
| POST | `/api/contests` *(role: admin, tpo)* | Create a public contest. |
| POST | `/api/contests/private` *(role: tpo, admin)* | Create a private/invite-only contest. |
| POST | `/api/contests/join-private` | Join a private contest via invite code. |
| GET | `/api/contests/:id` | Contest detail. |
| POST | `/api/contests/:id/join` | Join a public contest. |
| POST | `/api/contests/:id/solve` | Record a solve within a contest window. |
| GET | `/api/assignments/student` | Student's view of TPO-assigned problem sets for their college domain (`B2B_ENABLED`-gated; returns `{ enabled: false, assignments: [] }` while off). |

## Auth (B2B / TPO — `B2B_ENABLED`-gated)

Mounted at `/api/tpo`. All routes return `{ enabled: false, message }` while `B2B_ENABLED=false`, and `403` if the caller's `role` isn't `"tpo"` (except `/register`, which is how a user becomes one).

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/tpo/register` | Convert the caller's account to a TPO account (requires an institutional email domain — rejects gmail/yahoo/outlook). |
| GET | `/api/tpo/me` | Current TPO's profile + college info. |
| GET | `/api/tpo/students` | All students matched by the TPO's college email domain. |
| GET | `/api/tpo/dashboard` | Aggregated class stats + a 0–100 "placement readiness score" heuristic. |
| POST | `/api/tpo/assignments` | Create a problem-set assignment for the TPO's college. |
| GET | `/api/tpo/assignments` | List assignments with per-student completion %. |
| GET | `/api/tpo/report/pdf` | Class performance PDF report (requires `pdfkit` installed). |

## Auth (Billing — `MONETIZATION_ENABLED`-gated)

Mounted at `/api/billing`. All routes except `/plans` (public, listed above) and `/subscription` return `{ enabled: false, message }` while `MONETIZATION_ENABLED=false`.

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/billing/subscription` | Caller's current plan/status (works regardless of the flag — reports "free"/premium correctly either way). |
| POST | `/api/billing/create-order` | Create a Razorpay order for a plan. |
| POST | `/api/billing/verify` | Verify Razorpay payment signature, activate the plan. **See known gap in `docs/database-schema.md` — the `User` model has no `subscription` field, so this does not currently persist.** |
| POST | `/api/billing/cancel` | Cancel recurring subscription (access continues until expiry). |
| POST | `/api/billing/webhook` | Razorpay webhook receiver. **See known gap in `docs/architecture.md` — needs raw-body middleware split out before this works correctly.** |

## Auth (Premium AI feature)

Mounted at `/api/interview`, aiLimiter. Each route additionally runs `requirePremium` (from `backend/middleware/premiumGate.js`).

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/interview/start` | Begin a 45-minute timed mock-interview session for a problem. |
| POST | `/api/interview/ask` | AI interviewer asks a follow-up question. |
| POST | `/api/interview/submit` | Submit the final solution within the session. |
| GET | `/api/interview/:sessionId` | Session status (time remaining, etc). Sessions are in-memory — they don't survive a backend restart. |

## Auth (Recruiter portal)

Mounted at `/api/recruiter` and `/api/candidate/tests`.

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/recruiter/register` | Register a recruiter account. |
| GET | `/api/recruiter/candidates` *(role: recruiter, admin)* | Search/browse candidate profiles. |
| POST | `/api/recruiter/skills-test` *(role: recruiter, admin)* | Create a timed skills test for a candidate. |
| GET | `/api/recruiter/skills-test/:id` *(role: recruiter, admin)* | Get a skills test's status/results. |
| GET | `/api/candidate/tests` | Candidate's view of assigned skills tests. |
| POST | `/api/candidate/tests/:id/start` | Start a skills test (starts the timer). |
| POST | `/api/candidate/tests/:id/submit` | Submit a skills test. |

## Auth (Ambassador program)

Mounted at `/api/ambassador`.

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/ambassador/apply` | Apply to be a campus ambassador. |
| GET | `/api/ambassador/status` | Caller's application status. |
| GET | `/api/ambassador/dashboard` | Ambassador's referral/milestone dashboard. |
| POST | `/api/ambassador/claim-milestone` | Claim a completed milestone reward. |
| GET | `/api/ambassador/pending` *(role: admin)* | Pending applications queue. |
| POST | `/api/ambassador/:id/review` *(role: admin)* | Approve/reject an application. |

---

## Known gaps affecting this contract

- **`/api/tpo`, `/api/billing`, `/api/interview`** were fully built but not mounted in `server.js` until this pass (Phase 8, Batch E) — previously every request to them 404'd despite live frontend pages calling them.
- **`/api/billing/verify`** doesn't persist the subscription it reports activating — see `docs/database-schema.md`.
- **`/api/billing/webhook`** needs raw-body middleware — see `docs/architecture.md`.