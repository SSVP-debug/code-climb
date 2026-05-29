const admin = require("../firebaseAdmin");

async function verifyFirebaseToken(req, res, next) {
  const token = req.headers.authorization?.split("Bearer ")[1];

  if (!token) {
    return res.status(401).json({
      error: "Unauthorized",
    });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);

    req.user = decodedToken;

    next();
  } catch (error) {
    return res.status(401).json({
      error: "Invalid token",
    });
  }
}

module.exports = verifyFirebaseToken;