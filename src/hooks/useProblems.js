import { useEffect, useState } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "../firebase/firebase";
import staticProblems from "../data/problems";

export function useProblems() {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // cancelled flag prevents setState after the component unmounts.
    // Without this, navigating away during a Firestore fetch causes
    // "Can't perform a React state update on an unmounted component".
    let cancelled = false;

    async function fetchProblems() {
      try {
        setLoading(true);
        setError(null);

        const q = query(
          collection(db, "problems"),
          orderBy("id", "asc")
        );

        const snapshot = await getDocs(q);

        if (cancelled) return;

        if (snapshot.empty) {
          // Firestore collection exists but has no documents yet.
          // Use static data as a safe fallback — page stays functional.
          console.info(
            "[useProblems] Firestore 'problems' collection is empty. " +
            "Using static fallback. Add problems via Firebase Console or Admin SDK."
          );
          setProblems(staticProblems);
        } else {
          const fetched = snapshot.docs.map((doc) => ({
            docId: doc.id, // Firestore document ID
            ...doc.data(),
          }));
          setProblems(fetched);
        }
      } catch (err) {
        if (cancelled) return;

        console.error("[useProblems] Firestore fetch failed:", err.message);

        // Surface a non-breaking error — use static data so the page works.
        setProblems(staticProblems);
        setError(
          "Could not load problems from the server. Showing cached problem set."
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchProblems();

    return () => {
      cancelled = true;
    };
  }, []);

  return { problems, loading, error };
}
