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

    // ── emailDomain (state-coverage audit fix) ──────────────────────────
    // Documentation had claimed this was indexed on User for a while, but
    // the field, index, backfill script, and signup-time setter were all
    // actually absent — so every TPO/recruiter query filtering by college
    // domain (routes/tpo.js, routes/recruiter.js) was matching against a
    // field no document had ever had a value for, silently returning zero
    // results. Root-caused and confirmed against the live schema before
    // this fix (see the state-coverage remediation notes).
    //
    // Kept in sync via the pre-save hook below rather than only set once
    // at account creation (middleware/auth.js), so it can never drift out
    // of sync with `email` the way education.collegeId/emailVerified
    // above once did under a similar "declared in docs, not in schema"
    // failure mode — any future code path that sets/changes `email`
    // automatically gets the derived domain for free, with no separate
    // call site to remember.
    emailDomain: {
      type: String,
      trim: true,
      lowercase: true,
      default: null,
      index: true,
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
          slug: String,
          difficulty: String,
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

    // ── Saved Problems (private "read later" bookmarks) ─────────────────
    // Not to be confused with pinnedProblems above — that's a solved-only,
    // capped, PUBLIC-profile showcase. This is a private, unlimited,
    // any-status (solved or not) bookmark list, only ever shown to the
    // owner inside the app (Saved view). No title/difficulty denormalized
    // here on purpose — the frontend already has the full problem catalog
    // loaded client-side (useProblems()) whenever this list is rendered,
    // so there's no per-view join cost to avoid, unlike the public-profile
    // case pinnedProblems was built for.
    savedProblems: {
      type: [
        {
          slug: String,
          savedAt: { type: Date, default: Date.now },
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

    // ── Developer Profile (GitHub / LinkedIn / Featured Project / Resume) ──
    // Public-safe fields (githubUrl, linkedinUrl, featuredProjects) are
    // surfaced on the public profile the same tier as recruiterSnapshot.
    // resumeUrl is NOT public by default — gated by resumeVisibility, since
    // saving a resume link should never implicitly mean "show this to
    // anyone who finds my profile." featuredProjects is an array (capped
    // at 1, enforced in userController.js, same convention as
    // pinnedProblems) so this can grow into multiple showcased projects
    // later without a schema migration.
    developerProfile: {
      githubUrl: { type: String, default: null, trim: true, maxlength: 200 },
      linkedinUrl: { type: String, default: null, trim: true, maxlength: 200 },
      resumeUrl: { type: String, default: null, trim: true, maxlength: 500 },
      resumeVisibility: { type: String, enum: ["private", "public"], default: "private" },
      featuredProjects: {
        type: [
          {
            url: String,
            owner: String,
            repo: String,
          },
        ],
        default: [],
      },
    },

    // ── Role system ─────────────────────────────────────────────
    role: {
      type: String,
      enum: ["student", "recruiter", "tpo", "admin"],
      default: "student",
      index: true,
    },

    // ── Account status (Admin console — plan 003) ───────────────────────
    // Only "active"/"suspended" — deliberately NOT "deleted": a suspended
    // user should still resolve to a real account and see "your account
    // is suspended," while a deleted user shouldn't exist for lookups at
    // all. Delete is a real User.deleteOne(), not a status value — see
    // adminController.js's deleteUser for the cascade-decision notes.
    // Enforced in middleware/auth.js's requireAuth (rejects with 403).
    status: {
      type: String,
      enum: ["active", "suspended"],
      default: "active",
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

    // ── Student college verification (Phase 12C) ────────────────────────
    // Distinct from tpoProfile — this is any student proving their own
    // college affiliation, not a TPO representing one. collegeEmail is
    // deliberately separate from the account's login email: a student may
    // have signed up with a personal address and only later add/verify
    // their official college one.
    //
    // Schema-drift fix (plan 005 prerequisite, 2026-08): this sub-schema
    // previously declared the PRE-migration field names (`verified`,
    // `verifiedAt`) and never added the POST-migration ones
    // (`collegeId`, `emailVerified`, `emailVerifiedAt`, `collegeStatus`)
    // that scripts/migrateCollegeSchema.js's own header comment describes
    // migrating TO, and that every live route
    // (routes/collegeVerification.js, adminController.js's
    // approveStudentCollege/rejectStudentCollege) has been reading/writing
    // via direct Mongoose document property access ever since. Under
    // Mongoose's default `strict: true`, assigning an undeclared
    // subdocument path is silently dropped from the `$set` on `.save()` —
    // confirmed against a real (unsaved) Mongoose Document via
    // `doc.$__delta()`, not inferred from a mock. Net effect: every
    // student's `collegeId`/`emailVerified`/`emailVerifiedAt`/
    // `collegeStatus` write since this drift began was silently discarded,
    // meaning approveStudentCollege/rejectStudentCollege's
    // `User.find({ "education.collegeId": ... })` query always matched
    // zero students, and /confirm's `if (user.education.collegeId)` branch
    // always took the "recognized domain, already verified" path — for
    // every student, including ones who submitted an unrecognized-domain
    // college pending admin review. See backend/models/User.integration.test.js
    // for the regression test covering this specific class of bug.
    education: {
      collegeName:    { type: String, default: null, trim: true, maxlength: 120 },
      degree:         { type: String, default: null, trim: true, maxlength: 60 },
      branch:         { type: String, default: null, trim: true, maxlength: 60 },
      graduationYear: { type: Number, default: null },
      collegeEmail:   { type: String, default: null, trim: true, lowercase: true },
      // Links to a College document (backend/models/College.js) ONLY when
      // the student's domain required manual/TPO-driven review — the
      // auto-verified-domain path (see utils/domainVerification.js's
      // VerifiedDomain allowlist) never creates or links a College doc at
      // all, by design, so collegeId legitimately stays null even for a
      // fully verified student. See plan 005's Design decision notes for
      // why a per-college student count built on this field alone can't
      // capture auto-verified-domain students.
      collegeId:        { type: mongoose.Schema.Types.ObjectId, ref: "College", default: null },
      emailVerified:    { type: Boolean, default: false },
      emailVerifiedAt:  { type: Date, default: null },
      // "unset" (never requested) | "pending" (unrecognized domain,
      // awaiting admin review) | "verified" | "rejected".
      collegeStatus: {
        type: String,
        enum: ["unset", "pending", "verified", "rejected"],
        default: "unset",
      },
      // Verification link token — cleared once used or replaced by a new
      // request. Not select()-ed by default so a stray `res.json(user)`
      // elsewhere in the app can't leak it.
      verifyToken:          { type: String, default: null, select: false },
      verifyTokenExpiresAt: { type: Date, default: null, select: false },
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
    // No `default: null` here on purpose — routes/referral.js generates
    // this lazily on first use. A sparse unique index only excludes
    // documents where the field is genuinely ABSENT, not documents where
    // it's explicitly set to null; `default: null` was setting it on every
    // new user, so the first user to sign up occupied the index's one
    // allowed `null` slot and every user created after them failed with
    // E11000 duplicate key on referralCode_1 the moment their account
    // record was created — which is why req.userDoc kept ending up null
    // and every route needing it 503'd with "Database unavailable."
    referralCode: { type: String, unique: true, sparse: true },
    referredBy: { type: String, default: null },
    referralRewardDays: { type: Number, default: 0 },

    // ── Weekly AI review email (commit 097) ──────────────────────────────
    emailPreferences: {
      weeklyReview: { type: Boolean, default: true }, // opt-out, not opt-in
    },
    lastWeeklyReviewSentAt: { type: Date, default: null },

    // ── Editor + display preferences (Settings page) ─────────────────────
    preferences: {
      blankEditorByDefault: { type: Boolean, default: false }, // skip starter code on new problems
      hideDifficultyLabels: { type: Boolean, default: false }, // hide Easy/Medium/Hard badge on problem pages
    },

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

// Keeps emailDomain derived from email on every save, not just at account
// creation — see the emailDomain field comment above for why this exists
// as a hook rather than a one-off setter in middleware/auth.js. Runs on
// every save() regardless of whether email actually changed (cheap: a
// single string split), so there's no isModified("email") branch to
// accidentally get wrong or forget to update if `email`'s validation
// changes later.
userSchema.pre("save", function setEmailDomain() {
  this.emailDomain = this.email
    ? this.email.split("@")[1]?.toLowerCase()
    : undefined;
});

const User = mongoose.model("User", userSchema);

export default User;