import { useEffect } from "react";
import { Trophy } from "lucide-react";

import {
  ACHIEVEMENT_METADATA,
} from "../../config/achievementMetadata";
import { ACHIEVEMENT_ICONS, DEFAULT_ACHIEVEMENT_ICON } from "../../config/achievementIcons";

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

      <div className="font-bold text-lg mb-2 flex items-center gap-2">
        <Trophy size={20} strokeWidth={2} aria-hidden="true" />
        Achievement Unlocked
      </div>

      {achievements.map((key) => {
        const achievement =
          ACHIEVEMENT_METADATA[key];

        const Icon = ACHIEVEMENT_ICONS[key] || DEFAULT_ACHIEVEMENT_ICON;

        return (
          <div
            key={key}
            className="mb-3 flex items-start gap-2"
          >
            <Icon size={18} strokeWidth={2} className="mt-0.5 shrink-0" aria-hidden="true" />

            <div>
              <div className="font-semibold">
                {achievement?.title || key}
              </div>

              <div className="text-sm">
                {achievement?.description}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default AchievementToast;