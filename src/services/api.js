import { getAuth } from "firebase/auth";
import app from "../firebase/firebase";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

export async function apiFetch(
  path,
  options = {}
) {
  const auth = getAuth(app);
  const token =
    await auth.currentUser?.getIdToken();

  console.log("Current User:", auth.currentUser);
  console.log("Token:", token);

  const response = await fetch(
    `${API_URL}${path}`,
    {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token && {
          Authorization: `Bearer ${token}`,
        }),
        ...options.headers,
      },
    }
  );

  if (!response.ok) {
    const text = await response.text();
    let message = text;

    try {
      const json = JSON.parse(text);
      message = json.error || json.message || text;
    } catch {
      // keep raw text
    }

    throw new Error(
      message ||
      `Request failed (${response.status})`
    );
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}
