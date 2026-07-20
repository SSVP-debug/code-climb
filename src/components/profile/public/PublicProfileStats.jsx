function StatCard({ label, value }) {
  return (
    <div className="bg-zinc-800 rounded-xl p-4">
      <p className="text-zinc-400">{label}</p>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
}

function PublicProfileStats({ profile }) {
  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
        <StatCard label="Level" value={profile.level} />
        <StatCard label="XP" value={profile.totalXP} />
        <StatCard label="Solved" value={profile.solvedCount} />
        <StatCard label="Current Streak" value={profile.currentStreak} />
      </div>

      <div className="mt-8">
        <p className="text-zinc-400">Longest Streak</p>
        <p className="text-xl font-semibold">{profile.longestStreak}</p>

        <p className="text-zinc-400 mt-4">Joined</p>
        <p>{new Date(profile.joinedDate).toLocaleDateString()}</p>
      </div>
    </>
  );
}

export default PublicProfileStats;
