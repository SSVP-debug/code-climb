import { useAppContext } from "../../../hooks/useAppContext";
import { useTheme } from "../../../hooks/useTheme";
import SectionCard from "../../ui/layout/SectionCard";

function PublicProfileCard() {
  const { theme } = useTheme();

  const {
    solvedProblems,
    solvedDifficulty,
    topicStats,
    activityDates,
    submissions,
  } = useAppContext();

  function getRank() {
    const solvedCount = solvedProblems.length;

    if (solvedCount < 5) return "Beginner";
    if (solvedCount < 15) return "Learner";
    if (solvedCount < 30) return "Intermediate";
    if (solvedCount < 60) return "Advanced";

    return "Expert";
  }

  function getHeatmapCells() {
    const cells = [];
    const today = new Date();

    for (let i = 34; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);

      const isoDate = date
        .toISOString()
        .split("T")[0];

      cells.push(
        activityDates.includes(isoDate)
      );
    }

    return cells;
  }

  const rank = getRank();
  const heatmapCells = getHeatmapCells();

  const profile = {
    totalSolved: solvedProblems.length,
    totalSubmissions: submissions.length,
    topicsSolved: Object.keys(topicStats || {}).length,
    joinedDate: "Code Club Recruit",
  };

  return (
    <SectionCard accented>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-zinc-400 text-sm">
            {theme.words.publicProfile}
          </p>

          <h2 className="text-3xl font-bold mt-2">
            {rank}
          </h2>
        </div>

        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold"
          style={{ backgroundColor: theme.colors.primary, color: "#09090b" }}
        >
          C
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-zinc-800 rounded-xl p-4">
          <p className="text-zinc-400 text-sm">
            {theme.words.totalSolved}
          </p>

          <h3 className="text-2xl font-bold mt-2">
            {profile.totalSolved}
          </h3>
        </div>

        <div className="bg-zinc-800 rounded-xl p-4">
          <p className="text-zinc-400 text-sm">
            {theme.words.totalSubmissions}
          </p>

          <h3 className="text-2xl font-bold mt-2">
            {profile.totalSubmissions}
          </h3>
        </div>

        <div className="bg-green-900 rounded-xl p-4">
          <p className="text-green-300 text-sm">
            {theme.words.easySolved}
          </p>

          <h3 className="text-2xl font-bold mt-2">
            {solvedDifficulty.easy ?? 0}
          </h3>
        </div>

        <div className="bg-yellow-900 rounded-xl p-4">
          <p className="text-yellow-300 text-sm">
            {theme.words.mediumSolved}
          </p>

          <h3 className="text-2xl font-bold mt-2">
            {solvedDifficulty.medium ?? 0}
          </h3>
        </div>

        <div className="bg-red-900 rounded-xl p-4">
          <p className="text-red-300 text-sm">
            {theme.words.hardSolved}
          </p>

          <h3 className="text-2xl font-bold mt-2">
            {solvedDifficulty.hard ?? 0}
          </h3>
        </div>

        <div className="bg-zinc-800 rounded-xl p-4">
          <p className="text-zinc-400 text-sm">
            {theme.words.topics}
          </p>

          <h3 className="text-2xl font-bold mt-2">
            {profile.topicsSolved}
          </h3>
        </div>
      </div>

      <div className="mt-8">
        <p className="text-zinc-400 text-sm mb-3">
          {theme.words.recentActivity}
        </p>

        <div className="grid grid-cols-7 gap-2">
          {heatmapCells.map((active, index) => (
            <div
              key={index}
              className="w-6 h-6 rounded-md"
              style={{
                backgroundColor: active ? theme.colors.primary : "#27272a",
              }}
            />
          ))}
        </div>
      </div>
    </SectionCard>
  );
}

export default PublicProfileCard;