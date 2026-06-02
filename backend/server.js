import "./config/env.js";
import express from "express";
import cors from "cors";

import connectDB from "./config/db.js";
import userRoutes from "./routes/users.js";
import progressRoutes from "./routes/progress.js";
import submissionRoutes from "./routes/submissions.js";
import compilerRoutes from "./routes/compiler.js";

// These now work correctly (ES module import, not require)
import { requireAuth } from "./middleware/auth.js";
import { compilerLimiter, apiLimiter } from "./middleware/rateLimiter.js";

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  process.env.FRONTEND_URL, // add your deployed frontend URL here via env
].filter(Boolean); // removes undefined if FRONTEND_URL is not set

app.use(
  cors({
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
app.use("/api/users",       requireAuth, apiLimiter,      userRoutes);
app.use("/api/progress",    requireAuth, apiLimiter,      progressRoutes);
app.use("/api/submissions", requireAuth, apiLimiter,      submissionRoutes);
app.use("/api/compiler",    requireAuth, compilerLimiter, compilerRoutes);

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
  try {
    await connectDB();
    app.listen(PORT, () => console.log(`[Server] Running on port ${PORT}`));
  } catch (error) {
    console.error("[Server] Failed to start:", error.message);
    process.exit(1);
  }
}

start();