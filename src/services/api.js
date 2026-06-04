import { signOut } from "firebase/auth";
import { auth } from "../firebase/firebase";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

export async function apiFetch(path, options = {}) {
  const user = auth.currentUser;

  if (!user) {
    throw new Error(
      "You are not logged in. Please refresh the page and try again."
    );
  }

  let token;
  try {
    // forceRefresh: true — always fetch a fresh token.
    // Adds ~50ms latency but prevents "token expired" 401s during
    // long coding sessions (Firebase ID tokens expire after 1 hour).
    token = await user.getIdToken(true);
  } catch (err) {
    console.error("[apiFetch] Token refresh failed:", err.message);
    throw new Error(
      "Your session could not be refreshed. Please sign in again."
    );
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  // 401: backend rejected our token.
  // Force sign-out + redirect so the user gets a fresh token on next login.
  // We redirect before throwing so UI components don't need to handle this case.
  if (response.status === 401) {
    console.warn("[apiFetch] 401 received — signing out and redirecting.");
    await signOut(auth);
    window.location.href = "/login?reason=session_expired";
    // Throw anyway so any in-progress async operation stops cleanly
    throw new Error("Session expired. Please sign in again.");
  }

  if (!response.ok) {
    const text = await response.text();
    let message = text;

    try {
      const json = JSON.parse(text);
      message = json.error || json.message || text;
    } catch {
      // keep raw text if response is not JSON
    }

    throw new Error(message || `Request failed (${response.status})`);
  }

  if (response.status === 204) return null;

  return response.json();
}
