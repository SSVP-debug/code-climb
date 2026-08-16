import "./config/env.js"; // must be first — loads env vars before anything reads them
import * as Sentry from "@sentry/node";

// ── Sentry: initialise before any other imports so it can instrument them ──
// SENTRY_DSN is set in Railway / .env. If missing, Sentry is a no-op — no crash.
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || "development",
    tracesSampleRate:
      process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  });
} else {
  console.warn("[Sentry] SENTRY_DSN not set — error monitoring disabled.");
}

import helmet from "helmet";
import judgeRoutes from "./routes/judge.js";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import connectDB from "./config/db.js";
import { validateJudge0Config } from "./config/judge0.js";
import { logger, httpLogger } from "./config/logger.js";
import userRoutes from "./routes/users.js";
import progressRoutes from "./routes/progress.js";
import submissionRoutes from "./routes/submissions.js";
import notificationRoutes from "./routes/notifications.js";
import compilerRoutes from "./routes/compiler.js";
import problemRoutes from "./routes/problemRoutes.js";
import publicProfileRoutes from "./routes/publicProfile.js";
import billingWebhookRoutes from "./routes/billingWebhook.js";
import healthRoutes from "./routes/health.js";
import announcementRoutes from "./routes/announcement.js";
import { maintenanceModeMiddleware } from "./middleware/maintenanceMode.js";

// These now work correctly (ES module import, not require)
import { requireAuth } from "./middleware/auth.js";
// ── Phase 7 imports ──────────────────────────────────────────────────────────
import recruiterRoutes, { candidateTestsRouter } from "./routes/recruiter.js";
import certificationRoutes from "./routes/certification.js";
import contestRoutes from "./routes/contests.js";
import battleRoomRoutes from "./routes/battleRooms.js";
import playlistRoutes from "./routes/Playlists.js";
import profileSignRoutes from "./routes/profileSign.js";
import { requireRole } from "./middleware/roleGuard.js";

import { compilerLimiter, apiLimiter, aiLimiter } from "./middleware/rateLimiter.js";
import insightsRoutes from "./routes/insights.js";
import dailyChallengeRoutes from "./routes/dailyChallenge.js";
import initRoutes from "./routes/init.js";
import statsRoutes from "./routes/stats.js";
import referralRoutes from "./routes/referral.js";
import ambassadorRoutes from "./routes/ambassador.js";
import leetcodeRoutes from "./routes/leetcode.js";
import leaderboardRoutes from "./routes/leaderboard.js";
import collegeVerificationRoutes from "./routes/collegeVerification.js";
import weeklyChallengeRoutes from "./routes/weeklyChallenge.js";
import hintsRoutes from "./routes/hints.js";
import notesRoutes from "./routes/notes.js";
import profilePdfRoutes from "./routes/profilePdf.js";
import reflectionRoutes from "./routes/reflections.js";
// ── Phase 8 / Batch E fix: these three were fully built but never mounted,
// so /tpo, /billing, and /interview all 404'd for every real request from
// TpoSignupPage, TpoDashboardPage, PricingPage, and InterviewModePage. ─────
import tpoRoutes, { studentAssignmentsRouter } from "./routes/tpo.js";
import billingRoutes from "./routes/billing.js";
import interviewRoutes from "./routes/interview.js";
import adminRoutes from "./routes/admin.js";
import { SITE_URL } from "./config/site.js";

if (process.env.NODE_ENV !== "production") {
  mongoose.set("strict", "throw");
}
const app = express();
app.set("trust proxy", 1);

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://code-club-one.vercel.app", // kept explicitly — Vercel's own domain
  // stays live alongside a custom domain, so don't drop it once FRONTEND_URL
  // points elsewhere.
  SITE_URL,
].filter(
  (origin, index, all) => Boolean(origin) && all.indexOf(origin) === index
); // de-dupes in case SITE_URL resolves to the same vercel URL above

app.use(
  helmet()
);
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (!allowedOrigins.includes(origin)) {
      return callback(new Error(`CORS: origin ${origin} not allowed`), false);
    }
    return callback(null, true);
  },
  credentials: true,
})
);


app.use(httpLogger);
app.use(
  "/api/billing/webhook",
  express.raw({
    type: "application/json",
  }),
  billingWebhookRoutes
);

app.use(express.json({ limit: "1mb" }));

