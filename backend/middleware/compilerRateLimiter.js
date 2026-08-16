import rateLimit from "express-rate-limit";
import { userOrIpKey } from "./rateLimiter.js";

// Judge0 Integration Hardening, item 7: this previously keyed on
// `req.user?.uid`, but nothing in this backend ever sets `req.user` —
// auth.js only sets `req.auth` (see middleware/auth.js). That meant every
// authenticated request fell through to IP-based keying, which is exactly
// the shared-college-NAT collision problem rateLimiter.js's `userOrIpKey`
// was written to avoid (see its comment). Fixed by reusing that same
// shared key function instead of a second, silently-broken copy of it.
export const compilerRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,

  keyGenerator: userOrIpKey,

  standardHeaders: true,
  legacyHeaders: false,

  message: {
    error:
      "Too many code executions. Please wait a minute and try again.",
  },
});