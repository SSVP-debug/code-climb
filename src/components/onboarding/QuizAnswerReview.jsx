import { CheckCircle2, XCircle } from "lucide-react";

/**
 * QuizAnswerReview — shows every question from the just-finished attempt,
 * with the option the person picked and the correct option, so they can see
 * exactly what they got right/wrong (not just the score). Shown once, right
 * after the quiz — it does not persist or reappear on the dashboard later.
 */
export default function QuizAnswerReview({ questions, answers }) {
  return (
    <div className="space-y-3 text-left">
      {questions.map((question, index) => {
        const selectedIndex = answers[index] ?? null;
        const isCorrect = selectedIndex !== null && selectedIndex === question.correctIndex;
        const selectedText = selectedIndex !== null ? question.options[selectedIndex] : null;
        const correctText = question.options[question.correctIndex];

        return (
          <div key={question.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <div className="flex items-center justify-between gap-2 mb-2">
              <p className="text-xs font-medium text-zinc-500">
                Question {index + 1} · {question.topic}
              </p>
              {isCorrect ? (
                <CheckCircle2 size={16} className="text-verdict-accept flex-shrink-0" />
              ) : (
                <XCircle size={16} className="text-verdict-reject flex-shrink-0" />
              )}
            </div>

            <p className="text-sm font-semibold text-white mb-3">{question.question}</p>

            <p className={`text-sm ${isCorrect ? "text-verdict-accept" : "text-verdict-reject"}`}>
              Your answer: {selectedText ?? "Not answered"}
            </p>

            {!isCorrect && (
              <p className="text-sm text-verdict-accept mt-1">
                Correct answer: {correctText}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}