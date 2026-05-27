import admin from "firebase-admin";
import { readFileSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const backendRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);

let initialized = false;

function resolveServiceAccountPath() {
  const configured =
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
    "./serviceAccountKey.json";

  if (path.isAbsolute(configured)) {
    return configured;
  }

  return path.resolve(backendRoot, configured);
}

export function initFirebaseAdmin() {
  if (initialized) {
    return admin;
  }

  const serviceAccountPath =
    resolveServiceAccountPath();

  if (!existsSync(serviceAccountPath)) {
    throw new Error(
      `Firebase service account not found at ${serviceAccountPath}. Download it from Firebase Console and save as backend/serviceAccountKey.json`
    );
  }

  const serviceAccount = JSON.parse(
    readFileSync(serviceAccountPath, "utf8")
  );

  if (!serviceAccount.private_key || !serviceAccount.client_email) {
    throw new Error(
      "Invalid serviceAccountKey.json — missing private_key or client_email"
    );
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId:
      process.env.FIREBASE_PROJECT_ID ||
      serviceAccount.project_id,
  });

  initialized = true;
  console.log(
    `[Firebase Admin] Initialized for project ${serviceAccount.project_id}`
  );

  return admin;
}

export function getFirebaseAdmin() {
  return initFirebaseAdmin();
}
