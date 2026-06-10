import { getFirebaseAdmin } from "../config/firebaseAdmin.js";
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
    };

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

    return next();

  } catch (error) {
    console.error("[Auth] FULL ERROR:", error);

    return res.status(401).json({
      error: error.message,
    });
  }
}