// ─── Public routes (no auth needed) ────────────────────────────────────────
app.get("/", (req, res) => res.send("Code Club Backend Running"));

// Fest Readiness Audit, P1-1: this used to report `mongo: "configured"`
// based purely on whether MONGODB_URI *looked like* a valid connection
// string — never whether Mongo was actually reachable. A server could (and
// did, in principle) return this as "ok" while the database was fully
// down. mongoose.connection.readyState is an in-memory flag Mongoose
// already maintains (no network round trip), so this stays cheap enough to
// poll frequently — see docs/architecture.md's connection-state comments
// for why a live ping isn't added on top: readyState already reflects a
// disconnect within one heartbeat cycle, and this endpoint is meant to be
// polled far more often than that.
const MONGO_STATE_LABELS = {
  0: "disconnected",
  1: "connected",
  2: "connecting",
  3: "disconnecting",
};

app.get("/api/health", (req, res) => {
  const mongoState = mongoose.connection.readyState;
  const mongoOk = mongoState === 1;

  res.status(mongoOk ? 200 : 503).json({
    status: mongoOk ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
    mongo: MONGO_STATE_LABELS[mongoState] ?? "unknown",
  });
});

// GET /api/health/compiler — Judge0 circuit-breaker/request stats.
// Fest Readiness Audit, P1-1: previously mounted but never populated —
// services/judge0Health.js's counters are now updated from
// controllers/compilerController.js's fetchJudge0 on every real Judge0
// interaction (success or genuine infra failure), so this reflects actual
// state instead of always reporting zeros.
app.use("/api/health", healthRoutes);

// GET /api/announcement — public, no auth (plan 009). Mounted here,
// alongside the other pre-maintenance-mode public routes, so it's always
// reachable even while maintenance mode is active (also explicitly
// allowlisted in maintenanceMode.js itself — see that file's header for
// why the allowlist doesn't rely on mount order).
app.use("/api/announcement", announcementRoutes);

// ── Maintenance mode (plan 009) ─────────────────────────────────────────────
// Mounted here — after /api/health and /api/announcement above, before
// every protected/business route below — so a maintenanceMode=true 503
// covers everything else. Uses an explicit path allowlist internally
// (not mount-order reliance) to keep /api/admin/* reachable regardless of
// where admin routes happen to be mounted further down; see
// middleware/maintenanceMode.js's header comment for the full reasoning.
app.use(maintenanceModeMiddleware);

// ─── Protected routes (Firebase token required for ALL of these) ────────────
app.use("/api/users", requireAuth, apiLimiter, userRoutes);
app.use("/api/progress", requireAuth, apiLimiter, progressRoutes);
app.use("/api/submissions", requireAuth, apiLimiter, submissionRoutes);
app.use("/api/notifications", requireAuth, apiLimiter, notificationRoutes);
app.use("/api/compiler", requireAuth, compilerLimiter, compilerRoutes);
app.use("/api/judge", requireAuth, apiLimiter, judgeRoutes);
app.use("/api/problems", problemRoutes);
// Public stats endpoint — no auth, used by landing page social proof
app.use("/api/stats", statsRoutes);
// Leaderboard — public (no auth required, cached 5 min)
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/college-verification", collegeVerificationRoutes);
app.use("/api/weekly", weeklyChallengeRoutes);
// AI hints — auth + AI rate limiter (shares quota with insights)
app.use("/api/hints", requireAuth, aiLimiter, hintsRoutes);
app.use("/api/notes", requireAuth, apiLimiter, notesRoutes);
app.use("/api/reflections", requireAuth, apiLimiter, reflectionRoutes);
app.use("/api/profile/pdf", requireAuth, profilePdfRoutes);
// Single boot endpoint: replaces 3 sequential API calls (initProgress + getProgress + getSubmissions)
app.use("/api/init", requireAuth, apiLimiter, initRoutes);
app.use("/api/referral", requireAuth, apiLimiter, referralRoutes);
app.use("/api/ambassador", requireAuth, apiLimiter, ambassadorRoutes);
app.use("/api/leetcode", requireAuth, apiLimiter, leetcodeRoutes);
app.use("/api/insights", requireAuth, aiLimiter, insightsRoutes);
app.use(
  "/api/daily-challenge",
  requireAuth,
  apiLimiter,
  dailyChallengeRoutes
);
app.use(
  "/api/public",
  publicProfileRoutes
);

