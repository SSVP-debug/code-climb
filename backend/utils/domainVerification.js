import VerifiedDomain from "../models/VerifiedDomain.js";
import { logger } from "../config/logger.js";

/**
 * isDomainAutoVerified — checks a domain against the VerifiedDomain
 * allowlist for a given type ("company" or "college").
 *
 * Returns false (never throws) on lookup failure — a DB hiccup here should
 * degrade to "falls into the manual review queue", never to "silently
 * auto-verify everyone". Fail closed, not open.
 */
export async function isDomainAutoVerified(domain, type) {
  if (!domain) return false;

  try {
    const match = await VerifiedDomain.findOne({
      domain: domain.toLowerCase(),
      type,
    }).lean();

    return Boolean(match);
  } catch (err) {
    logger.error({ err }, "[domainVerification] lookup failed");
    return false;
  }
}

// Free/consumer email providers — not valid for institutional verification
// (TPO registration or student college verification). Extracted from what
// was previously a hardcoded inline check in routes/tpo.js so both routes
// share one list instead of two copies drifting apart. Extend
// conservatively — over-blocking is a support burden, not just a bug.
const CONSUMER_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "yahoo.com",
  "outlook.com",
  "hotmail.com",
  "icloud.com",
  "protonmail.com",
]);

export function isConsumerEmailDomain(domain) {
  return CONSUMER_EMAIL_DOMAINS.has(domain?.toLowerCase().trim());
}