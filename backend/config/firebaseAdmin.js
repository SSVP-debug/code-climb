import admin from "firebase-admin";

let initialized = false;

export function initFirebaseAdmin() {
  if (initialized) return admin;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Missing FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL or FIREBASE_PRIVATE_KEY"
    );
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });

  initialized = true;

  console.log(
    `[Firebase Admin] Initialized for project ${projectId}`
  );

  return admin;
}

export function getFirebaseAdmin() {
  return initFirebaseAdmin();
}