/**
 * Structured logging via Pino.
 *
 * Two exports:
 *  - `logger`: base logger for anything outside a request context
 *    (startup checks, DB/Redis connection state, background scripts).
 *  - `httpLogger`: pino-http middleware, wired into server.js. Attaches
 *    `req.log` — a child logger already carrying a per-request id — to
 *    every request, and auto-logs one line per request/response with
 *    method, path, status, and `responseTime` (ms) once it completes.
 *
 * This does NOT replace Sentry — Sentry still owns unhandled-exception
 * alerting. Pino is for the logs/aggregation side: "what happened and in
 * what order," searchable structured output, not "page someone right now."
 *
 * Dev: human-readable colorized output via pino-pretty.
 * Prod: plain JSON lines to stdout — what Railway's log viewer (and any
 * aggregator you point at it later) expects.
 */
import pino from "pino";
import pinoHttp from "pino-http";

const isProduction = process.env.NODE_ENV === "production";

export const logger = pino({
  level: process.env.LOG_LEVEL || (isProduction ? "info" : "debug"),
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