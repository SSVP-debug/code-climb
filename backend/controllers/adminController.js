/**
 * Admin controller.
 *
 * Extracted from routes/admin.js (Staff review §2/§9: routes/admin.js was
 * one of the large inline-logic route files with no controller behind it).
 * Behavior is unchanged from the previous inline handlers — this is a pure
 * move, plus swapping the ad-hoc `console.error` calls for the structured
 * `logger` used elsewhere in controllers/ (review §9/#18), so these lines
 * get the same redaction/aggregation as the rest of the app's logs.
 *
 * Verification queue (Phase B):
 *   GET  /api/admin/pending
 *   POST /api/admin/recruiters/:id/approve | /reject
 *   POST /api/admin/tpo/:collegeId/approve | /reject
 *
 * Impersonation — "Login As":
 *   GET  /api/admin/users                    — searchable/paginated user list
 *   POST /api/admin/impersonate/:userId       — start viewing as that user
 *   POST /api/admin/impersonate/stop          — return to your own admin session
 *
 * Every route this backs uses requireAdmin (not requireRole("admin")) — see
 * middleware/roleGuard.js for why: while impersonating, req.userDoc.role
 * reflects the *target's* role by design, so a plain requireRole("admin")
 * would lock you out of switching targets or exiting.
 */
import College from "../models/College.js";
import User from "../models/User.js";
import ImpersonationLog from "../models/ImpersonationLog.js";
import { createNotification } from "../services/notificationService.js";
import { invalidateCachedUserByFirebaseUid } from "../utils/userAuthCache.js";
import { logger } from "../config/logger.js";

const RECRUITER_QUEUE_FIELDS = "email displayName recruiterProfile createdAt";

// ── GET /api/admin/pending ──────────────────────────────────────────────────
export async function getPendingQueue(req, res) {
  try {
    const [recruiters, tpoColleges] = await Promise.all([
      User.find(
        { role: "recruiter", "recruiterProfile.verified": false },
        RECRUITER_QUEUE_FIELDS
      )
        .sort({ createdAt: 1 })
        .lean(),
      College.find({ verified: false })
        .populate("adminUserId", "email displayName")
        .sort({ createdAt: 1 })
        .lean(),
    ]);

    return res.json({
      recruiters: recruiters.map((u) => ({
        id: u._id,
        email: u.email,
        displayName: u.displayName,
        companyName: u.recruiterProfile?.companyName,
        designation: u.recruiterProfile?.designation,
        companyDomain: u.recruiterProfile?.companyDomain,
        requestedAt: u.createdAt,
      })),
      tpos: tpoColleges.map((c) => ({
        collegeId: c._id,
        collegeName: c.name,
        domain: c.domain,
        requestedBy: c.adminUserId
          ? { email: c.adminUserId.email, displayName: c.adminUserId.displayName }
          : null,
        requestedAt: c.createdAt,
      })),
    });
  } catch (err) {
    logger.error({ err }, "[Admin] pending queue error");
    return res.status(500).json({ error: "Failed to load pending queue." });
  }
}

// ── POST /api/admin/recruiters/:id/approve ──────────────────────────────────
export async function approveRecruiter(req, res) {
  try {
    const user = await User.findById(req.params.id);

    if (!user || user.role !== "recruiter") {
      return res.status(404).json({ error: "Recruiter not found." });
    }

    user.recruiterProfile.verified = true;
    user.recruiterProfile.verifiedAt = new Date();
    await user.save();
    // This user's own requireAuth cache entry (on whichever instance they
    // next hit) would otherwise still show `verified: false` for up to
    // AUTH_USER_CACHE_TTL_MS — drop it on this instance now so a request
    // that happens to land here sees the fresh doc immediately.
    invalidateCachedUserByFirebaseUid(user.firebaseUid);

    createNotification({
      userId: user._id,
      type: "recruiter_verified",
      title: "Recruiter access approved",
      message: `You're verified for ${user.recruiterProfile.companyName}. Your dashboard is ready.`,
      link: "/recruiter/dashboard",
    }).catch(() => {});

    return res.json({ success: true });
  } catch (err) {
    logger.error({ err }, "[Admin] approve recruiter error");
    return res.status(500).json({ error: "Failed to approve recruiter." });
  }
}

