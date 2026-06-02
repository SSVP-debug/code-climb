import { auth } from "../firebase/firebase";
 
const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";
 
export async function apiFetch(path, options = {}) {
  // auth.currentUser is Firebase SDK's synchronous property.
  // On any protected route, this should be non-null — ProtectedRoute
  // waits for onAuthStateChanged before rendering.
  // If it IS null here, something is wrong with the auth flow upstream.
  const user = auth.currentUser;
 
  if (!user) {
    throw new Error(
      "You are not logged in. Please refresh the page and try again."
    );
  }
 
  // getIdToken() returns the cached token or refreshes it automatically
  // if it's within 5 minutes of expiry.
  let token;
  try {
    token = await user.getIdToken();
  } catch (err) {
    console.error("[apiFetch] Failed to get ID token:", err.message);
    throw new Error(
      "Your session has expired. Please sign out and sign in again."
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
 
  if (!response.ok) {
    const text = await response.text();
    let message = text;
 
    try {
      const json = JSON.parse(text);
      message = json.error || json.message || text;
    } catch {
      // keep raw text if not JSON
    }
 
    throw new Error(message || `Request failed (${response.status})`);
  }
 
  if (response.status === 204) return null;
 
  return response.json();
}