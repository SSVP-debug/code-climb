import { useCallback, useEffect, useRef, useState } from "react";
import { runCode } from "../services/compiler";

export function useRunCode() {
  const [result, setResult] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState(null);

  // isMountedRef tracks whether the component is still mounted.
  // If the user navigates away while code is running, we must not
  // call setState — React will warn and state can corrupt.
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // run() is the main function. Calls compiler.js and manages state.
  // useCallback with [isRunning] dep: the function reference updates only
  // when isRunning changes, avoiding stale closure issues.
  const run = useCallback(
    async (sourceCode, languageId, stdin = "") => {
      // Guard: prevent double-submission while a run is in progress.
      if (isRunning) return;

      if (!sourceCode?.trim()) {
        setError("Please write some code before running.");
        return;
      }

      setIsRunning(true);
      setError(null);
      setResult(null);

      try {
        // compiler.js never throws — it returns { stderr } on failure.
        const output = await runCode(sourceCode, languageId, stdin);

        if (!isMountedRef.current) return;

        setResult(output);

        // compiler.js returns Judge0's result shape.
        // stderr being set doesn't always mean a hard error — it can be
        // a compilation warning. Surface it as a soft error either way.
        if (output?.stderr) {
          setError(output.stderr);
        }
      } catch (err) {
        // This branch only fires if compiler.js itself throws unexpectedly.
        if (!isMountedRef.current) return;
        setError(err.message || "An unexpected error occurred.");
      } finally {
        if (isMountedRef.current) {
          setIsRunning(false);
        }
      }
    },
    [isRunning]
  );

  // reset() clears result and error — call when the user changes their code
  // or switches language so stale results don't show.
  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { result, isRunning, error, run, reset };
}