// ── POST /api/admin/recruiters/:id/reject ───────────────────────────────────
export async function rejectRecruiter(req, res) {
  try {
    const user = await User.findById(req.params.id);

    if (!user || user.role !== "recruiter") {
      return res.status(404).json({ error: "Recruiter not found." });
    }

    const companyName = user.recruiterProfile?.companyName;

    user.role = "student";
    user.recruiterProfile = {
      companyName: null,
      designation: null,
      companyDomain: null,
      verified: false,
      verifiedAt: null,
    };
    await user.save();
    invalidateCachedUserByFirebaseUid(user.firebaseUid);

    createNotification({
      userId: user._id,
      type: "recruiter_rejected",
      title: "Recruiter access request declined",
      message: companyName
        ? `We couldn't verify your request for ${companyName}. Reach out if this was a mistake.`
        : "We couldn't verify your recruiter access request.",
      link: "/recruiter/signup",
    }).catch(() => {});

    return res.json({ success: true });
  } catch (err) {
    logger.error({ err }, "[Admin] reject recruiter error");
    return res.status(500).json({ error: "Failed to reject recruiter." });
  }
}

// ── POST /api/admin/tpo/:collegeId/approve ──────────────────────────────────
export async function approveTpo(req, res) {
  try {
    const college = await College.findById(req.params.collegeId);

    if (!college) {
      return res.status(404).json({ error: "College request not found." });
    }

    const now = new Date();
    college.verified = true;
    college.verifiedAt = now;
    await college.save();

    await User.updateMany(
      { role: "tpo", "tpoProfile.collegeDomain": college.domain, "tpoProfile.verified": false },
      { $set: { "tpoProfile.verified": true, "tpoProfile.verifiedAt": now } }
    );

    if (college.adminUserId) {
      createNotification({
        userId: college.adminUserId,
        type: "tpo_verified",
        title: "TPO access approved",
        message: `${college.name} is verified. Your placement dashboard is ready.`,
        link: "/tpo/dashboard",
      }).catch(() => {});
    }

    return res.json({ success: true });
  } catch (err) {
    logger.error({ err }, "[Admin] approve TPO error");
    return res.status(500).json({ error: "Failed to approve TPO." });
  }
}

// ── POST /api/admin/tpo/:collegeId/reject ───────────────────────────────────
export async function rejectTpo(req, res) {
  try {
    const college = await College.findById(req.params.collegeId);

    if (!college) {
      return res.status(404).json({ error: "College request not found." });
    }

    const requesterId = college.adminUserId;
    const collegeName = college.name;

    await College.deleteOne({ _id: college._id });

    if (requesterId) {
      const user = await User.findById(requesterId);
      if (user && user.role === "tpo") {
        user.role = "student";
        user.tpoProfile = {
          collegeDomain: null,
          collegeName: null,
          verified: false,
          requestedAt: null,
          verifiedAt: null,
        };
        await user.save();
        invalidateCachedUserByFirebaseUid(user.firebaseUid);
      }

      createNotification({
        userId: requesterId,
        type: "tpo_rejected",
        title: "TPO access request declined",
        message: `We couldn't verify your request for ${collegeName}. Reach out if this was a mistake.`,
        link: "/tpo/signup",
      }).catch(() => {});
    }

    return res.json({ success: true });
  } catch (err) {
    logger.error({ err }, "[Admin] reject TPO error");
    return res.status(500).json({ error: "Failed to reject TPO request." });
  }
}

