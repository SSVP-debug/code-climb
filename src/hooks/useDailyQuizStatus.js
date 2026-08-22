import { useContext } from "react";
import { DailyQuizContext } from "../context/DailyQuizContextObject";

// Convenience hook. Throws a clear error if used outside DailyQuizProvider
// instead of silently returning null and crashing later.
//
// Usage: const { status, retry, completeQuiz, completing, completeError } = useDailyQuizStatus();
export function useDailyQuizStatus() {
  const context = useContext(DailyQuizContext);

  if (!context) {
    throw new Error(
      "[useDailyQuizStatus] Must be used inside <DailyQuizProvider>. " +
      "Did you wrap your app in App.jsx?"
    );
  }

  return context;
}
