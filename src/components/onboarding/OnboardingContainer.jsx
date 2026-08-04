import { useState } from "react";
import WelcomeScreen from "./WelcomeScreen";
import DailyQuickQuiz from "./DailyQuickQuiz";
import DailyMission from "./DailyMission";
import TodaysFocus from "./TodaysFocus";
import WorkspacePreparationScreen from "./WorkspacePreparationScreen";
import { QUIZ_TOPICS } from "../../utils/quizEngine";
import {
  hasCompletedQuizToday,
  markQuizCompletedToday,
} from "../../utils/dailyQuizStorage";

// Welcome -> [Daily Quick Quiz] -> Today's Mission -> Today's Focus ->
// Workspace Preparation (readiness gate), per the "refine first-session
// experience" plan. This container now runs once per session (see
// OnboardingGate), not once per day — the Quiz step is the one piece that
// stays day-gated, decided once at mount via hasCompletedQuizToday() so a
// session that started before midnight doesn't flip mid-flow.
//
// The Quiz step renders the existing, already-tested `DailyQuickQuiz`,
// which internally covers both the "Daily Quick Quiz" and "Quiz Result"
// screens from the original spec (5 MCQs, then its own score + per-question
// review) before calling its `onComplete` — reused as-is.
//
// The final step, Workspace Preparation, is the readiness gate: it reads
// AppContext's isBackendReady itself and only calls onComplete once the
// backend has actually finished loading real data — see that component's
// own comment for why this isn't just a spinner, and why nothing here
// needs to "interrupt" earlier steps if the backend happens to become
// ready while Welcome/Quiz/Mission/Focus are still showing (this step
// simply isn't mounted yet, so there's nothing to interrupt).
function buildSteps() {
  const steps = ["welcome"];
  if (!hasCompletedQuizToday()) steps.push("quiz");
  steps.push("mission", "focus", "readiness");
  return steps;
}

function pickTodaysFocusTopic() {
  // Deliberately independent of the quiz's own weak-area result (see
  // QuizResultSummary's "improvement area") — the spec frames this as a
  // separate fun reveal, not a repeat of the Quiz Result screen.
  return QUIZ_TOPICS[Math.floor(Math.random() * QUIZ_TOPICS.length)];
}

/**
 * OnboardingContainer — owns all onboarding step state, isolated from
 * dashboard/app state beyond what it explicitly needs (DailyQuickQuiz,
 * DailyMission, and WorkspacePreparationScreen each read their own context
 * internally). Calls `onComplete()` once the readiness step clears.
 *
 * Steps are decided once via buildSteps() at mount (useState initializer),
 * not recomputed on every render — future steps (daily coding facts,
 * personalized tips, streak celebrations, etc., per the plan's
 * future-proofing note) can be added by extending buildSteps() and adding
 * one more `if (step === "...")` branch below; nothing else needs to
 * change.
 */
export default function OnboardingContainer({ onComplete }) {
  const [steps] = useState(buildSteps);
  const [stepIndex, setStepIndex] = useState(0);
  const [focusTopic] = useState(pickTodaysFocusTopic);

  function advance() {
    setStepIndex((i) => Math.min(i + 1, steps.length - 1));
  }

  function completeQuiz() {
    markQuizCompletedToday();
    advance();
  }

  const step = steps[stepIndex];

  if (step === "welcome") {
    return <WelcomeScreen onStart={advance} />;
  }

  if (step === "quiz") {
    return <DailyQuickQuiz onComplete={completeQuiz} />;
  }

  if (step === "mission") {
    return <DailyMission onContinue={advance} />;
  }

  if (step === "focus") {
    return <TodaysFocus topic={focusTopic} onContinue={advance} />;
  }

  return <WorkspacePreparationScreen onReady={onComplete} />;
}