// ── GET /api/admin/users ─────────────────────────────────────────────────────
// Searchable, paginated user list backing the "Login As" table. Admin
// accounts are excluded entirely — impersonating another admin isn't a
// supported flow (see the guard in startImpersonation too).
export async function listUsers(req, res) {
  try {
    const { role, search, page = 1, limit = 20 } = req.query;

    const filter = { role: { $ne: "admin" } };
    if (role && ["student", "recruiter", "tpo"].includes(role)) {
      filter.role = role;
    }
    if (search) {
      filter.$or = [
        { displayName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { username: { $regex: search, $options: "i" } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, parseInt(limit));

    const [users, total] = await Promise.all([
      User.find(
        filter,
        "displayName email username role recruiterProfile.companyName recruiterProfile.verified tpoProfile.collegeName tpoProfile.verified createdAt"
      )
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
      User.countDocuments(filter),
    ]);

    return res.json({
      users: users.map((u) => ({
        id: u._id,
        displayName: u.displayName,
        email: u.email,
        username: u.username,
        role: u.role,
        label:
          u.role === "recruiter"
            ? u.recruiterProfile?.companyName
            : u.role === "tpo"
            ? u.tpoProfile?.collegeName
            : null,
        verified:
          u.role === "recruiter"
            ? Boolean(u.recruiterProfile?.verified)
            : u.role === "tpo"
            ? Boolean(u.tpoProfile?.verified)
            : true,
        joinedAt: u.createdAt,
      })),
      total,
      page: pageNum,
      limit: limitNum,
    });
  } catch (err) {
    logger.error({ err }, "[Admin] users list error");
    return res.status(500).json({ error: "Failed to load users." });
  }
}

// ── POST /api/admin/impersonate/:userId ─────────────────────────────────────
export async function startImpersonation(req, res) {
  try {
    // req.actingAdminDoc is only set while already impersonating (switching
    // targets directly); otherwise req.userDoc IS the real admin.
    const adminDoc = req.actingAdminDoc || req.userDoc;
    const target = await User.findById(req.params.userId);

    if (!target) {
      return res.status(404).json({ error: "User not found." });
    }
    if (target.role === "admin") {
      return res.status(400).json({ error: "Impersonating another admin isn't supported." });
    }
    if (String(target._id) === String(adminDoc._id)) {
      return res.status(400).json({ error: "You can't impersonate yourself." });
    }

    // Switching targets mid-impersonation — close out the previous log entry.
    if (adminDoc.impersonating?.targetUserId) {
      await ImpersonationLog.updateOne(
        {
          adminId: adminDoc._id,
          targetUserId: adminDoc.impersonating.targetUserId,
          endedAt: null,
        },
        { $set: { endedAt: new Date() } }
      );
    }

    const now = new Date();
    adminDoc.impersonating = { targetUserId: target._id, startedAt: now };
    await adminDoc.save();

    await ImpersonationLog.create({
      adminId: adminDoc._id,
      adminEmail: adminDoc.email,
      targetUserId: target._id,
      targetEmail: target.email,
      targetRole: target.role,
      startedAt: now,
    });

    return res.json({
      success: true,
      impersonating: {
        id: target._id,
        email: target.email,
        displayName: target.displayName,
        role: target.role,
      },
    });
  } catch (err) {
    logger.error({ err }, "[Admin] impersonate start error");
    return res.status(500).json({ error: "Failed to start impersonation." });
  }
}

// ── POST /api/admin/impersonate/stop ────────────────────────────────────────
export async function stopImpersonation(req, res) {
  try {
    const adminDoc = req.actingAdminDoc || req.userDoc;

    if (adminDoc.impersonating?.targetUserId) {
      await ImpersonationLog.updateOne(
        {
          adminId: adminDoc._id,
          targetUserId: adminDoc.impersonating.targetUserId,
          endedAt: null,
        },
        { $set: { endedAt: new Date() } }
      );
    }

    adminDoc.impersonating = { targetUserId: null, startedAt: null };
    await adminDoc.save();

    return res.json({ success: true });
  } catch (err) {
    logger.error({ err }, "[Admin] impersonate stop error");
    return res.status(500).json({ error: "Failed to stop impersonation." });
  }
}
