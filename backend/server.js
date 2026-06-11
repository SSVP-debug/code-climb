import helmet from "helmet";
import judgeRoutes from "./routes/judge.js";
import * as Sentry from "@sentry/node";
import "./config/env.js";
import express from "express";
import cors from "cors";

import connectDB from "./config/db.js";
import userRoutes from "./routes/users.js";
import progressRoutes from "./routes/progress.js";
import submissionRoutes from "./routes/submissions.js";
import compilerRoutes from "./routes/compiler.js";
import problemRoutes from "./routes/problemRoutes.js";

// These now work correctly (ES module import, not require)
import { requireAuth } from "./middleware/auth.js";
import { compilerLimiter, apiLimiter } from "./middleware/rateLimiter.js";


const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
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

console.log("[CORS] Allowed origins:", allowedOrigins.join(", "));

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


// ─── 404 handler ────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});



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
    console.log(`[Server] Running on port ${PORT}`);
  });

  // Graceful shutdown — Railway sends SIGTERM before restarting containers.
  // Without this, in-flight Judge0 requests are killed mid-execution.
  process.on("SIGTERM", () => {
    console.log("[Server] SIGTERM received — shutting down gracefully");
    server.close(() => {
      console.log("[Server] Closed. Exiting.");
      process.exit(0);
    });
  });

  process.on("SIGINT", () => {
    server.close(() => process.exit(0));
  });
}

start();