# Contributing to Code Club

## Prerequisites

- Node.js 20+
- A MongoDB Atlas account (free tier is fine)
- A Firebase project (for Auth)
- A Judge0 API endpoint (public `ce.judge0.com` for dev — see `docs/judge0-setup.md` for production options)
- Optional, for the full feature set: Redis (Railway add-on or Upstash), an Anthropic API key (AI hints/insights/interview mode), Razorpay keys (billing — feature-flagged off by default), a Sentry DSN (error monitoring). All four degrade gracefully and log a clear warning if left unset — none are required to run the app locally.

---

## Local Setup

### 1. Clone & install

```bash
git clone https://github.com/SSVP-debug/code-club.git
cd code-club
npm install          # frontend
cd backend && npm install  # backend
```

### 2. Configure environment variables

**Frontend** — copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Fill in your Firebase project values from Firebase Console → Project Settings → General.

**Backend** — copy `backend/.env.example` to `backend/.env`:
```bash
cp backend/.env.example backend/.env
```

Fill in:
- `MONGODB_URI` — from MongoDB Atlas → Connect → Drivers
- `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` — from Firebase Console → Project Settings → Service Accounts → Generate new private key

> **Important:** `FIREBASE_PRIVATE_KEY` must include the literal `\n` characters.  
> In your `.env` file: `FIREBASE_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\nMIIE...\n-----END RSA PRIVATE KEY-----\n"`

### 3. Seed the problem database

```bash
cd backend
node scripts/seedProblems.js
```

### 4. Run dev servers

```bash
# Terminal 1 — frontend (http://localhost:5173)
npm run dev

# Terminal 2 — backend (http://localhost:5000)
cd backend && npm run dev
```

---

## GitHub Secrets (for CI/CD)

Set these in GitHub → Settings → Secrets and variables → Actions:

| Secret | Description |
|--------|-------------|
| `VITE_FIREBASE_API_KEY` | Firebase web app API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | e.g. `your-project.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | e.g. `your-project.appspot.com` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Numeric sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase app ID |
| `VITE_API_URL` | Your Railway backend URL e.g. `https://code-club-one-production.up.railway.app` |

---

## Running Tests

```bash
# Frontend tests
npx vitest run

# Frontend tests in watch mode
npx vitest

# Backend tests
cd backend && npx vitest run
```

---

## Commit Convention

This project follows [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(scope): short description
fix(scope): short description
chore(scope): short description
perf(scope): short description
docs(scope): short description
test(scope): short description
```

---

## Architecture Notes

- **Frontend:** React 19 + Vite + TailwindCSS 4, installable as a PWA
- **Backend:** Node.js + Express 5 (ES modules) on Railway
- **Auth:** Firebase Auth (frontend) + Firebase Admin SDK (backend token verification)
- **Database:** MongoDB Atlas via Mongoose — the sole datastore (fully migrated off Firestore)
- **Judge:** Judge0 (self-hosted Docker or RapidAPI — see `docs/judge0-setup.md`)
- **Caching:** Redis (`ioredis`) with automatic in-memory fallback if `REDIS_URL` is unset
- **Logging:** Pino, structured JSON via `httpLogger` middleware
- **AI Coaching:** Anthropic Claude API — hints (`insightsController.js`, `hintsController`), dashboard insights, and interview mode
- **Feature flags:** `MONETIZATION_ENABLED` and `B2B_ENABLED` in `backend/config/featureFlags.js` gate billing and TPO features respectively — both default to `false`

For the full system diagram, every API route, and the MongoDB schema, see `docs/architecture.md`, `docs/api-contracts.md`, and `docs/database-schema.md`.

XP is **always computed server-side** from `solvedSlugs × difficulty weights`.  
Never send `totalXP` from the client — the backend will ignore it.