// ─── 404 handler ────────────────────────────────────────────────────────────
logger.info(`[Server] 404 handler initialized`);
// ── Phase 7 mounts ───────────────────────────────────────────────────────────
// requireAuth is intentionally NOT applied at this mount point — the sole
// public route inside recruiter.js is GET /verify/:username (a public
// profile-signature check, by design). Every other route in that file now
// applies requireAuth itself, directly on the route, since backend
// hardening pass 1 (see docs/security-fixes/). Do not add requireAuth
// here as a blanket fix without first splitting /verify/:username into
// its own router — doing so would 401 that intentionally-public endpoint.
app.use("/api/recruiter", apiLimiter, recruiterRoutes);
app.use("/api/candidate/tests", requireAuth, apiLimiter, candidateTestsRouter);
app.use("/api/cert", apiLimiter, certificationRoutes);
app.use("/api/contests", requireAuth, apiLimiter, contestRoutes);
// requireAuth is intentionally NOT applied at this mount point, same
// reasoning as recruiter.js just above — GET /:id is the one route in
// battleRooms.js designed to work for an unauthenticated caller too
// (req.userDoc is optional there; host/team/solve fields are simply
// omitted). Every other route in that file applies requireAuth or
// requireRole itself, directly on the route.
app.use("/api/battle-rooms", apiLimiter, battleRoomRoutes);
app.use("/api/playlists", requireAuth, apiLimiter, playlistRoutes);
app.use("/api/profile", requireAuth, apiLimiter, profileSignRoutes);

// ── Phase 8 / Batch E fix: mount previously-orphaned route modules ──────────
// B2B (TPO) dashboard — gated internally by B2B_ENABLED, same as before.
app.use("/api/tpo", requireAuth, apiLimiter, tpoRoutes);
app.use("/api/admin", requireAuth, apiLimiter, adminRoutes);
app.use("/api/assignments/student", requireAuth, apiLimiter, studentAssignmentsRouter);
// Billing (Razorpay) — gated internally by MONETIZATION_ENABLED. The webhook
// is NOT part of billingRoutes below — it's mounted separately above
// (`/api/billing/webhook`, express.raw() ahead of the global express.json(),
// no requireAuth) with its own HMAC signature check in
// routes/billingWebhook.js. This mount only carries /plans (public),
// /subscription, /create-order, /verify, /cancel — each of those applies
// requireAuth per-route inside routes/billing.js itself, not here.
app.use("/api/billing", apiLimiter, billingRoutes);
// Interview Mode — premium AI feature, shares the AI rate limiter with hints/insights.
app.use("/api/interview", requireAuth, aiLimiter, interviewRoutes);

app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});



// ─── Sentry error handler (must come before our own error handler) ───────────
if (process.env.SENTRY_DSN) {
  Sentry.setupExpressErrorHandler(app);
}

// ─── Global error handler ───────────────────────────────────────────────────
app.use((err, req, res, next) => {
  (req.log || logger).error({ err }, "[Server Error] Unhandled error in request handler");

  // Don't expose internal error details to clients
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === "production" ? "Internal server error" : err.message,
  });
});


// ─── Start ──────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

async function start() {
  // Judge0 config check — logs only, never blocks or crashes startup.
  validateJudge0Config();

  // Try MongoDB but never crash if it fails.
  // Compiler, judge, and all Firestore routes work without it.
  try {
    await connectDB();
  } catch (error) {
    logger.warn(
      { err: error },
      "[MongoDB] Connection failed — server starting without it. Compiler and judge routes are unaffected."
    );
  }

  const server = app.listen(PORT, () => {
    logger.info(`[Server] Listening on port ${PORT}`);
  });

  // Graceful shutdown — Railway sends SIGTERM before restarting containers.
  // Without this, in-flight Judge0 requests are killed mid-execution.
  process.on("SIGTERM", () => {
    logger.info(`[Server] Received SIGTERM, shutting down gracefully`);
    server.close(() => {
      logger.info(`[Server] Process terminated`);
      process.exit(0);
    });
  });

  process.on("SIGINT", () => {
    logger.info(`[Server] Received SIGINT, shutting down gracefully`);
    server.close(() => {
      logger.info(`[Server] Process terminated`);
      process.exit(0);
    });
  });
}

start();