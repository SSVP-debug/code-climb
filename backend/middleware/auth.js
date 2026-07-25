import { getFirebaseAdmin } from "../config/firebaseAdmin.js";
import { logger } from "../config/logger.js";
import User from "../models/User.js";
import {
  getCachedUserByFirebaseUid,
  setCachedUserByFirebaseUid,
  getCachedUserById,
  setCachedUserById,
} from "../utils/userAuthCache.js";

/**
 * Verifies the Bearer token on `req` and resolves req.auth / req.userDoc /
 * req.actingAdminDoc onto it (same shape/semantics as before this file was
 * split: cached user lookup, admin impersonation swap, etc). Throws if
 * there's no valid token — callers decide what "invalid" means for them
 * (requireAuth: reject with 401; optionalAuth: continue unauthenticated).
 *
 * Extracted so requireAuth and optionalAuth can't drift out of sync on
 * the actual auth-resolution logic — only their failure handling differs.
 */
async function resolveAuthenticatedUser(req) {
  const header = req.headers.authorization || "";

  if (!header.startsWith("Bearer ")) {
    throw new Error("Missing or invalid Authorization header");
  }

  const token = header.slice(7);

  const decoded = await getFirebaseAdmin().auth().verifyIdToken(token);

  req.auth = {
    uid: decoded.uid,
    email: decoded.email,
    name: decoded.name,
    picture: decoded.picture,
    provider: decoded.firebase?.sign_in_provider,
  };

  try {
    // ── User lookup, short-TTL cached (utils/userAuthCache.js) ────────
    // This used to be a Mongo round trip on every single authenticated
    // request. A cache HIT here returns the *live* Mongoose document
    // reference (not a copy), so any route further down the chain that
    // mutates req.userDoc and calls .save() is safe — see the cache
    // module's header comment for why that matters and what it does
    // and doesn't bound.
    let userDoc = getCachedUserByFirebaseUid(decoded.uid);

    if (!userDoc) {
      userDoc = await User.findOne({
        firebaseUid: decoded.uid,
      });

      if (!userDoc) {
        userDoc = await User.create({
          firebaseUid: decoded.uid,
          email: decoded.email || "",
          displayName: decoded.name || "",
        });
      }

      setCachedUserByFirebaseUid(decoded.uid, userDoc);
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
      const targetUserId = userDoc.impersonating.targetUserId;
      let targetUser = getCachedUserById(targetUserId);

      if (!targetUser) {
        targetUser = await User.findById(targetUserId);
        if (targetUser) setCachedUserById(targetUserId, targetUser);
      }

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
    (req.log || logger).warn(
      { err: mongoError },
      "[Auth] Mongo unavailable, continuing with Firebase auth only"
    );

    req.userDoc = null;
  }
}

export async function requireAuth(req, res, next) {
  try {
    await resolveAuthenticatedUser(req);
    return next();
  } catch (error) {
    (req.log || logger).error({ err: error }, "[Auth] Token verification failed");

    return res.status(401).json({
      error: "Unauthorized",
    });
  }
}

/**
 * Like requireAuth, but never rejects the request for a missing or invalid
 * token — it just leaves req.userDoc / req.auth unset and calls next().
 * For routes that are reachable both logged-out and logged-in, and want
 * to personalize the response when a valid session IS present (e.g.
 * GET /api/problems/:slug using req.userDoc.solvedSlugs to filter the
 * "Next Best Problem" recommendation) without forcing auth on everyone.
 */
export async function optionalAuth(req, res, next) {
  try {
    await resolveAuthenticatedUser(req);
  } catch (error) {
    // No/invalid token is expected here (that's the whole point of this
    // middleware) — only log at debug-ish level, not as an error.
    (req.log || logger).info(
      { reason: error.message },
      "[Auth] optionalAuth: continuing without an authenticated user"
    );
    req.auth = null;
    req.userDoc = null;
  }
  return next();
}