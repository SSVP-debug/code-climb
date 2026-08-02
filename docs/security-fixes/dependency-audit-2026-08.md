# Dependency audit — 4 advisories reviewed, all deferred (no safe fix exists yet)

**Status:** Reviewed 2026-08-02. No code changes made — see rationale below.
**Source:** `npm audit` (frontend + backend), run as part of a general codebase audit.

## The problem

`npm audit` flags 4 advisories across frontend and backend. For every one of
them, the only available fix requires `npm audit fix --force` and downgrades
a dependency we actively rely on — there is no patched release yet that's
compatible with our current major version.

| Package | Severity | "Fix" offered | Why it's not safe to take |
|---|---|---|---|
| `react-router-dom` | High (CSRF bypass, RSC mode only) | Downgrade `7.15.1` → `7.11.0` | We don't use RSC mode (this is a Vite SPA, not a React Server Components app) — real exposure is low. The fix is a 4-minor-version *downgrade*, flagged semver-major, and risks breaking routing behavior we depend on today. |
| `dompurify` | Moderate | Requires `monaco-editor` on a `dev`-prerelease build (`>=0.54.0-dev-...`) | Not a real production dependency version. `dompurify` isn't even a direct or confirmed-reachable dependency in our lockfile — it shows up as a dangling optional peer with no package in our graph declaring it as required. |
| `monaco-editor` | Low | Same dev-prerelease requirement as above | Same issue — no stable fix exists yet. Monaco is our core code editor; forcing an unstable build here is a much bigger risk than the advisory itself. |
| `firebase-admin` chain (`@google-cloud/firestore`, `@google-cloud/storage`, `gaxios`, `google-gax`, `retry-request`, `teeny-request`, `uuid`) | Moderate (buffer bounds check in `uuid`) | Downgrade `firebase-admin` `13.10.0` → `10.3.0` | `firebase-admin` runs 100% of our authentication (`middleware/auth.js`). A 3-major-version downgrade is a categorically bigger risk than a moderate `uuid` bounds-check bug in a Firestore client we don't even use (we're Mongo-only — see `docs/architecture.md`). |

## The decision

**Deferred, not ignored.** None of these get a forced downgrade. Instead:

- Re-run `npm audit` (frontend and backend) monthly, or whenever bumping
  `react-router-dom`, `monaco-editor`, `@monaco-editor/react`, or
  `firebase-admin` for unrelated reasons — check if a real non-breaking patch
  has landed each time.
- If `react-router-dom` CSRF-in-RSC-mode becomes a real concern (e.g. if RSC
  mode is ever adopted), revisit immediately rather than waiting for the
  monthly check.
- One safe, in-range refresh *was* applied: backend's `package-lock.json`
  picked up patch/minor bumps to `zod`, `mongoose`, and `@standard-schema/spec`
  during this audit — no `package.json` changes, no breaking changes, kept.

## What's intentionally out of scope

- Forcing any of the four flagged packages to their "fix" version — see table
  above.
- Auditing whether `dompurify` is reachable at all at runtime — worth a
  follow-up if someone has time, since it may be entirely dead weight in the
  dependency tree.