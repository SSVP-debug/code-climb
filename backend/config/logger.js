import pino from "pino";
import pinoHttp from "pino-http";

const isProduction = process.env.NODE_ENV === "production";

// ── Redaction ──────────────────────────────────────────────────────────────
// pino-http's default request serializer includes req.headers, which means
// the Firebase ID token sent as `Authorization: Bearer <token>` on every
// authenticated request would otherwise be written verbatim into logs (and
// therefore into Railway's log aggregation / any downstream sink). Redact
// it — and any cookies/set-cookie, in case those are ever introduced — at
// the pino level so it's stripped from every logger, not just httpLogger.
// `censor` uses "[REDACTED]" instead of pino's default "[Redacted]" purely
// for grep-friendliness; the value itself is what matters.
const REDACT_PATHS = [
  "req.headers.authorization",
  "req.headers.cookie",
  "res.headers['set-cookie']",
  "*.headers.authorization",
  "*.headers.cookie",
];

export const logger = pino({
  level: process.env.LOG_LEVEL || (isProduction ? "info" : "debug"),
  redact: {
    paths: REDACT_PATHS,
    censor: "[REDACTED]",
  },
  transport: isProduction
    ? undefined
    : {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "HH:MM:ss",
          ignore: "pid,hostname",
        },
      },
});

/**
 * `userId` on every log line ties a request to a specific user without
 * needing to grep for it manually — req.userDoc is set by requireAuth
 * (see middleware/auth.js), but that middleware runs *after* pino-http in
 * the stack, so customProps checks both req.userDoc and req.auth (which
 * IS available earlier) and takes whichever is populated at log time.
 *
 * `route` prefers the matched Express route pattern (e.g. "/api/problems/:slug")
 * over the raw URL (e.g. "/api/problems/two-sum") — much more useful for
 * grouping/aggregating logs by endpoint rather than by every unique slug.
 */
export const httpLogger = pinoHttp({
  logger,
  customProps: (req, res) => ({
    userId: req.userDoc?._id?.toString() || req.auth?.uid || null,
    route: req.route?.path ? `${req.baseUrl}${req.route.path}` : req.originalUrl,
  }),
  customSuccessMessage: (req, res) => `${req.method} ${req.originalUrl} → ${res.statusCode}`,
  customErrorMessage: (req, res, err) => `${req.method} ${req.originalUrl} → ${res.statusCode} (${err.message})`,
  // Don't log health-check spam if/when one gets added later.
  autoLogging: {
    ignore: (req) => req.url === "/api/health" || req.url === "/favicon.ico",
  },
});