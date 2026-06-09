import {
  getAchievements,
} from "../../../utils/analyticsUtils";

import { useTheme } from "../../../context/ThemeContext";

function AchievementGallery() {

  const { theme } = useTheme();
  const achievements =
    getAchievements();

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
            (
              achievement,
              index
            ) => (

              <div
                key={index}
                className="bg-zinc-800 rounded-xl p-4"
              >

                <h3 className="text-lg font-bold">

                  {theme.words.achievementIcon} {
                    achievement.title
                  }

                </h3>

                <p className="text-zinc-400 text-sm mt-2">

                  {
                    achievement.description
                  }

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