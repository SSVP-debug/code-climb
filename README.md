# Code Club

A full-stack DSA (Data Structures & Algorithms) practice platform. Write code, run it instantly, submit against hidden test cases, and track your progress over time.

**Live:** [code-club.vercel.app](https://code-club.vercel.app) <!-- update this once deployed -->

---

## Features

- **Monaco Editor** — VS Code-quality editor with syntax highlighting for Python, JavaScript, Java, and C++
- **Live code execution** — runs your code via Judge0 with custom stdin support
- **Judge system** — submits against visible + hidden test cases and returns Accepted / Wrong Answer / Runtime Error / Compilation Error
- **Progress tracking** — solved problems, activity streak, and difficulty breakdown synced to Firestore
- **Firebase Auth** — Google sign-in with persistent sessions
- **Submission history** — every submission saved with status, language, and test case results
- **Dashboard** — rank progress, daily challenge, achievement gallery, and AI insights
- **20 curated problems** — Easy through Hard, covering Arrays, Two Pointers, Sliding Window, Hash Maps, Binary Search, Dynamic Programming, Bit Manipulation, Greedy, Stacks, and Strings

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 8, TailwindCSS 4, React Router v7 |
| Code editor | Monaco Editor (`@monaco-editor/react`) |
| Auth | Firebase Authentication (Google) |
| Database | Firestore (user data, problems, submissions, progress) |
| Backend | Node.js 20, Express 5 |
| Code execution | Judge0 API (proxied through backend) |
| MongoDB | Atlas (partially integrated, submissions + user routes) |
| Deployment | Vercel (frontend) + Railway (backend) |

---

## Project Structure

```
code-club/
├── src/
│   ├── context/          # AuthContext, AppContext
│   ├── firebase/         # Firebase init (auth + db exports)
│   ├── hooks/            # useProblems, useSubmissions, useRunCode, useTimer, useDashboardData
│   ├── pages/            # LandingPage, Dashboard, ProblemsPage, ProblemDetailsPage, Profile, Analytics
│   ├── components/       # ProtectedRoute, ProblemEditor, ProblemResults, SubmissionHistory...
│   ├── services/         # api.js, compiler.js, judgeService.js, progressService.js
│   ├── utils/            # generateDriverCode, parseJudge0Result, editorStorage, formatters
│   └── data/             # problems.js (static fallback + hiddenTestcases for judge)
├── backend/
│   ├── config/           # db.js, env.js, firebaseAdmin.js
│   ├── middleware/        # auth.js (requireAuth), rateLimiter.js
│   ├── routes/           # users.js, progress.js, submissions.js, compiler.js
│   └── scripts/          # seedProblems.js
├── .github/
│   └── workflows/        # ci.yml
├── firestore.rules
└── vercel.json
```

---

## Local Development

### Prerequisites

- Node.js 20+
- A Firebase project (Auth + Firestore enabled)
- MongoDB Atlas cluster (or local MongoDB)
- Judge0 API access (self-hosted or RapidAPI)

### 1. Clone and install

```bash
git clone https://github.com/SSVP-debug/code-club.git
cd code-club

# Frontend dependencies
npm install

# Backend dependencies
cd backend && npm install
```

### 2. Environment variables

**Frontend** — create `src/.env` (or `.env` at project root):

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_API_URL=http://localhost:5000
```

**Backend** — create `backend/.env`:

```env
PORT=5000
MONGODB_URI=
FRONTEND_URL=http://localhost:5173
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
NODE_ENV=development
```

Get Firebase Admin credentials from: **Firebase Console → Project Settings → Service Accounts → Generate new private key**

### 3. Run locally

```bash
# Terminal 1 — Frontend
npm run dev

# Terminal 2 — Backend
cd backend && npm run dev
```

Frontend: http://localhost:5173
Backend: http://localhost:5000

### 4. Seed problems (first time only)

```bash
cd backend
node scripts/seedProblems.js
```

---

## Deployment

### Frontend → Vercel

1. Go to [vercel.com](https://vercel.com) and connect your GitHub repo
2. Framework preset: **Vite** (auto-detected)
3. Root directory: `.` (project root)
4. Build command: `npm run build`
5. Output directory: `dist`
6. Add all `VITE_*` environment variables
7. Set `VITE_API_URL` to your Railway backend URL

### Backend → Railway

1. Go to [railway.app](https://railway.app) and create a new project from GitHub
2. In service settings, set **Root Directory** to `backend`
3. Railway auto-detects `npm start` from package.json
4. Add all environment variables (see backend `.env` above)
5. Set `FRONTEND_URL` to your Vercel deployment URL
6. Set `NODE_ENV=production`

After deploying both, update:
- Vercel: `VITE_API_URL` → your Railway backend URL
- Railway: `FRONTEND_URL` → your Vercel frontend URL

---

## Firestore Security Rules

Deploy with Firebase CLI:

```bash
firebase deploy --only firestore:rules
```

Rules are in `firestore.rules` at the project root.

---

## Architecture

```
Browser
  │
  ├─→ Vercel (React SPA)
  │     ├─→ Firebase Auth (Google login)
  │     ├─→ Firestore (problems, progress, submissions)
  │     └─→ Railway (Express API)
  │             ├─→ Firebase Admin (token verification)
  │             ├─→ Judge0 (code execution)
  │             └─→ MongoDB Atlas (user data)
```

---

## Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -m "feat: your feature"`
4. Push and open a pull request

---

## License

MIT
