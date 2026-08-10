/**
 * maintenanceMode.js (plan 009)
 *
 * Returns 503 for all traffic when the admin has flipped maintenanceMode
 * on, EXCEPT for an explicit path allowlist — admin routes, health
 * checks, and the public announcement endpoint stay reachable so an admin
 * can (a) actually turn maintenance mode back off and (b) still see why
 * the site is down via /api/health and /api/announcement.
 *
 * Deliberately allowlist-based rather than mount-order-based: server.js
 * mounts /api/admin fairly late (after most other route blocks), so
 * relying on "insert this middleware after the admin mount" would be
 * fragile and easy to silently break with a future reordering. An
 * explicit path check here is correct regardless of where in server.js
 * this middleware itself is mounted, as long as it's mounted before the
 * protected/business route handlers actually run.
 *
 * Note: POST /api/billing/webhook is mounted in server.js BEFORE this
 * middleware even attaches (it needs express.raw(), ahead of the global
 * express.json()) — so Razorpay webhooks are already, structurally,
 * unaffected by maintenance mode. That's intentional: an in-flight
 * payment shouldn't get stuck mid-webhook because someone flipped
 * maintenance mode on for an unrelated reason.
 */
import { getSettings } from "../services/settingsService.js";
import { logger } from "../config/logger.js";

const ALLOWED_PREFIXES = ["/api/admin", "/api/health", "/api/announcement"];

function isAllowlisted(path) {
  return path === "/" || ALLOWED_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

export async function maintenanceModeMiddleware(req, res, next) {
  if (isAllowlisted(req.path)) return next();

  let settings;
  try {
    settings = await getSettings();
  } catch (err) {
    // Fail OPEN, not closed: if the settings read itself fails (e.g. a DB
    // hiccup), don't compound that with an app-wide 503 on top of
    // whatever's already wrong — log it and let the request proceed to
    // whatever the actual route handler would have done anyway.
    logger.error({ err }, "[MaintenanceMode] settings read failed — failing open");
    return next();
  }

  if (!settings.maintenanceMode) return next();

  return res.status(503).json({
    error: "Code Club is temporarily down for maintenance. Please check back shortly.",
    maintenance: true,
  });
}