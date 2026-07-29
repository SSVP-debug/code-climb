/**
 * usePlaylists.js
 *
 * Fetches the caller's playlists (official + own) from GET /api/playlists
 * and exposes create/update/delete, each of which re-syncs local state
 * from the server response rather than optimistically guessing — same
 * "apply what the server actually persisted" convention appContext.jsx
 * uses for pin/save-problem calls.
 */

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../services/api";

export function usePlaylists() {
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchPlaylists() {
      try {
        setLoading(true);
        setError(null);
        const data = await apiFetch("/api/playlists");
        if (!cancelled) setPlaylists(data.playlists || []);
      } catch (err) {
        if (cancelled) return;
        console.error("[usePlaylists] fetch failed:", err.message);
        setError("Could not load playlists.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchPlaylists();
    return () => { cancelled = true; };
  }, []);

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiFetch("/api/playlists");
      setPlaylists(data.playlists || []);
    } catch (err) {
      console.error("[usePlaylists] fetch failed:", err.message);
      setError("Could not load playlists.");
    } finally {
      setLoading(false);
    }
  }, []);

  async function createPlaylist({ name, description = "", problemSlugs = [] }) {
    const data = await apiFetch("/api/playlists", {
      method: "POST",
      body: JSON.stringify({ name, description, problemSlugs }),
    });
    setPlaylists((prev) => [...prev, data.playlist]);
    return data.playlist;
  }

  async function updatePlaylist(id, patch) {
    const data = await apiFetch(`/api/playlists/${id}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    });
    setPlaylists((prev) => prev.map((p) => (p.id === id ? data.playlist : p)));
    return data.playlist;
  }

  async function deletePlaylist(id) {
    await apiFetch(`/api/playlists/${id}`, { method: "DELETE" });
    setPlaylists((prev) => prev.filter((p) => p.id !== id));
  }

  return { playlists, loading, error, refetch, createPlaylist, updatePlaylist, deletePlaylist };
}