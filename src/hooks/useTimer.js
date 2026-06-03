import { useCallback, useEffect, useRef, useState } from "react";

export function useTimer() {
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(true);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!running) {
      clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [running]);

  // Cleanup on component unmount — no memory leak
  useEffect(() => {
    return () => clearInterval(intervalRef.current);
  }, []);

  const stop  = useCallback(() => setRunning(false), []);
  const reset = useCallback(() => { setSeconds(0); setRunning(true); }, []);

  // Format as MM:SS
  const formatted = [
    Math.floor(seconds / 60).toString().padStart(2, "0"),
    (seconds % 60).toString().padStart(2, "0"),
  ].join(":");

  return { seconds, formatted, running, stop, reset };
}
