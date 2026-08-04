import { useState } from "react";
import WelcomeScreen from "./WelcomeScreen";
import DailyQuickQuiz from "./DailyQuickQuiz";
import DailyMission from "./DailyMission";
import TodaysFocus from "./TodaysFocus";
import { QUIZ_TOPICS } from "../../utils/quizEngine";

// Welcome -> Daily Quick Quiz -> Today's Mission -> Today's Focus, per the
// spec's flow diagram (docs/002-first-session-onboarding-flow.md). The Quiz
// step renders the existing, already-tested `DailyQuickQuiz`, which
// internally covers both the "Daily Quick Quiz" and "Quiz Result" screens
// from the spec (5 MCQs, then its own score + per-question review) before
// calling its `onComplete` — that combined behavior is reused as-is here
// rather than re-split into two components, so this container only adds
// the two screens that were previously missing: Today's Mission and
// Today's Focus.
const STEPS = ["welcome", "quiz", "mission", "focus"];

function pickTodaysFocusTopic() {
  // Deliberately independent of the quiz's own weak-area result (see
  // QuizResultSummary's "improvement area") — the spec frames this as a
  // separate fun reveal, not a repeat of the Quiz Result screen.
  return QUIZ_TOPICS[Math.floor(Math.random() * QUIZ_TOPICS.length)];
}

/**
 * OnboardingContainer — owns all onboarding step state, isolated from
 * dashboard/app state beyond what it explicitly needs (DailyQuickQuiz and
 * DailyMission each read their own context internally). Calls
 * `onComplete()` once the user finishes the last step (Today's Focus).
 */
export default function OnboardingContainer({ onComplete }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [focusTopic] = useState(pickTodaysFocusTopic);

  function advance() {
    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
  }

  const step = STEPS[stepIndex];

  if (step === "welcome") {
    return <WelcomeScreen onStart={advance} />;
  }

  if (step === "quiz") {
    return <DailyQuickQuiz onComplete={advance} />;
  }

  if (step === "mission") {
    return <DailyMission onContinue={advance} />;
  }

  return <TodaysFocus topic={focusTopic} onContinue={onComplete} />;
}