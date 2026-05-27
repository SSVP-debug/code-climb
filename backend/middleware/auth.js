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

    let user = await User.findOne({
      firebaseUid: decoded.uid,
    });

    if (!user) {
      user = await User.create({
        firebaseUid: decoded.uid,
        email: decoded.email || "",
        displayName: decoded.name || decoded.email || "",
      });
      console.log(
        `[Auth] Created user ${decoded.uid}`
      );
    }

    req.auth = {
      uid: decoded.uid,
      email: decoded.email,
    };
    req.userDoc = user;

    next();
  } catch (error) {
    console.error("[Auth] Token verification failed:", error.message);
    return res.status(401).json({ error: "Unauthorized" });
  }
}
