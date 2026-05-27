import { useContext, useEffect } from "react";
import { AuthContext } from "../context/authContext";
import { useAppContext } from "../hooks/useAppContext";
import { syncProgressOnLogin } from "../services/progressService";

function ProgressSync() {
  const { user } = useContext(AuthContext);
  const { hydrateFromServer } = useAppContext();

  useEffect(() => {
    if (!user) {
      return;
    }

    let cancelled = false;

    async function sync() {
      console.log(
        "[Progress] Syncing for user",
        user.uid
      );

      const { progress, submissions } =
        await syncProgressOnLogin();

      if (!cancelled) {
        hydrateFromServer(progress, submissions);
        console.log("[Progress] Hydration complete");
      }
    }

    sync();

    return () => {
      cancelled = true;
    };
  }, [user, hydrateFromServer]);

  return null;
}

export default ProgressSync;
