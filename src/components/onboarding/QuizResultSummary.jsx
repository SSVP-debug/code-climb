import { Trophy, TrendingUp, Target } from "lucide-react";
import SectionCard from "../ui/layout/SectionCard";

/**
 * QuizResultSummary — the score + strongest-topic + Today's Mission blocks
 * from a completed Daily Quick Quiz attempt. Pure presentation, no storage
 * or navigation — used by DailyQuickQuiz's result screen, alongside
 * QuizAnswerReview's per-question breakdown, right when the quiz finishes.
 */
export default function QuizResultSummary({ result }) {
  const { correctCount, total, strongestTopic, improvementTopic } = result;

  return (
    <>
      <div className="w-14 h-14 rounded-2xl bg-[var(--theme-primary,#2dd4bf)]/10 text-[var(--theme-primary,#2dd4bf)] flex items-center justify-center mx-auto mb-5">
        <Trophy size={26} strokeWidth={2} />
      </div>

      <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">
        {correctCount} / {total} correct
      </h2>
      <p className="text-[var(--muted-foreground)] text-sm mb-8">Nice warm-up. Here's how it broke down.</p>

      <div className="space-y-3 text-left">
        <SectionCard
          icon={<TrendingUp size={18} strokeWidth={2} />}
          title={strongestTopic ? "You're strongest in" : "Strongest topic"}
        >
          <p className="text-[var(--foreground)] font-medium">
            {strongestTopic ?? "No correct answers today — tomorrow's a fresh set."}
          </p>
        </SectionCard>

        <SectionCard
          icon={<Target size={18} strokeWidth={2} />}
          title="Today's Mission"
          accented
        >
          <p className="text-[var(--foreground)] font-medium">
            {improvementTopic
              ? `Improvement area: ${improvementTopic}. Solve one ${improvementTopic} problem today to lock it in.`
              : "Perfect score — no weak spot flagged today. Keep the streak going with one more problem."}
          </p>
        </SectionCard>
      </div>
    </>
  );
}