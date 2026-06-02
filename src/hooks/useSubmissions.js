import { useCallback, useEffect, useState } from "react";
import {
  addDoc,
  collection,
  getDocs,
  limit,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { db } from "../firebase/firebase";
import { useAuth } from "../context/authContext";

export function useSubmissions(problemSlug = null) {
  const { user } = useAuth();

  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) {
      setSubmissions([]);
      return;
    }

    let cancelled = false;

    async function fetchSubmissions() {
      setLoading(true);
      setError(null);

      try {
        const constraints = [
          where("userId", "==", user.uid),
          limit(50),
        ];

        // Add problem filter only when a slug is provided.
        // Both are equality filters — no composite index needed.
        if (problemSlug) {
          constraints.push(where("problemSlug", "==", problemSlug));
        }

        const q = query(collection(db, "submissions"), ...constraints);
        const snapshot = await getDocs(q);

        if (cancelled) return;

        // Sort descending by createdAt client-side (avoids composite index).
        const docs = snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .sort((a, b) => {
            const ta = a.createdAt?.toMillis?.() ?? 0;
            const tb = b.createdAt?.toMillis?.() ?? 0;
            return tb - ta;
          });

        setSubmissions(docs);
      } catch (err) {
        if (cancelled) return;
        console.error("[useSubmissions] Fetch failed:", err.message);
        setError("Could not load submission history.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchSubmissions();

    return () => {
      cancelled = true;
    };
  }, [user, problemSlug]);

  // ── Save ──────────────────────────────────────────────────────────────────
  // saveSubmission adds to Firestore and optimistically prepends to local state
  // so the UI updates instantly without waiting for a re-fetch.
  //
  // Call it like:
  //   await saveSubmission({
  //     problemSlug: "two-sum",
  //     language: "javascript",
  //     code: "...",
  //     status: "Accepted",
  //     output: "...",
  //   });
  const saveSubmission = useCallback(
    async (data) => {
      if (!user) {
        throw new Error("You must be logged in to submit.");
      }

      setSaving(true);

      try {
        const payload = {
          userId: user.uid,
          ...data,
          createdAt: serverTimestamp(),
        };

        const docRef = await addDoc(collection(db, "submissions"), payload);

        // Optimistic update — new submission appears immediately in the list.
        setSubmissions((prev) => [
          {
            id: docRef.id,
            ...data,
            userId: user.uid,
            // Use a local Date for display until Firestore timestamp resolves.
            createdAt: { toMillis: () => Date.now() },
          },
          ...prev,
        ]);

        return docRef.id;
      } catch (err) {
        console.error("[useSubmissions] Save failed:", err.message);
        throw new Error("Failed to save your submission. Please try again.");
      } finally {
        setSaving(false);
      }
    },
    [user]
  );

  return { submissions, loading, error, saving, saveSubmission };
}
