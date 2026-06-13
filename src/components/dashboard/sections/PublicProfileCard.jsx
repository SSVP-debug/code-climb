import { useAppContext } from "../../../hooks/useAppContext";
import { useTheme } from "../../../context/ThemeContext";
import { getProfileData, getUserRank } from "../../../utils/analyticsUtils";
import { formatDate } from "../../../utils/formatters";
import { getStorageData } from "../../../services/storageService";

function getHeatmapCells() {
  const activityDates = getStorageData("activityDates", []);
  const cells = [];
  const today = new Date();

  for (let i = 34; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    cells.push(activityDates.includes(formatDate(date)));
  }

  return cells;
}

function PublicProfileCard() {
  const { theme }    = useTheme();
  const { solvedDifficulty } = useAppContext();
  const profile      = getProfileData();
  const rank         = getUserRank();
  const heatmapCells = getHeatmapCells();

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-zinc-400 text-sm">{theme.words.publicProfile}</p>
          <h2 className="text-3xl font-bold mt-2">{rank}</h2>
        </div>
        <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center text-black text-2xl font-bold">
          C
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-zinc-800 rounded-xl p-4">
          <p className="text-zinc-400 text-sm">{theme.words.totalSolved}</p>
          <h3 className="text-2xl font-bold mt-2">{profile.totalSolved}</h3>
        </div>

        <div className="bg-zinc-800 rounded-xl p-4">
          <p className="text-zinc-400 text-sm">{theme.words.totalSubmissions}</p>
          <h3 className="text-2xl font-bold mt-2">{profile.totalSubmissions}</h3>
        </div>

        <div className="bg-green-900 rounded-xl p-4">
          <p className="text-green-300 text-sm">{theme.words.easySolved}</p>
          <h3 className="text-2xl font-bold mt-2">{solvedDifficulty.Easy ?? 0}</h3>
        </div>

        <div className="bg-yellow-900 rounded-xl p-4">
          <p className="text-yellow-300 text-sm">{theme.words.mediumSolved}</p>
          <h3 className="text-2xl font-bold mt-2">{solvedDifficulty.Medium ?? 0}</h3>
        </div>

        <div className="bg-red-900 rounded-xl p-4">
          <p className="text-red-300 text-sm">{theme.words.hardSolved}</p>
          <h3 className="text-2xl font-bold mt-2">{solvedDifficulty.Hard ?? 0}</h3>
        </div>

        <div className="bg-zinc-800 rounded-xl p-4">
          <p className="text-zinc-400 text-sm">{theme.words.topics}</p>
          <h3 className="text-2xl font-bold mt-2">{profile.topicsSolved}</h3>
        </div>

        <div className="bg-zinc-800 rounded-xl p-4 col-span-2">
          <p className="text-zinc-400 text-sm">{theme.words.joined}</p>
          <h3 className="text-lg font-bold mt-2">{profile.joinedDate}</h3>
        </div>
      </div>

      {/* Activity heatmap */}
      <div className="mt-8">
        <p className="text-zinc-400 text-sm mb-3">{theme.words.recentActivity}</p>
        <div className="grid grid-cols-7 gap-2">
          {heatmapCells.map((active, index) => (
            <div
              key={index}
              className={`w-6 h-6 rounded-md ${active ? "bg-green-500" : "bg-zinc-800"}`}
            />
          ))}
        </div>
      </div>

    </div>
  );
}

export default PublicProfileCard;
