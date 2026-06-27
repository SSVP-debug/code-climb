import "./config/env.js"; // must be first — loads env vars before anything reads them
import * as Sentry from "@sentry/node";

// ── Sentry: initialise before any other imports so it can instrument them ──
// SENTRY_DSN is set in Railway / .env. If missing, Sentry is a no-op — no crash.
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || "development",
    // Capture 100% of transactions in dev, 10% in prod (adjust as traffic grows)
    tracesSampleRate:
      process.env.NODE_ENV === "production"
        ? 0.1
        : 1.0,
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
import userRoutes from "./routes/users.js";
import progressRoutes from "./routes/progress.js";
import submissionRoutes from "./routes/submissions.js";
import compilerRoutes from "./routes/compiler.js";
import problemRoutes from "./routes/problemRoutes.js";
import publicProfileRoutes from "./routes/publicProfile.js";

// These now work correctly (ES module import, not require)
import { requireAuth } from "./middleware/auth.js";
import { compilerLimiter, apiLimiter, aiLimiter } from "./middleware/rateLimiter.js";
import insightsRoutes from "./routes/insights.js";
import dailyChallengeRoutes from "./routes/dailyChallenge.js";
import initRoutes from "./routes/init.js";

const app = express();
app.set("trust proxy", 1);

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://code-club-one.vercel.app",
  "https://code-climb-self.vercel.app",
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



app.use(express.json({ limit: "1mb" }));

// ─── Public routes (no auth needed) ────────────────────────────────────────
app.get("/", (req, res) => res.send("Code Club Backend Running"));

app.get("/api/health", (req, res) => {
  const states = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };

  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    mongo: states[mongoose.connection.readyState],
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  });
});


// ─── Protected routes (Firebase token required for ALL of these) ────────────
app.use("/api/users", requireAuth, apiLimiter, userRoutes);
app.use("/api/progress", requireAuth, apiLimiter, progressRoutes);
app.use("/api/submissions", requireAuth, apiLimiter, submissionRoutes);
app.use("/api/compiler", requireAuth, compilerLimiter, compilerRoutes);
app.use("/api/judge", requireAuth, apiLimiter, judgeRoutes);
app.use("/api/problems", problemRoutes);
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
app.use(
  "/api/init",
  requireAuth,
  apiLimiter,
  initRoutes
);
// ─── 404 handler ────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});



// ─── Sentry error handler (must come before our own error handler) ───────────
if (process.env.SENTRY_DSN) {
  Sentry.setupExpressErrorHandler(app);
}

// ─── Global error handler ───────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("[Server Error]", err.message);

  // Don't expose internal error details to clients
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === "production" ? "Internal server error" : err.message,
  });
});


// ─── Start ──────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

async function start() {
  // Try MongoDB but never crash if it fails.
  // Compiler, judge, and all Firestore routes work without it.
  try {
    await connectDB();
  } catch (error) {
    console.warn(
      "[MongoDB] Connection failed — server starting without it.",
      "\n         Reason:", error.message,
      "\n         Compiler and judge routes are unaffected."
    );
  }

  const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on ${PORT}`);
  });

  // Graceful shutdown — Railway sends SIGTERM before restarting containers.
  // Without this, in-flight Judge0 requests are killed mid-execution.
  process.on("SIGTERM", () => {
    console.log("[SIGTERM] Shutting down server...");

    server.close(() => {
      console.log("[SIGTERM] Server closed.");
      process.exit(0);
    });
  });

  process.on("SIGINT", () => {
    console.log("[SIGINT] Shutting down server...");

    server.close(() => {
      console.log("[SIGINT] Server closed.");
      process.exit(0);
    });
  });

  process.on("SIGUSR2", () => {
    server.close(() => process.exit(0));
  });
}

// Global process-level error handlers
process.on("unhandledRejection", (reason) => {
  console.error(
    "[Unhandled Rejection]",
    reason instanceof Error
      ? reason.stack
      : reason
  );

  if (process.env.SENTRY_DSN) {
    Sentry.captureException(
      reason instanceof Error
        ? reason
        : new Error(String(reason))
    );
  }
});

process.on("uncaughtException", (err) => {
  console.error(
    "[Uncaught Exception]",
    err.stack
  );

  if (process.env.SENTRY_DSN) {
    Sentry.captureException(err);
  }

  process.exit(1);
});

start();