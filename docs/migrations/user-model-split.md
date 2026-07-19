# User-model split — migration plan

Tracks Staff review §5/§9/#10: `User` (265 lines) carries auth linkage,
gamification state, three role-specific profile sub-objects, subscription/
billing state, referral state, impersonation state, and more — one document
with 20+ independently-changing concerns, and the single biggest source of
merge conflicts / accidental-write bugs as the team grows.

This is being done as a **phased, reversible migration**, not a big-bang
rewrite — a mistake in a one-shot cutover would silently corrupt XP,
streak, or achievement data for every user, with nothing to catch it until
someone notices their stats are wrong. Each phase below is independently
safe to ship and independently safe to pause on.

## The split

| New collection | Fields moved | Written from |
|---|---|---|
| `UserProgress` | `solvedSlugs`, `topicStats`, `activityDates`, `solvedDifficulty`, `recentActivity`, `currentStreak`, `totalXP`, `longestStreak`, `lastActivityDate`, `achievements`, `dailyHintLog`, `pdfDownloadLog`, `dailyChallengeHistory`, `problemNotes` | `progressController.js`, `controllers/judgeController.js` (via `recordVerifiedSubmission`), `dailyChallengeController.js`, `insightsController.js`, `routes/notes.js` |
| `UserSubscription` | `subscription`, `referralCode`, `referredBy`, `referralRewardDays` | `routes/billing.js`, `routes/referral.js` |
| `User` (unchanged, slimmed over time) | identity (`firebaseUid`, `email`, `displayName`, `username`), `role`, `impersonating`, `recruiterProfile`, `tpoProfile`, `recruiterSnapshot`, `profileSignature`, `certificates`, `pinnedProblems`, `leetcodeStats`, `emailPreferences` | everywhere (auth, admin, recruiter/TPO) |

`UserProgress` and `UserSubscription` were grouped by **write frequency and
writer identity**, not just topic: progress is the hottest write path in
the app (every graded submission touches it) and subscription is webhook-
driven and comparatively rare — the review's stated goal (avoid two
unrelated concerns write-conflicting on the same document) is best served
by not mixing those two with each other either, let alone with the auth/
identity fields every request reads.

## Phases

**Phase 0 — additive, non-breaking (this commit).**
- `models/UserProgress.js`, `models/UserSubscription.js` created.
- `scripts/backfillUserProgress.js`, `scripts/backfillUserSubscription.js`
  — idempotent, safe to run against production, safe to re-run on a
  schedule as a reconciliation pass.
- `services/userProgressService.js`, `services/userSubscriptionService.js`
  — dual-read/dual-write compatibility layer for the *next* phase to use.
- **Nothing reads from the new collections yet. `User` is still the only
  source of truth read by the app.** This phase is entirely inert from the
  running application's point of view — it can be merged and deployed with
  zero behavior change, which is the point: get the schema and backfill
  tooling reviewed and running before anything depends on it.

Run once after this lands, then again as needed:
```
cd backend
node scripts/backfillUserProgress.js
node scripts/backfillUserSubscription.js
```

**Phase 1 — dual-write, one consumer at a time.**
Migrate call sites from directly mutating `req.userDoc.<field>` +
`req.userDoc.save()` to calling `saveProgress(userId, patch)` /
`saveSubscription(userId, patch)` instead, which writes to `User` (still
authoritative for reads) *and* the new collection. Suggested order, easiest
and lowest-risk first:
1. ✅ `routes/referral.js`, `routes/billing.js` → `userSubscriptionService`
   (small blast radius, low write frequency, easy to eyeball-verify) — done.
   One write in `routes/billing.js`'s `/verify` handler (the referrer's
   `$inc` reward-day bonus, which touches a *different* user's document than
   the one attached to the request) is still a raw `User.updateOne` — it
   doesn't fit `saveSubscription`'s `$set`-only patch shape, so it'll drift
   in `UserSubscription` until the next `backfillUserSubscription.js`
   reconciliation pass. Documented inline at the call site.
2. ✅ `routes/notes.js` → `userProgressService` — done (narrow, single-field
   write). `routes/profileSign.js` was on this list in an earlier draft of
   this doc, but that was a mistake: it writes `profileSignature`, which
   the table above keeps on `User` permanently — it was never part of the
   `UserProgress` cluster (not in `PROGRESS_FIELDS`, not in the
   `UserProgress` schema). No migration needed there; left as a plain
   `userDoc.save()`.
3. ✅ `controllers/dailyChallengeController.js` → `userProgressService` — done.
   `controllers/insightsController.js` turned out to need no change: it
   reads `topicStats`/`solvedDifficulty`/`solvedSlugs` off `req.userDoc` to
   build the AI-coaching prompt but never calls `.save()` or mutates
   anything — there was no write to migrate. It still reads directly off
   `req.userDoc` rather than through `getProgress()`, which is fine for now
   since `User` is the authoritative read source through Phase 1 regardless
   of which path a reader goes through; it'll get a look during Phase 2
   (the read-flip) alongside every other direct-`req.userDoc` reader.
4. `controllers/progressController.js` and `controllers/judgeController.js`'s
   `recordVerifiedSubmission` path — **last**, on purpose: this is the
   hottest, highest-stakes write path (XP/streak/achievements on every
   submission), and by the time it's migrated the pattern will have been
   proven on four lower-stakes call sites first.

Each of the above should ship as its own PR with its own before/after
manual QA pass, not batched together.

**Phase 2 — verify, then flip reads.**
After Phase 1 has been running in production for a full cycle (suggest:
at least one billing cycle, so `UserSubscription` sees a real renewal/
cancellation, and at least a week of normal solving activity for
`UserProgress`), run a reconciliation check comparing `User`'s fields
against `UserProgress`/`UserSubscription` for drift. Once clean, flip
`READ_FROM_USER_PROGRESS_FIRST` / `READ_FROM_USER_SUBSCRIPTION_FIRST` to
`true` in the two services. `User` remains dual-written for one more
release as a rollback path.

**Phase 3 — drop the old fields.**
Once Phase 2 has been the live read path with no incidents for a release
cycle, stop writing to `User` for these fields and remove them from
`models/User.js`. This is the only phase that's meaningfully hard to
reverse, which is why it's last and gated on everything above.

## Explicitly out of scope for this delivery

Rewriting the 11 files that currently touch these fields directly. That's
Phase 1, done incrementally with a real database and real test runs behind
each step — not something to attempt in one pass without the ability to
run the app against live data.
