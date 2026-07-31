import { ACHIEVEMENT_METADATA } from "../../../config/achievementMetadata";
import { ACHIEVEMENT_ICONS, DEFAULT_ACHIEVEMENT_ICON } from "../../../config/achievementIcons";

function PublicProfileAchievements({ achievements }) {
  return (
    <div className="mt-10">
      <h2 className="text-2xl font-bold mb-4">Achievements</h2>

      <div className="grid gap-3">
        {achievements?.map((achievement) => {
          const meta = ACHIEVEMENT_METADATA[achievement.key];
          if (!meta) return null;

          const Icon = ACHIEVEMENT_ICONS[achievement.key] || DEFAULT_ACHIEVEMENT_ICON;

          return (
            <div key={achievement.key} className="bg-zinc-800 rounded-xl p-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Icon size={18} strokeWidth={2} aria-hidden="true" />
                {meta.publicTitle}
              </h3>
              <p className="text-zinc-400 text-sm mt-1">{meta.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default PublicProfileAchievements;