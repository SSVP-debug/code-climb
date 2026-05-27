import "./config/env.js";

import express from "express";
import cors from "cors";

import connectDB from "./config/db.js";
import userRoutes from "./routes/users.js";
import progressRoutes from "./routes/progress.js";
import submissionRoutes from "./routes/submissions.js";
import compilerRoutes from "./routes/compiler.js";

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        var msg =
          "The CORS policy for this site does not " +
          "allow access from the specified Origin.";
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

console.log("[CORS] Configured for:", allowedOrigins.join(", "));

app.use(express.json({ limit: "1mb" }));

app.get("/", (req, res) => {
  res.send("Code Climb Backend Running");
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    mongo:
      process.env.MONGODB_URI?.startsWith("mongodb")
        ? "configured"
        : "missing",
  });
});

app.use("/api", userRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/submissions", submissionRoutes);
app.use("/api/compiler", compilerRoutes);

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`[Server] Running on port ${PORT}`);
    });
  } catch (error) {
    console.error(
      "[Server] Failed to start:",
      error.message
    );
    process.exit(1);
  }
}

start();
