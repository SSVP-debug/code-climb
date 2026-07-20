/**
 * e2e/fixtures/testUser.js
 *
 * Creates a fresh Firebase user directly against the Auth Emulator's REST
 * API (the same "Identity Toolkit" API real Firebase exposes — the
 * emulator implements it locally). This is Node-side setup, not something
 * that goes through the browser: it runs before Playwright even opens a
 * page, so each test starts from a known, isolated identity instead of
 * reusing state across runs.
 *
 * Why REST directly instead of the firebase-admin SDK: this repo doesn't
 * have firebase-admin as a *frontend* dependency (it's backend-only, and
 * pulling it in here just for test setup is one more thing to keep in
 * sync). The emulator's REST API needs no real credentials — the `key`
 * query param is required by the endpoint shape but not actually checked
 * in emulator mode, so any non-empty string works.
 */
const EMULATOR_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || "localhost:9099";
const PROJECT_ID = process.env.E2E_FIREBASE_PROJECT_ID || "demo-codeclub-e2e";

function signUpUrl() {
  return `http://${EMULATOR_HOST}/identitytoolkit.google.com/v1/accounts:signUp?key=fake-key`;
}

/**
 * Creates a brand-new emulator user with a random email and a deterministic
 * displayName, so parallel/repeat test runs never collide on an existing
 * account, and the leaderboard test has something exact to search for.
 *
 * displayName matters here specifically because
 * backend/middleware/auth.js's lazy User.create() sets displayName from
 * the verified ID token's `name` claim (`decoded.name || ""`) — Firebase
 * only populates that claim if the auth user has a displayName set, which
 * is why this is passed explicitly rather than left to whatever the
 * emulator would default to.
 */
export async function createTestUser() {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const email = `e2e-${suffix}@example.test`;
  const password = "TestPassword123!";
  const displayName = `E2E Test ${suffix}`;

  const response = await fetch(signUpUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, displayName, returnSecureToken: true }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Failed to create emulator test user — is the Firebase Auth Emulator ` +
        `running at ${EMULATOR_HOST}? (project: ${PROJECT_ID})\n${body}`
    );
  }

  const data = await response.json();
  return { email, password, displayName, localId: data.localId, idToken: data.idToken };
}
