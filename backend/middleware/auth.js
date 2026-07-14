import { getFirebaseAdmin } from "../config/firebaseAdmin.js";
import { logger } from "../config/logger.js";
import User from "../models/User.js";

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";

    if (!header.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Missing or invalid Authorization header",
      });
    }

    const token = header.slice(7);

    const decoded = await getFirebaseAdmin()
      .auth()
      .verifyIdToken(token);

    req.auth = {
      uid: decoded.uid,
      email: decoded.email,
      name: decoded.name,
      picture: decoded.picture,
      provider: decoded.firebase?.sign_in_provider,
    };

    try {
      let userDoc = await User.findOne({
        firebaseUid: decoded.uid,
      });

      if (!userDoc) {
        userDoc = await User.create({
          firebaseUid: decoded.uid,
          email: decoded.email || "",
          displayName: decoded.name || "",
        });
      }

      req.userDoc = userDoc;
      req.actingAdminDoc = null;

      // ── Admin impersonation ("Login As") ────────────────────────────
      // If this admin currently has a target set, swap req.userDoc to the
      // target for the rest of the request — every downstream route
      // (roleGuard, requireVerified, data ownership, everything) then
      // transparently operates as that user. req.actingAdminDoc keeps the
      // real admin's identity so admin-only routes (switch target, exit)
      // stay reachable without needing to exit impersonation first.
      if (userDoc.role === "admin" && userDoc.impersonating?.targetUserId) {
        const targetUser = await User.findById(userDoc.impersonating.targetUserId);

        if (targetUser) {
          req.actingAdminDoc = userDoc;
          req.userDoc = targetUser;
        } else {
          // Target account no longer exists (e.g. deleted) — clear the
          // stale pointer instead of leaving the admin stuck.
          userDoc.impersonating = { targetUserId: null, startedAt: null };
          await userDoc.save();
        }
      }
    } catch (mongoError) {
      req.log.warn({ err: mongoError }, "[Auth] Mongo unavailable, continuing with Firebase auth only");

      req.userDoc = null;
    }

    return next();

  } catch (error) {
    (req.log || logger).error({ err: error }, "[Auth] Token verification failed");

    return res.status(401).json({
      error: "Unauthorized",
    });
  }
}