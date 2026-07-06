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