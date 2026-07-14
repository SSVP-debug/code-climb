import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    firebaseUid: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    displayName: {
      type: String,
      trim: true,
    },

    username: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },

    isProfilePublic: {
      type: Boolean,
      default: true,
    },

    leetcodeUsername: String,

    // Solve-history stats, separate from leetcodeUsername above (which
    // predates this and is already wired through progress.js/userController.js
    // — left untouched). Populated either by manual entry or by the
    // /api/leetcode/fetch proxy pre-filling the form for the student to
    // confirm. Not fed into totalXP/solvedSlugs — LeetCode problems aren't
    // in this platform's own catalog, so there's nothing to map them to;
    // this exists purely as recruiter-facing supplementary proof of work
    // on the public profile.
    leetcodeStats: {
      easySolved: { type: Number, default: 0, min: 0 },
      mediumSolved: { type: Number, default: 0, min: 0 },
      hardSolved: { type: Number, default: 0, min: 0 },
      totalSolved: { type: Number, default: 0, min: 0 },
      source: { type: String, enum: ["manual", "api"], default: "manual" },
      lastSyncedAt: { type: Date, default: null },
    },


    joinedDate: {
      type: Date,
      default: Date.now,
    },

    solvedSlugs: {
      type: [String],
      default: [],
    },
    topicStats: {
      type: Map,
      of: Number,
      default: {},
    },
    activityDates: {
      type: [String],
      default: [],
    },
    solvedDifficulty: {
      easy: { type: Number, default: 0, min: 0 },
      medium: { type: Number, default: 0, min: 0 },
      hard: { type: Number, default: 0, min: 0 },
    },
    recentActivity: {
      type: [
        {
          title: String,
          time: String,
        },
      ],
      default: [],
    },
    currentStreak: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalXP: {
      type: Number,
      default: 0,
      min: 0,
    },

    longestStreak: {
      type: Number,
      default: 0,
      min: 0,
    },

    lastActivityDate: {
      type: String,
      default: null,
    },
    achievements: {
      type: [
        {
          key: String,
          unlockedAt: Date,
        },
      ],
      default: [],
    },

    dailyHintLog: {
      date: {
        type: String,
        default: null,
      },
      count: {
        type: Number,
        default: 0,
      },
    },

    pdfDownloadLog: {
      month: {
        type: String,
        default: null,
      },
      count: {
        type: Number,
        default: 0,
      },
    },

    subscription: {
      plan: { type: String, default: "free" },
      status: { type: String, enum: ["none", "active", "cancelled", "expired"], default: "none" },
      startedAt: { type: Date, default: null },
      expiresAt: { type: Date, default: null },
      cancelledAt: { type: Date, default: null },
    },

    // ── Pinned Favorite Problems (Phase 9D) ─────────────────────────────
    // Denormalized (slug + title + difficulty stored together) at pin
    // time, same convention as recentActivity above — avoids a Problem
    // join on every public-profile view. Capped at 6, enforced in
    // userController.js, not here (schema-level array caps are awkward
    // with Mongoose's update operators).
    pinnedProblems: {
      type: [
        {
          slug: String,
          title: String,
          difficulty: String,
        },
      ],
      default: [],
    },

    // ── Recruiter Snapshot (Phase 9C) ───────────────────────────────────
    // NOT to be confused with recruiterProfile above — that's for users
    // whose role IS "recruiter". This is what a STUDENT fills in so
    // recruiters/TPOs viewing their profile know availability at a glance.
    // Surfaced read-only on the public profile; editable on /profile.
    recruiterSnapshot: {
      availableForWork: { type: Boolean, default: false },
      preferredRole: { type: String, default: null, trim: true, maxlength: 60 },
      expectedGraduation: { type: String, default: null, trim: true, maxlength: 20 },
    },

    // ── Role system ─────────────────────────────────────────────
    role: {
      type: String,
      enum: ["student", "recruiter", "tpo", "admin"],
      default: "student",
      index: true,
    },

    // ── Admin impersonation ("Login As") ──────────────────────────────────
    // Only ever meaningful on an admin account. When set, requireAuth
    // transparently swaps req.userDoc to the target user for the duration
    // of the request, while req.actingAdminDoc keeps the real admin's
    // identity so admin-only routes (switch target, exit) stay reachable.
    // See middleware/auth.js and ImpersonationLog for the audit trail.
    impersonating: {
      targetUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
      startedAt: { type: Date, default: null },
    },

    // ── Recruiter-specific fields ─────────────────────────────────────────
    recruiterProfile: {
      companyName: { type: String, default: null },
      designation: { type: String, default: null },
      companyDomain: { type: String, default: null }, // e.g. "google.com"
      verified: { type: Boolean, default: false },
      verifiedAt: { type: Date, default: null },
    },

    // ── TPO-specific fields ─────────────────────────────────────────
    tpoProfile: {
      collegeDomain: { type: String, default: null },
      collegeName: { type: String, default: null },
      verified: { type: Boolean, default: false },
      requestedAt: { type: Date, default: null },
      verifiedAt: { type: Date, default: null },
    },

    // ── Profile verification hash (commit 085) ────────────────────────────
    // HMAC-SHA256 of (userId + solvedCount + timestamp) — proves data wasn't
    // tampered. Recruiters can verify at /verify/:username.
    profileSignature: {
      hash: { type: String, default: null },
      signedAt: { type: Date, default: null },
      solvedCount: { type: Number, default: 0 },
    },

    // ── Certifications earned (commit 087) ───────────────────────────────
    certificates: [{
      trackId: { type: String },   // e.g. "arrays", "dynamic-programming"
      trackName: { type: String },
      issuedAt: { type: Date },
      verifyCode: { type: String },   // short unique code for QR verification
    }],

    // ── Referrals (Phase 6 — add here if missing) ────────────────────────
    referralCode: { type: String, default: null, unique: true, sparse: true },
    referredBy: { type: String, default: null },
    referralRewardDays: { type: Number, default: 0 },

    // ── Weekly AI review email (commit 097) ──────────────────────────────
    emailPreferences: {
      weeklyReview: { type: Boolean, default: true }, // opt-out, not opt-in
    },
    lastWeeklyReviewSentAt: { type: Date, default: null },

    dailyChallengeHistory: {
      type: [
        {
          date: String,
          slug: String,
          completed: Boolean,
          completedAt: Date,
        },
      ],
      default: [],
    },

    problemNotes: {
      type: Map,
      of: String,
      default: () => new Map(),
    },


  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;