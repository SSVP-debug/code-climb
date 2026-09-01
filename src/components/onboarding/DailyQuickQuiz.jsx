import { useMemo, useState } from "react";
import { Sparkles, CheckCircle2, XCircle } from "lucide-react";
import Button from "../ui/Button";
import SectionCard from "../ui/layout/SectionCard";
import QuizResultSummary from "./QuizResultSummary";
import QuizAnswerReview from "./QuizAnswerReview";
import { selectDailyQuestions, scoreQuizAttempt } from "../../utils/quizEngine";

const QUESTION_COUNT = 5;
// How long the correct/incorrect option coloring shows before auto-advancing
// to the next question. Kept short — the spec calls for this to "feel fast,
// not like an exam".
const FEEDBACK_DELAY_MS = 900;

/**
 * DailyQuickQuiz — the "Daily Quick Quiz" from the first-session-experience
 * spec: 5 MCQs shown once per day, then a result screen ("You're strongest
 * in: X" / "Today's improvement area: Y"). Rendered by DailyQuizGate
 * (src/routes/DailyQuizGate.jsx, reached via ProtectedRoute) in place of a
 * protected page's content until the quiz is completed for today.
 *
 * This component itself only ever holds the current attempt in memory and
 * hands the final `result` to `onComplete(result)` once the person clicks
 * through the result screen — it has no opinion on what onComplete() does
 * with that. DailyQuizGate (via DailyQuizProvider's completeQuiz) is what persists completion server-side
 * (POST /api/daily-quiz/complete) and owns the "once per calendar day"
 * gate; this component would work identically if some other caller wired
 * it up differently. (Formerly: no server persistence at all, and the
 * once-per-day gate lived client-side in the now-removed
 * src/utils/dailyQuizStorage.js — see DailyQuizProvider's comment for why
 * that changed.)
 */
export default function DailyQuickQuiz({ onComplete }) {
  const [questions] = useState(() => selectDailyQuestions(QUESTION_COUNT));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showResult, setShowResult] = useState(false);

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;

  const result = useMemo(() => {
    if (!showResult) return null;
    return scoreQuizAttempt(questions, answers);
  }, [showResult, questions, answers]);

  function handleSelectOption(optionIndex) {
    // Already answered this question — ignore extra clicks while feedback
    // is showing.
    if (selectedOption !== null) return;

    setSelectedOption(optionIndex);
    const nextAnswers = [...answers, optionIndex];

    setTimeout(() => {
      setAnswers(nextAnswers);
      setSelectedOption(null);

      if (isLastQuestion) {
        setShowResult(true);
      } else {
        setCurrentIndex((i) => i + 1);
      }
    }, FEEDBACK_DELAY_MS);
  }

  if (showResult && result) {
    return (
      <QuizResult questions={questions} answers={answers} result={result} onComplete={onComplete} />
    );
  }

  return (
    <div className="max-w-xl mx-auto py-10 sm:py-16">
      <div className="flex items-center gap-2 justify-center mb-2 text-[var(--theme-primary,#2dd4bf)]">
        <Sparkles size={18} strokeWidth={2} />
        <span className="text-sm font-semibold uppercase tracking-wide">Daily Quick Quiz</span>
      </div>

      <p className="text-[var(--muted-foreground)] text-sm text-center mb-8">
        {QUESTION_COUNT} quick questions to warm up before your dashboard.
      </p>

      <QuizProgress current={currentIndex} total={questions.length} />

      <SectionCard className="mt-6">
        <p className="text-xs font-medium text-[var(--muted-foreground)] mb-2">{currentQuestion.topic}</p>
        <h2 className="text-lg sm:text-xl font-semibold text-[var(--foreground)] mb-6">
          {currentQuestion.question}
        </h2>

        <div className="space-y-3">
          {currentQuestion.options.map((option, index) => (
            <QuizOption
              key={index}
              option={option}
              index={index}
              selectedOption={selectedOption}
              correctIndex={currentQuestion.correctIndex}
              onSelect={() => handleSelectOption(index)}
            />
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

function QuizProgress({ current, total }) {
  return (
    <div className="flex items-center justify-center gap-1.5" aria-label={`Question ${current + 1} of ${total}`}>
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={`h-1.5 rounded-full transition-all ${
            i < current
              ? "w-6 bg-[var(--theme-primary,#2dd4bf)]"
              : i === current
              ? "w-8 bg-[var(--theme-primary,#2dd4bf)]"
              : "w-6 bg-[var(--surface-elevated)]"
          }`}
        />
      ))}
    </div>
  );
}

function QuizOption({ option, index, selectedOption, correctIndex, onSelect }) {
  const hasAnswered = selectedOption !== null;
  const isCorrect = index === correctIndex;
  const isPicked = index === selectedOption;

  let stateClasses = "border-[var(--border)] hover:border-[var(--border-strong)] text-[var(--foreground)]";
  if (hasAnswered && isCorrect) {
    stateClasses = "border-verdict-accept/60 bg-verdict-accept/10 text-[var(--foreground)]";
  } else if (hasAnswered && isPicked && !isCorrect) {
    stateClasses = "border-verdict-reject/60 bg-verdict-reject/10 text-[var(--foreground)]";
  } else if (hasAnswered) {
    stateClasses = "border-[var(--border)] text-[var(--muted-foreground)]";
  }

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={hasAnswered}
      className={`w-full flex items-center justify-between gap-3 text-left px-4 py-3 rounded-xl border transition disabled:cursor-default ${stateClasses}`}
    >
      <span className="text-sm font-medium">{option}</span>
      {hasAnswered && isCorrect && (
        <CheckCircle2 size={18} className="text-verdict-accept flex-shrink-0" />
      )}
      {hasAnswered && isPicked && !isCorrect && (
        <XCircle size={18} className="text-verdict-reject flex-shrink-0" />
      )}
    </button>
  );
}

function QuizResult({ questions, answers, result, onComplete }) {
  return (
    <div className="max-w-xl mx-auto py-10 sm:py-16">
      <div className="text-center">
        <QuizResultSummary result={result} />
      </div>

      <div className="mt-8">
        <h3 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide mb-3">
          Review your answers
        </h3>
        <QuizAnswerReview questions={questions} answers={answers} />
      </div>

      <Button variant="primary" size="lg" className="w-full mt-8" onClick={() => onComplete(result)}>
        Continue to Dashboard
      </Button>
    </div>
  );
}