import { useEffect } from "react";

import {
  ACHIEVEMENT_METADATA,
} from "../../config/achievementMetadata";

function AchievementToast({
  achievements,
  onClose,
}) {
  useEffect(() => {
    if (!achievements.length) return;

    const timer = setTimeout(
      onClose,
      4000
    );

    return () =>
      clearTimeout(timer);
  }, [achievements, onClose]);

  if (!achievements.length) {
    return null;
  }

  return (
    <div className="fixed top-6 right-6 z-50 bg-yellow-500 text-black rounded-xl p-4 shadow-lg max-w-sm">

      <div className="font-bold text-lg mb-2">
        🏆 Achievement Unlocked
      </div>

      {achievements.map((key) => {
        const achievement =
          ACHIEVEMENT_METADATA[key];

        return (
          <div
            key={key}
            className="mb-3"
          >
            <div className="font-semibold">
              {achievement?.title || key}
            </div>

            <div className="text-sm">
              {achievement?.description}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default AchievementToast;