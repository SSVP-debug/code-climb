import rateLimit from "express-rate-limit";
import { ipKeyGenerator } from "express-rate-limit";

export const compilerRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,

  keyGenerator: (req) => {
    if (req.user?.uid) {
      return `user:${req.user.uid}`;
    }

    return ipKeyGenerator(req);
  },

  standardHeaders: true,
  legacyHeaders: false,

  message: {
    error:
      "Too many code executions. Please wait a minute and try again.",
  },
});