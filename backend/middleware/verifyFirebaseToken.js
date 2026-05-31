

import admin from "firebase-admin";

// ── Private key parsing ────────────────────────────────────────────────────
// On Windows, .env files store the key with literal \n characters.
// dotenvx/dotenv may or may not auto-expand them depending on the format.
// This function handles all common cases:
//   1. Literal \n  → replaced with actual newline (most common on Windows)
//   2. Surrounding quotes → stripped (if .env value was double-quoted)
//   3. CRLF (\r\n) → normalized to LF (\n) (Windows line endings)
function parsePrivateKey(raw) {
  if (!raw) return null;

  return raw
    .replace(/\\n/g, "\n")    // literal backslash-n → real newline
    .replace(/\r\n/g, "\n")   // Windows CRLF → LF
    .replace(/^"|"$/g, "");   // strip surrounding quotes if present
}

// ── Firebase Admin init ────────────────────────────────────────────────────
// Guard with !admin.apps.length so the SDK only initializes once
// even if this middleware module is imported multiple times.
if (!admin.apps.length) {
  const projectId   = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey  = parsePrivateKey(process.env.FIREBASE_PRIVATE_KEY);

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "[Firebase Admin] Missing env vars. Need: " +
      "FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY"
    );
  }

  // Validate the key looks like a PEM block before passing to Firebase.
  // Catches the case where the key was copied without the header/footer lines.
  if (!privateKey.includes("-----BEGIN PRIVATE KEY-----")) {
    throw new Error(
      "[Firebase Admin] FIREBASE_PRIVATE_KEY does not look like a valid PEM key. " +
      "Make sure it includes '-----BEGIN PRIVATE KEY-----' and '-----END PRIVATE KEY-----'. " +
      "Check your .env file — the key must be on a single line with \\n between each line."
    );
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
}

// ── Middleware ─────────────────────────────────────────────────────────────
async function verifyFirebaseToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "Unauthorized: missing or malformed Authorization header",
    });
  }

  const token = authHeader.split("Bearer ")[1];

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded; // { uid, email, name, ... }
    next();
  } catch (err) {
    console.error("[Auth] Token verification failed:", err.message);
    return res.status(401).json({
      error: "Unauthorized: invalid or expired token",
    });
  }
}

export default verifyFirebaseToken;
