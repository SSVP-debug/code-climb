import College from "../models/College.js";
import { isDomainAutoVerified, isConsumerEmailDomain } from "../utils/domainVerification.js";
import { deriveCollegeNameFromDomain } from "../utils/collegeNameHeuristics.js";
import { logger } from "../config/logger.js";

/**
 * autoProvisionCollegeForDomain — closes the gap documented (until now) in
 * User.js's `education.collegeId` comment: a student who simply signs up
 * with an institutional email was never linked to any College record at
 * all, unless they separately ran the *optional* /college-verification
 * flow, or their institution already happened to have a TPO-registered
 * College doc. That silent gap is why a student joining with, say, a
 * `@cse.nits.ac.in` address could show up in the admin Users list with no
 * matching entry in the Colleges console at all.
 *
 * Called once from middleware/auth.js, immediately after a brand-new User
 * document is created (i.e. exactly once per account, not on every
 * request). Never blocks or fails signup — the caller wraps this in its
 * own try/catch and only logs on failure; a missing/incomplete college
 * link is a data-completeness issue, not an auth failure.
 *
 * Behavior:
 *   - Consumer domains (gmail.com, yahoo.com, …) are skipped entirely —
 *     never worth a College record.
 *   - An existing College doc for the domain (any non-rejected status) is
 *     reused as-is. This function only ever CREATES a new doc, never
 *     mutates one — it can't clobber an admin's prior review decision,
 *     and it can't produce a duplicate (unique index on `domains`).
 *   - A domain already reviewed and rejected is deliberately NOT
 *     auto-linked — an auto-detected signup shouldn't silently attach a
 *     student to an institution Code Club already declined to recognize.
 *   - A genuinely new domain gets a fresh College doc:
 *     `status: "verified"` if it's already on the VerifiedDomain
 *     allowlist (the same hybrid-verification precedent
 *     routes/tpo.js and routes/collegeVerification.js both already use),
 *     otherwise `status: "pending"` so it surfaces in the admin review
 *     queue like any other student-submitted college. Either way,
 *     `submittedByRole: "auto"` and a best-effort `name` derived from the
 *     domain (collegeNameHeuristics.js) — a guess, always correctable via
 *     the Colleges console's rename action, and flagged there with an
 *     "Auto-detected" badge so it's never presented as a reviewed fact.
 */
export async function autoProvisionCollegeForDomain(domain) {
  if (!domain || isConsumerEmailDomain(domain)) return null;

  try {
    const existing = await College.findByDomain(domain);
    if (existing) {
      return existing.status === "rejected" ? null : existing;
    }

    const recognized = await isDomainAutoVerified(domain, "college");
    const now = new Date();

    // Atomic upsert — same pattern as
    // collegeVerification.js's findOrCreatePendingCollege — so two
    // students signing up from the same brand-new domain near-
    // simultaneously resolve to the same College doc, not two.
    return await College.findOneAndUpdate(
      { domains: domain },
      {
        $setOnInsert: {
          domains: [domain],
          name: deriveCollegeNameFromDomain(domain),
          status: recognized ? "verified" : "pending",
          verifiedAt: recognized ? now : null,
          submittedByRole: "auto",
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  } catch (err) {
    logger.error({ err, domain }, "[CollegeAutoProvision] failed");
    return null;
  }
}
