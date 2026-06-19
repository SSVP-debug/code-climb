import { useMemo } from "react";

import { useTheme } from "../../../context/ThemeContext";
import { useAppContext } from "../../../hooks/useAppContext";

function AchievementGallery() {
  const { theme } = useTheme();

  const {
    solvedProblems,
    solvedDifficulty,
    currentStreak,
    submissions,
  } = useAppContext();

  const achievements = useMemo(() => {
    const list = [];

    // First Solve
    if (solvedProblems.length >= 1) {
      list.push({
        title: "First Blood",
        description:
          "Solved your first problem.",
      });
    }

    // Consistency
    if (solvedProblems.length >= 5) {
      list.push({
        title: "Consistency Begins",
        description:
          "Solved 5 problems.",
      });
    }

    if (solvedProblems.length >= 25) {
      list.push({
        title: "Problem Crusher",
        description:
          "Solved 25 problems.",
      });
    }

    if (solvedProblems.length >= 50) {
      list.push({
        title: "DSA Warrior",
        description:
          "Solved 50 problems.",
      });
    }

    // First Hard
    if ((solvedDifficulty.hard ?? 0) >= 1) {
      list.push({
        title: "Maximum Security",
        description:
          "Solved your first Hard problem.",
      });
    }

    // Streak
    if (currentStreak >= 7) {
      list.push({
        title: "Hot Streak",
        description:
          "Maintained a 7 day streak.",
      });
    }

    // Fast Runtime
    const fastSubmission =
      submissions.find(
        (submission) =>
          Number(
            submission.executionTime || 0
          ) < 100
      );

    if (fastSubmission) {
      list.push({
        title: "Speed Demon",
        description:
          "Achieved runtime below 100 ms.",
      });
    }

    return list;
  }, [
    solvedProblems,
    solvedDifficulty,
    currentStreak,
    submissions,
  ]);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">

      <h2 className="text-2xl font-semibold mb-6">
        {theme.words.achievements}
      </h2>

      {achievements.length === 0 ? (
        <p className="text-zinc-400">
          {theme.words.noAchievements}
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {achievements.map(
            (achievement, index) => (
              <div
                key={index}
                className="bg-zinc-800 rounded-xl p-4"
              >
                <h3 className="text-lg font-bold">
                  {theme.words.achievementIcon}{" "}
                  {achievement.title}
                </h3>

                <p className="text-zinc-400 text-sm mt-2">
                  {achievement.description}
                </p>
              </div>
            )
          )}

        </div>
      )}
    </div>
  );
}

export default AchievementGallery;