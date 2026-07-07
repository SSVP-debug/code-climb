# Judge0 Setup

Code Club runs submitted code through [Judge0](https://judge0.com), an
open-source code execution engine. This doc covers configuring which Judge0
instance the backend talks to, and the two supported production paths.

## Environment variable

Everything is controlled by one variable in `backend/.env`:

```
JUDGE0_API_URL=https://ce.judge0.com/submissions?base64_encoded=true&wait=true
JUDGE0_API_KEY=
JUDGE0_RAPIDAPI_KEY=
```

If `JUDGE0_API_URL` is unset, the backend falls back to the public
`ce.judge0.com` instance and logs a warning on startup (see
`backend/config/judge0.js`). That instance is fine for local development but
is rate-limited and shared with everyone else using it — **do not run
production traffic against it.**

`base64_encoded=true` and `wait=true` in the URL don't actually need to be
set by hand — `backend/controllers/compilerController.js` forces both on
every request regardless of what's in the URL (see "Why base64 is forced"
below). They're included in the example above just so the URL is
self-documenting.

## Option A: Self-hosted Judge0 (Docker) — recommended for production

This is the recommended path once real student traffic starts, since it
removes the rate-limit ceiling and the per-request cost of a third-party API.

1. On your server (a small Railway/DigitalOcean/EC2 box works — Judge0 itself
   is lightweight, most of the weight is in the isolated execution workers):

   ```bash
   git clone https://github.com/judge0/judge0.git
   cd judge0
   docker-compose up -d
   ```

2. Judge0 will be reachable at `http://<your-server>:2358`. Point the backend
   at it:

   ```
   JUDGE0_API_URL=http://<your-server>:2358/submissions
   ```

3. Leave `JUDGE0_API_KEY` and `JUDGE0_RAPIDAPI_KEY` blank — self-hosted
   instances don't require an API key by default. If you've configured
   Judge0's own `AUTHN_TOKEN` (see Judge0's `docker-compose.yml`), you'll
   need to add header support to `fetchJudge0()` — this isn't wired up yet
   (see "Known gaps" below).

4. Put the instance behind HTTPS (a reverse proxy like Caddy or nginx, or
   Railway's own TLS termination) before using it in production — Judge0
   itself doesn't terminate TLS.

## Option B: RapidAPI-hosted Judge0 — faster to set up, costs per request

Good for getting to production quickly without managing a Docker host.

1. Subscribe to [Judge0 CE on RapidAPI](https://rapidapi.com/judge0-official/api/judge0-ce).
2. Set:

   ```
   JUDGE0_API_URL=https://judge0-ce.p.rapidapi.com/submissions
   JUDGE0_RAPIDAPI_KEY=<your RapidAPI key>
   ```

3. **Known gap:** `fetchJudge0()` in `backend/controllers/compilerController.js`
   only sends a `Content-Type: application/json` header today — it does not
   yet read `JUDGE0_RAPIDAPI_KEY` and attach the `X-RapidAPI-Key` /
   `X-RapidAPI-Host` headers RapidAPI requires. Setting the env var alone
   will not work until that's added. This is a small, isolated change (a
   couple of conditional header lines in `fetchJudge0()`), tracked as a
   follow-up in `docs/phase8-progress.md` rather than done as part of this
   docs pass.

## Reliability behavior (already built)

- **Startup validation** (`backend/config/judge0.js`): validates
  `JUDGE0_API_URL` is a well-formed URL, warns loudly if production is
  pointed at the public `ce.judge0.com` instance, and does a non-blocking
  reachability check against the instance's origin. None of this ever blocks
  server startup or crashes the process — a misconfigured Judge0 should
  produce a loud log line, not a failed deploy.
- **Retry with backoff** (`backend/controllers/compilerController.js`): up to
  3 attempts per request. Only genuinely transient failures are retried —
  5xx responses and network-level errors (timeout, connection refused, DNS)
  — with a linear backoff (`300ms * attempt`). A 4xx response is treated as
  a malformed request on our side and fails immediately without retrying,
  since retrying it would just fail the same way three times.
- **Why base64 is forced:** if `JUDGE0_API_URL` in the environment omits
  `base64_encoded=true`, most hosted Judge0 instances default to expecting
  base64-encoded input anyway, which caused `"some attributes cannot be
  converted to UTF-8"` errors when plain text was sent. The fix:
  `fetchJudge0()` base64-encodes all input fields and forces
  `base64_encoded=true` in the URL unconditionally, then decodes the
  response fields (`stdout`, `stderr`, `compile_output`, `message`) back to
  plain strings before returning — so every caller of `fetchJudge0()` /
  `callJudge0()` is unaffected by the encoding detail.

## Known gaps

- RapidAPI auth headers aren't implemented yet (see Option B above) — env
  vars exist as placeholders in `.env.example` but aren't read anywhere.
- No circuit breaker / health-based fallback between a self-hosted instance
  and a backup — if the configured instance is down, requests fail (after
  retries) rather than failing over to a secondary URL.