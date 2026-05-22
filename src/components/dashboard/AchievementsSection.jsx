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
              className="bg-zinc-800 px-5 py-3 rounded-xl font-semibold"
            >
              {badge}
            </div>

          ))

        )}

      </div>

    </div>
  );
}

export default AchievementsSection;