import Problem from "../models/Problem.js";
import { invalidateProfileCache } from "./publicProfileController.js";

// Controlled vocabulary for preferredRole — keeps the field filterable on
// the recruiter/TPO side (a free-text field would fragment into "Backend",
// "backend dev", "Backend Developer", etc. and be useless for search).
export const PREFERRED_ROLES = [
  "Backend",
  "Frontend",
  "Full Stack",
  "Mobile",
  "Data / ML",
  "DevOps",
  "QA",
  "Other",
];

const CURRENT_YEAR = new Date().getFullYear();

function isValidGraduationYear(value) {
  if (!/^\d{4}$/.test(value)) return false;
  const year = Number(value);
  // Generous window: a few years back (recent grads still job-hunting)
  // through 8 years out (nobody's placement-planning further than that).
  return year >= CURRENT_YEAR - 5 && year <= CURRENT_YEAR + 8;
}

function serializeUser(userDoc) {
  return {
    id: userDoc._id,
    firebaseUid: userDoc.firebaseUid,
    email: userDoc.email,
    displayName: userDoc.displayName,
    username: userDoc.username || "",
    isProfilePublic: userDoc.isProfilePublic,

    leetcodeUsername: userDoc.leetcodeUsername || "",
    leetcodeStats: userDoc.leetcodeStats || null,
    joinedDate: userDoc.joinedDate,
    emailPreferences: userDoc.emailPreferences || { weeklyReview: true },

    recruiterSnapshot: {
      availableForWork: userDoc.recruiterSnapshot?.availableForWork ?? false,
      preferredRole: userDoc.recruiterSnapshot?.preferredRole ?? null,
      expectedGraduation: userDoc.recruiterSnapshot?.expectedGraduation ?? null,
    },

    pinnedProblems: userDoc.pinnedProblems || [],
  };
}

export async function getMe(req, res) {
  res.json(serializeUser(req.userDoc));
}

export async function updateMe(req, res) {
  const {
    leetcodeUsername,
    displayName,
    username,
    emailPreferences,
    recruiterSnapshot,
  } = req.body;

  if (leetcodeUsername !== undefined) {
    req.userDoc.leetcodeUsername = leetcodeUsername;
  }

  if (displayName !== undefined) {
    req.userDoc.displayName = displayName;
  }

  if (username !== undefined) {
    const normalized =
      username
        .trim()
        .toLowerCase();

    const valid =
      /^[a-z0-9_-]{3,20}$/.test(
        normalized
      );

    if (!valid) {
      return res.status(400).json({
        error:
          "Username must be 3-20 chars and contain only letters, numbers, _ or -",
      });
    }

    const existing =
      await req.userDoc.constructor.findOne(
        {
          username: normalized,
          _id: {
            $ne:
              req.userDoc._id,
          },
        }
      );

    if (existing) {
      return res.status(409).json({
        error:
          "Username already taken",
      });
    }

    req.userDoc.username =
      normalized;
  }
  

  if (emailPreferences !== undefined && typeof emailPreferences.weeklyReview === "boolean") {
    req.userDoc.emailPreferences = {
      ...(req.userDoc.emailPreferences || {}),
      weeklyReview: emailPreferences.weeklyReview,
    };
  }

  if (recruiterSnapshot !== undefined) {
    const { availableForWork, preferredRole, expectedGraduation } = recruiterSnapshot;
    const next = { ...(req.userDoc.recruiterSnapshot?.toObject?.() ?? req.userDoc.recruiterSnapshot ?? {}) };

    if (availableForWork !== undefined) {
      if (typeof availableForWork !== "boolean") {
        return res.status(400).json({ error: "availableForWork must be a boolean" });
      }
      next.availableForWork = availableForWork;
    }

    if (preferredRole !== undefined) {
      if (preferredRole !== null && !PREFERRED_ROLES.includes(preferredRole)) {
        return res.status(400).json({
          error: `preferredRole must be one of: ${PREFERRED_ROLES.join(", ")}`,
        });
      }
      next.preferredRole = preferredRole;
    }

    if (expectedGraduation !== undefined) {
      if (expectedGraduation !== null && !isValidGraduationYear(expectedGraduation)) {
        return res.status(400).json({
          error: "expectedGraduation must be a 4-digit year within a reasonable range",
        });
      }
      next.expectedGraduation = expectedGraduation;
    }

    req.userDoc.recruiterSnapshot = next;
  }

  await req.userDoc.save();

  // Public profile is cached for 2 minutes (see publicProfileController).
  // A student flipping "available for work" on shouldn't have to wait for
  // that TTL to expire before recruiters see it. Fire-and-forget, same
  // pattern as progressController — cache invalidation failure must never
  // block the save response.
  res.json(serializeUser(req.userDoc));
}

// ── Pinned Favorite Problems (Phase 9D) ────────────────────────────────────

const MAX_PINNED_PROBLEMS = 6;

export async function pinProblem(req, res) {
  const { slug } = req.body;

  if (!slug || typeof slug !== "string") {
    return res.status(400).json({ error: "slug is required" });
  }

  // Favorites are meant to showcase real, solved work — not a wishlist.
  // This also means we never need to worry about someone pinning a
  // problem before they've actually solved it and the display looking
  // hollow on their public profile.
  if (!req.userDoc.solvedSlugs.includes(slug)) {
    return res.status(400).json({ error: "You can only pin problems you've solved" });
  }

  const already = req.userDoc.pinnedProblems.some((p) => p.slug === slug);
  if (already) {
    return res.json(serializeUser(req.userDoc));
  }

  if (req.userDoc.pinnedProblems.length >= MAX_PINNED_PROBLEMS) {
    return res.status(400).json({
      error: `You can pin up to ${MAX_PINNED_PROBLEMS} problems. Unpin one first.`,
    });
  }

  const problem = await Problem.findOne({ slug }).select("title difficulty").lean();
  if (!problem) {
    return res.status(404).json({ error: "Problem not found" });
  }

  req.userDoc.pinnedProblems.push({
    slug,
    title: problem.title,
    difficulty: problem.difficulty,
  });

  await req.userDoc.save();

  invalidateProfileCache(req.userDoc.username).catch((err) =>
    req.log?.error?.({ err }, "[userController] invalidateProfileCache failed")
  );

  res.json(serializeUser(req.userDoc));
}

export async function unpinProblem(req, res) {
  const { slug } = req.params;

  req.userDoc.pinnedProblems = req.userDoc.pinnedProblems.filter((p) => p.slug !== slug);

  await req.userDoc.save();

  invalidateProfileCache(req.userDoc.username).catch((err) =>
    req.log?.error?.({ err }, "[userController] invalidateProfileCache failed")
  );

  res.json(serializeUser(req.userDoc));
}