/**
 * Resend client — email delivery for the weekly AI review (commit 097).
 *
 * Mirrors the Redis/Judge0 pattern already used in this codebase: if
 * RESEND_API_KEY isn't set, callers get `null` back and log a clear warning
 * instead of crashing. Email is not on the request-serving critical path
 * (it's only used by the weekly cron script), but the same "never crash on
 * a missing optional dependency" principle applies.
 */
import { logger } from "./logger.js";

let client = null;
let initAttempted = false;

export async function getResendClient() {
  if (initAttempted) return client;
  initAttempted = true;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    logger.warn(
      "[Resend] RESEND_API_KEY not set — weekly review emails will be " +
        "skipped entirely. Set it in backend/.env to enable sending."
    );
    return null;
  }

  try {
    // Lazy import: a missing/unused RESEND_API_KEY should never even
    // touch the network or require the package to be resolvable.
    const { Resend } = await import("resend");
    client = new Resend(apiKey);
    return client;
  } catch (err) {
    logger.warn({ err }, "[Resend] Failed to initialize client — is the 'resend' package installed?");
    return null;
  }
}

export function getFromAddress() {
  return process.env.RESEND_FROM_EMAIL || "Code Club <onboarding@resend.dev>";
}