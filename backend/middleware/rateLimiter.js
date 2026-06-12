import rateLimit from "express-rate-limit";

export const compilerLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,              // 10 code submissions per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === "test",
  message: {
    error: "Too many code submissions. Please wait a moment before trying again.",
  },
});

// For regular API routes — generous but prevents abuse
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many requests. Please slow down.",
  },
});

// For AI Insights — each request costs tokens, so keep it tight
// 5 requests per 10 minutes per IP
export const aiLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === "test",
  message: {
    error: "You've requested insights too many times. Wait a few minutes before refreshing.",
  },
});