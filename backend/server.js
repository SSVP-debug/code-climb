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
import compilerRoutes from "./routes/compiler.js";
import problemRoutes from "./routes/problemRoutes.js";
import publicProfileRoutes from "./routes/publicProfile.js";
import billingWebhookRoutes from "./routes/billingWebhook.js";

// These now work correctly (ES module import, not require)
import { requireAuth } from "./middleware/auth.js";
// ── Phase 7 imports ──────────────────────────────────────────────────────────
import recruiterRoutes, { candidateTestsRouter } from "./routes/recruiter.js";
import certificationRoutes from "./routes/certification.js";
import contestRoutes from "./routes/contests.js";
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
import weeklyChallengeRoutes from "./routes/weeklyChallenge.js";
import hintsRoutes from "./routes/hints.js";
import notesRoutes from "./routes/notes.js";
import profilePdfRoutes from "./routes/profilePdf.js";
// ── Phase 8 / Batch E fix: these three were fully built but never mounted,
// so /tpo, /billing, and /interview all 404'd for every real request from
// TpoSignupPage, TpoDashboardPage, PricingPage, and InterviewModePage. ─────
import tpoRoutes, { studentAssignmentsRouter } from "./routes/tpo.js";
import billingRoutes from "./routes/billing.js";
import interviewRoutes from "./routes/interview.js";

if (process.env.NODE_ENV !== "production") {
  mongoose.set("strict", "throw");
}
const app = express();
app.set("trust proxy", 1);

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://code-club-one.vercel.app",
  process.env.FRONTEND_URL,
].filter(Boolean); // removes undefined if FRONTEND_URL is not set

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

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    mongo: process.env.MONGODB_URI?.startsWith("mongodb") ? "configured" : "missing",
  });
});


// ─── Protected routes (Firebase token required for ALL of these) ────────────
app.use("/api/users", requireAuth, apiLimiter, userRoutes);
app.use("/api/progress", requireAuth, apiLimiter, progressRoutes);
app.use("/api/submissions", requireAuth, apiLimiter, submissionRoutes);
app.use("/api/compiler", requireAuth, compilerLimiter, compilerRoutes);
app.use("/api/judge", requireAuth, apiLimiter, judgeRoutes);
app.use("/api/problems", problemRoutes);
// Public stats endpoint — no auth, used by landing page social proof
app.use("/api/stats", statsRoutes);
// Leaderboard — public (no auth required, cached 5 min)
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/weekly", weeklyChallengeRoutes);
// AI hints — auth + AI rate limiter (shares quota with insights)
app.use("/api/hints", requireAuth, aiLimiter, hintsRoutes);
app.use("/api/notes", requireAuth, apiLimiter, notesRoutes);
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
app.use("/api/recruiter", requireAuth, apiLimiter, recruiterRoutes);
app.use("/api/candidate/tests", requireAuth, apiLimiter, candidateTestsRouter);
app.use("/api/cert", requireAuth, apiLimiter, certificationRoutes);
app.use("/api/contests", requireAuth, apiLimiter, contestRoutes);
app.use("/api/profile", requireAuth, apiLimiter, profileSignRoutes);

// ── Phase 8 / Batch E fix: mount previously-orphaned route modules ──────────
// B2B (TPO) dashboard — gated internally by B2B_ENABLED, same as before.
app.use("/api/tpo", requireAuth, apiLimiter, tpoRoutes);
app.use("/api/assignments/student", requireAuth, apiLimiter, studentAssignmentsRouter);
// Billing (Razorpay) — gated internally by MONETIZATION_ENABLED. NOTE: /plans
// (meant public) and /webhook (meant no-auth, raw-body signature check) both
// sit behind requireAuth here, which only matches how the app is used today
// (PricingPage only calls the authed /subscription, /create-order, /verify
// routes). Splitting the webhook out with express.raw() ahead of the global
// express.json() middleware is a real prerequisite before Razorpay webhooks
// go live — tracked in docs/phase8-progress.md, not done in this pass.
app.use("/api/billing", requireAuth, apiLimiter, billingRoutes);
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