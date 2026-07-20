/**
 * usePublicProfile.js
 *
 * Fetches a public profile by username (GET /api/public/u/:username).
 *
 * Extracted from src/pages/PublicProfile.jsx (Staff review §4/§9/#12).
 */
import { useEffect, useState } from "react";

export function usePublicProfile(username) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/public/u/${username}`
        );

        if (!response.ok) {
          throw new Error("Profile not found");
        }

        const data = await response.json();
        setProfile(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [username]);

  return { profile, loading, error };
}
