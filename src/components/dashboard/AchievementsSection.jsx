import { share } from "../../utils/share";
function AchievementsSection({ badges }) {

  return (
    <div className="mt-10 bg-zinc-900 p-6 rounded-2xl border border-zinc-800">

      <h2 className="text-2xl font-semibold mb-6">
        Achievements
      </h2>

      <div className="flex flex-wrap gap-4">

        {badges.length === 0 ? (

          <p className="text-zinc-400">
            No badges earned yet.
          </p>

        ) : (

          badges.map((badge, index) => (

            <div
              key={index}
              className="bg-zinc-800 px-5 py-3 rounded-xl"
            >
              <p className="font-semibold">
                {badge}
              </p>

              <button
                onClick={() =>
                  share({
                    title: "Code Club Achievement",
                    text: `I earned the "${badge}" achievement on Code Club!`,
                    url: `${window.location.origin}/u/me`,
                  })
                }
                className="mt-3 text-xs px-3 py-2 rounded-lg bg-zinc-700 hover:bg-zinc-600 transition"
              >
                Share
              </button>
            </div>

          ))

        )}

      </div>

    </div>
  );
}

export default AchievementsSection;