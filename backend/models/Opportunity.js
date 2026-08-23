import mongoose from "mongoose";

/**
 * Opportunity.js — Code Club Opportunity Radar.
 *
 * Code Club discovers, verifies, and curates opportunities from external
 * organizations (internships, hackathons, fellowships, etc.) and publishes
 * them as a canonical Code Club page. Code Club is never the opportunity
 * provider — `officialApplicationUrl` always points to the real
 * organization's own application, and the Apply button on the public page
 * only ever uses that stored URL (see routes/opportunities.js).
 *
 * ── Status lifecycle ────────────────────────────────────────────────────
 *   draft → pending_review → approved → published
 *                          ↘ rejected
 *   published → expired (deadline passed, or manually closed)
 *   any non-published status → archived (soft-removed from admin's active
 *   working set, but never deleted — historical record is retained)
 *
 * Only `published` (and not expired) opportunities are ever returned by
 * the public routes in routes/opportunities.js. Nothing here becomes
 * visible to students until an admin explicitly calls the publish
 * transition — see adminOpportunityController.js.
 *
 * ── Human-readable ID ───────────────────────────────────────────────────
 * `ccId` (e.g. "CC/001") is the public identifier — allocated once, on
 * first creation, via Counter.js's atomic nextSequence("opportunity").
 * MongoDB's ObjectId (`_id`) is never exposed in a public URL.
 */
const opportunitySchema = new mongoose.Schema(
  {
    // ── Identity ──────────────────────────────────────────────────────
    ccId: { type: String, required: true, unique: true }, // "CC/001"
    ccNumber: { type: Number, required: true, unique: true }, // 1, 2, 3... (sortable)
    slug: { type: String, required: true, unique: true }, // url-safe, derived from title

    // ── Core content ─────────────────────────────────────────────────
    title: { type: String, required: true, trim: true },
    organization: { type: String, required: true, trim: true },
    organizationLogoUrl: { type: String, default: null },
    type: {
      type: String,
      required: true,
      enum: [
        "internship",
        "hackathon",
        "research_internship",
        "open_source_program",
        "fellowship",
        "coding_competition",
        "student_program",
        "scholarship",
        "developer_program",
        "entry_level_job",
        "other",
      ],
    },
    category: { type: String, required: true, trim: true }, // e.g. "Software Engineering"
    shortSummary: { type: String, required: true, trim: true, maxlength: 220 },
    description: { type: String, required: true },

    // ── Eligibility ──────────────────────────────────────────────────
    eligibility: { type: String, default: "" }, // free-text summary
    eligibleDegrees: [{ type: String }], // e.g. ["B.Tech", "M.Tech"]
    eligibleBranches: [{ type: String }], // e.g. ["CSE", "IT", "ECE"]
    eligibleGraduationYears: [{ type: Number }], // e.g. [2026, 2027]
    minYear: { type: Number, default: null }, // min college year (1-4/5)
    maxYear: { type: Number, default: null },

    // ── Location & compensation ────────────────────────────────────────
    location: { type: String, default: "" }, // free-text ("Bengaluru, India")
    workMode: { type: String, enum: ["remote", "hybrid", "onsite"], default: "remote" },
    country: { type: String, default: "" },
    stipend: { type: String, default: "" }, // free-text ("₹40,000/month") — currencies/ranges vary too much for a strict number
    prize: { type: String, default: "" },
    compensationNotes: { type: String, default: "" },

    // ── Timing ──────────────────────────────────────────────────────
    duration: { type: String, default: "" }, // free-text ("8 weeks")
    applicationDeadline: { type: Date, default: null }, // null = no deadline, stays active until manually closed
    startDate: { type: Date, default: null },

    // ── Links ─────────────────────────────────────────────────────────
    // Deliberately two distinct URLs, kept apart end-to-end (schema, admin
    // form, admin API, public page) per PART 4/17's explicit requirement —
    // the Apply CTA only ever reads officialApplicationUrl.
    officialApplicationUrl: { type: String, required: true },
    officialSourceUrl: { type: String, required: true },

    // ── Verification ──────────────────────────────────────────────────
    verificationStatus: {
      type: String,
      enum: ["unverified", "verified"],
      default: "unverified",
    },
    verificationNotes: { type: String, default: "" }, // admin-only, never exposed publicly
    lastVerifiedAt: { type: Date, default: null },

    // ── Workflow ──────────────────────────────────────────────────────
    status: {
      type: String,
      enum: ["draft", "pending_review", "approved", "published", "rejected", "expired", "archived"],
      default: "draft",
      index: true,
    },
    sourceType: {
      type: String,
      enum: ["manual", "ai_research"], // PART 16: architecture allows a future AI-submitted source, always landing in pending_review, never auto-published
      default: "manual",
    },
    rejectionReason: { type: String, default: "" },

    discoveredAt: { type: Date, default: Date.now },
    reviewedAt: { type: Date, default: null },
    publishedAt: { type: Date, default: null },
    expiredAt: { type: Date, default: null },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    // ── Analytics — plain incrementing counters, same lightweight style as
    // XP/streak fields on User.js. No per-event log; PART 13/19 explicitly
    // rule out fabricated/invented metrics like share counts, so only
    // what's actually measurable is tracked. ─────────────────────────────
    viewCount: { type: Number, default: 0 },
    applyClickCount: { type: Number, default: 0 },
    sourceBreakdown: {
      whatsapp: { type: Number, default: 0 },
      discord: { type: Number, default: 0 },
      linkedin: { type: Number, default: 0 },
      direct: { type: Number, default: 0 },
      other: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

opportunitySchema.index({ status: 1, applicationDeadline: 1 });
opportunitySchema.index({ status: 1, publishedAt: -1 });
opportunitySchema.index({ type: 1, status: 1 });

/**
 * isExpiredByDeadline — pure helper, no DB write. Deadline-passed
 * published opportunities are treated as expired lazily wherever they're
 * read (see opportunityController.js / adminOpportunityController.js),
 * rather than via a cron sweep — the doc's stored `status` only actually
 * flips to "expired" the next time it's touched by a read or write path
 * that calls maybeExpire() below. This keeps the feature dependency-free
 * (no new scheduler infra) at the cost of a status field that can be
 * momentarily stale between the deadline passing and the next read —
 * acceptable since nothing except this lazy check treats `status` as the
 * sole source of truth for "is this open" (public routes / listing always
 * re-derive from the deadline too).
 */
opportunitySchema.methods.isExpiredByDeadline = function () {
  return Boolean(
    this.applicationDeadline && this.applicationDeadline.getTime() < Date.now()
  );
};

export default mongoose.model("Opportunity", opportunitySchema);
