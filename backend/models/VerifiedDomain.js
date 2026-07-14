import mongoose from "mongoose";

/**
 * VerifiedDomain — the allowlist that drives instant verification for
 * Recruiter and TPO signups (Phase B, "hybrid" verification).
 *
 * A single collection covers both roles, distinguished by `type`:
 *   - "company" — checked against recruiterProfile.companyDomain on
 *     POST /api/recruiter/register
 *   - "college" — checked against the email domain on
 *     POST /api/tpo/register
 *
 * Domain found here          → instant verified: true, no admin step.
 * Domain not found here      → account is created in "pending" state
 *                               (unchanged from existing behavior) and
 *                               surfaces in the admin approval queue
 *                               (GET /api/admin/pending).
 *
 * This is intentionally just a growing list, not a hardcoded array in
 * route code — new domains can be added via the seed script or later via
 * an admin-only "always trust this domain" action after a manual approval,
 * without a deploy.
 */
const verifiedDomainSchema = new mongoose.Schema(
  {
    domain: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["company", "college"],
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    // "seed" — preloaded via scripts/seedVerifiedDomains.js
    // "admin" — added by an admin approving a previously-pending domain
    addedBy: {
      type: String,
      enum: ["seed", "admin"],
      default: "seed",
    },
  },
  { timestamps: true }
);

const VerifiedDomain = mongoose.model("VerifiedDomain", verifiedDomainSchema);
export default VerifiedDomain;