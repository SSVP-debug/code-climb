# E2E tests

Covers the one flow the Staff review explicitly asked for (§10, improvement
#17): **sign up → solve a problem → see XP update → appear on the
leaderboard.** This is a real end-to-end test — it exercises the actual
frontend, the actual backend (including the server-verified-solve logic
from the S1 fix), and actual Judge0 grading. Nothing here is mocked at the
network layer, on purpose: mocking the backend response would mean this
test stops being able to catch a regression in the exact code path (#1) it
exists to protect.

**This cannot be run with just `npm install` — read this whole file before
trying.**

## Why there's a login bypass page

The real app's only sign-in method is Google's OAuth popup
(`src/services/auth.js`). Playwright can't drive a real Google login popup
against real Google servers in an automated, non-interactive way — nobody
can, short of a fragile scripted UI-automation-of-Google's-own-login-page,
which Google actively discourages and can flag/lock the account.

The standard, documented pattern for testing a Firebase-Auth app is:

1. Run the [Firebase Auth Emulator](https://firebase.google.com/docs/emulator-suite)
   locally instead of talking to real Firebase.
2. Point the frontend at the emulator (`VITE_USE_FIREBASE_EMULATOR=true` —
   see `src/firebase/firebase.js`).
3. Sign in through a method the emulator supports regardless of what the
   *production* app exposes in its UI. This app doesn't have an
   email/password form, but the Firebase JS SDK's `signInWithEmailAndPassword`
   still works once `auth` is connected to the emulator — the emulator
   doesn't care that the real project only has Google enabled.
4. A tiny bypass page, `src/pages/E2ETestLoginPage.jsx`, calls exactly that.
   It is **only ever routed to** when `VITE_E2E_TESTING=true` is set at
   build time (see the gated `<Route>` in `src/App.jsx`) — a real
   deployment never sets that flag, so `/e2e-login` is simply unreachable
   in production, not just "unlinked."

## Prerequisites (all must be running before `npx playwright test`)

| # | What | Notes |
|---|---|---|
| 1 | **Firebase Auth Emulator** | `firebase emulators:start --only auth` (needs the Firebase CLI: `npm install -g firebase-tools`, plus a `firebase.json` with an `emulators.auth.port` of `9099` — not currently checked into this repo, add one if it doesn't exist yet). |
| 2 | **Backend**, pointed at the emulator | Set `FIREBASE_AUTH_EMULATOR_HOST=localhost:9099` in `backend/.env` before starting it — `firebase-admin`'s `verifyIdToken()` auto-detects this env var and validates tokens against the emulator instead of real Google certs. No code change needed, this is existing `firebase-admin` behavior. |
| 3 | **MongoDB**, ideally a throwaway/isolated database | See "Known gaps" below on why a shared staging DB is risky for the leaderboard assertion specifically. |
| 4 | **Judge0**, reachable | Either the public `ce.judge0.com` (fine for occasional local runs, don't hammer it) or self-hosted (see `docs/judge0-setup.md`) — `two-sum` is graded for real. |
| 5 | **Frontend**, built/served with the E2E flags | `VITE_E2E_TESTING=true VITE_USE_FIREBASE_EMULATOR=true npm run dev` |
| 6 | **The `two-sum` problem seeded** | `node backend/scripts/seedProblems.js` (or `importProblems.js`) if it isn't already in the DB. |

Then, from the repo root:

```bash
npx playwright install chromium   # first time only
npx playwright test
```

Override the frontend URL with `E2E_BASE_URL` if it's not on the Vite
default (`http://localhost:5173`).

## What the test actually does

1. Creates a brand-new Firebase user directly against the emulator's REST
   API (`e2e/fixtures/testUser.js`) — Node-side, before the browser even
   opens, so every run starts from a clean, isolated identity.
2. Navigates to `/e2e-login?email=...&password=...`, which signs in via
   `signInWithEmailAndPassword` and lands on `/dashboard`.
3. Asserts XP starts at 0 (a `data-testid="dashboard-xp"` element).
4. Opens `/problems/two-sum`, types a correct Python solution into Monaco,
   clicks `data-testid="submit-code-button"`, and waits for
   `data-testid="submission-result-banner"` to show `data-accepted="true"`
   — this is real Judge0 grading, hence the generous timeouts.
5. Re-checks the dashboard and asserts XP is now `> 0`.
6. Opens `/leaderboard` and asserts a row with this user's `displayName`
   is visible.

A few `data-testid` attributes were added to make these selectors robust
instead of matching button text — several of them (Run/Submit labels,
"Accepted" banner copy) are theme-dependent strings from
`src/themes/*.js` and would break the moment someone edits a theme's
copy, which has nothing to do with this test's actual purpose.

## Known gaps — read before trusting a green run

- **The leaderboard assertion assumes a small user count.** `/leaderboard`
  fetches `page=1&limit=20` sorted by XP. A fresh account with ~50 XP from
  one Easy solve genuinely might not be in the top 20 against a database
  with a lot of accumulated real or seeded XP. This test is only reliable
  against an isolated/freshly-seeded test database, **not** a shared
  staging environment with real accumulated leaderboard data. Don't point
  `E2E_BASE_URL`/the backend at staging and expect this to be stable.
- **No CI wiring yet.** `.github/workflows/ci.yml` doesn't run this —
  spinning up Mongo + the Firebase emulator + Judge0 + frontend + backend
  in a single CI job is a real, separate piece of infrastructure work
  (most likely a `docker-compose`-based job), not something to bolt on
  silently as a side effect of adding the test files. Wiring that up is
  the natural next step once this has been run locally and confirmed
  stable a few times.
- **No `firebase.json`** exists yet in this repo to configure the emulator
  suite (port, project ID). Add one before the emulator prerequisite above
  will actually start on the expected port.
- **Untested by me.** I (the assistant that wrote this) don't have
  network access or a browser in this environment, so none of the above
  has actually been executed — it's built from documented Firebase Auth
  Emulator + Playwright patterns and a careful read of this app's real
  code (starter code, routes, component structure), not a passing run.
  Treat first execution as a debugging session, not a rubber stamp.
