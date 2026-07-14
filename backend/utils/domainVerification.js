import VerifiedDomain from "../models/VerifiedDomain.js";

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
    console.error("[domainVerification] lookup failed:", err.message);
    return false;
  }
}