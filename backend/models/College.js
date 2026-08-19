import mongoose from "mongoose";

/**
 * College — an institution/domain record with a review lifecycle.
 *
 * Three submitter paths write into this same collection:
 *   - TPO registration (backend/routes/tpo.js) — submittedByRole: "tpo"
 *   - Student college-email verification (backend/routes/collegeVerification.js)
 *     — submittedByRole: "student"
 *   - Automatic detection at signup, for any institutional (non-consumer)
 *     email domain that doesn't already have a College doc
 *     (backend/services/collegeAutoProvision.js, called from
 *     middleware/auth.js on first login) — submittedByRole: "auto". No
 *     human submitted these; `name` is a best-effort guess derived from
 *     the domain (see utils/collegeNameHeuristics.js) and `submittedBy`
 *     stays null. Always correctable by an admin via the Colleges
 *     console's rename action — the frontend flags these with an
 *     "Auto-detected" badge so a guess never reads as a reviewed fact.
 *
 * `status` here is the institution's own trust state — separate from
 * whether any individual user has verified ownership of an email at this
 * domain. See backend/models/User.js `education.emailVerified` /
 * `education.collegeStatus` for that distinction.
 *
 * A college may have multiple legitimate domains (e.g. an old + new domain,
 * or separate campuses), so `domains` is an array, not a single string.
 * `domains[0]` is always the domain the record was originally created from.
 */
const collegeSchema = new mongoose.Schema(
  {
    domains: {
      type: [String],
      required: true,
      validate: {
        validator: (arr) =>
          Array.isArray(arr) && arr.length > 0 && arr.every((d) => typeof d === "string" && d.length > 0),
        message: "domains must be a non-empty array of non-empty strings",
      },
      set: (arr) => (Array.isArray(arr) ? arr.map((d) => d.toLowerCase().trim()) : arr),
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    website: {
      type: String,
      default: null,
      trim: true,
    },

    country: {
      type: String,
      default: null,
      trim: true,
    },

    status: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
      index: true,
    },

    verifiedAt: {
      type: Date,
      default: null,
    },

    // Renamed from adminUserId — this was never TPO-admin-only in spirit,
    // it's "whoever submitted this institution for review."
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    submittedByRole: {
      type: String,
      enum: ["student", "tpo", "auto"],
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// A domain can only belong to one institution record. Multikey unique index
// on the array field — Mongo enforces uniqueness per array element, i.e. no
// two College docs may claim the same domain.
collegeSchema.index({ domains: 1 }, { unique: true });

collegeSchema.statics.findByDomain = function (domain) {
  return this.findOne({ domains: domain?.toLowerCase().trim() });
};

export default mongoose.model("College", collegeSchema);