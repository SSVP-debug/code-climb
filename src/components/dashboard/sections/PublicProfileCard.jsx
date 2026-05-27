import { useState } from "react";

import {
  getProfileData,
  getUserRank,
} from "../../../utils/analyticsUtils";
import { getStorageData } from "../../../services/storageService";

function getHeatmapCells() {

  const activityDates =
    getStorageData(
      "activityDates",
      []
    );

  const cells = [];
  const today = new Date();

  for (let i = 34; i >= 0; i -= 1) {

    const date = new Date(today);
    date.setDate(today.getDate() - i);

    cells.push(
      activityDates.includes(
        date.toLocaleDateString()
      )
    );
  }

  return cells;
}

function PublicProfileCard() {

  const profile =
    getProfileData();

  const rank =
    getUserRank();

  const heatmapCells =
    getHeatmapCells();

  const [
    showDialog,
    setShowDialog,
  ] = useState(false);

  const [
    leetcodeUsername,
    setLeetcodeUsername,
  ] = useState(
    localStorage.getItem(
      "leetcodeUsername"
    ) || ""
  );

  function handleSaveLeetcode() {

    localStorage.setItem(
      "leetcodeUsername",
      leetcodeUsername
    );

    setShowDialog(false);

  }

  const solvedDifficulty =
    JSON.parse(
      localStorage.getItem(
        "solvedDifficulty"
      )
    ) || {
      easy: 0,
      medium: 0,
      hard: 0,
    };

  return (

    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">

      <div className="flex items-center justify-between mb-6">

        <div>

          <p className="text-zinc-400 text-sm">

            Public Developer Profile

          </p>

          <h2 className="text-3xl font-bold mt-2">

            {rank}

          </h2>

        </div>

        <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center text-black text-2xl font-bold">

          C

        </div>

      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">

        <div className="bg-zinc-800 rounded-xl p-4">

          <p className="text-zinc-400 text-sm">
            Total Solved
          </p>

          <h3 className="text-2xl font-bold mt-2">

            {profile.totalSolved}

          </h3>

        </div>

        <div className="bg-zinc-800 rounded-xl p-4">

          <p className="text-zinc-400 text-sm">
            Total Submissions
          </p>

          <h3 className="text-2xl font-bold mt-2">

            {profile.totalSubmissions}

          </h3>

        </div>

        <div className="bg-green-900 rounded-xl p-4">

          <p className="text-green-300 text-sm">
            Easy Solved
          </p>

          <h3 className="text-2xl font-bold mt-2">

            {solvedDifficulty.easy}

          </h3>

        </div>

        <div className="bg-yellow-900 rounded-xl p-4">

          <p className="text-yellow-300 text-sm">
            Medium Solved
          </p>

          <h3 className="text-2xl font-bold mt-2">

            {solvedDifficulty.medium}

          </h3>

        </div>

        <div className="bg-red-900 rounded-xl p-4">

          <p className="text-red-300 text-sm">
            Hard Solved
          </p>

          <h3 className="text-2xl font-bold mt-2">

            {solvedDifficulty.hard}

          </h3>

        </div>

        <div className="bg-zinc-800 rounded-xl p-4">

          <p className="text-zinc-400 text-sm">
            Topics
          </p>

          <h3 className="text-2xl font-bold mt-2">

            {profile.topicsSolved}

          </h3>

        </div>

        <div className="bg-zinc-800 rounded-xl p-4 col-span-2">

          <p className="text-zinc-400 text-sm">
            Joined
          </p>

          <h3 className="text-lg font-bold mt-2">

            {profile.joinedDate}

          </h3>

        </div>

      </div>

      {/* LeetCode Connect */}
      <div className="mt-6">

        <button
          onClick={() =>
            setShowDialog(true)
          }
          className="w-full bg-yellow-500 hover:bg-yellow-400 transition text-black font-semibold py-3 rounded-xl"
        >

          {leetcodeUsername
            ? `Connected: ${leetcodeUsername}`
            : "Connect LeetCode"}

        </button>

      </div>

      {/* Dialog */}
      {showDialog && (

        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-[400px]">

            <h2 className="text-2xl font-bold mb-4">

              Connect LeetCode

            </h2>

            <input
              type="text"
              value={leetcodeUsername}
              onChange={(e) =>
                setLeetcodeUsername(
                  e.target.value
                )
              }
              placeholder="Enter LeetCode username"
              className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 outline-none"
            />

            <div className="flex gap-4 mt-6">

              <button
                onClick={handleSaveLeetcode}
                className="flex-1 bg-green-500 hover:bg-green-600 transition text-black font-semibold py-3 rounded-xl"
              >

                Save

              </button>

              <button
                onClick={() =>
                  setShowDialog(false)
                }
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 transition py-3 rounded-xl"
              >

                Cancel

              </button>

            </div>

          </div>

        </div>

      )}

      {/* Heatmap */}
      <div className="mt-8">

        <p className="text-zinc-400 text-sm mb-4">

          Activity Heatmap

        </p>

        <div className="grid grid-cols-7 gap-2">

          {heatmapCells.map((active, index) => (

            <div
              key={index}
              className={`h-6 rounded-md ${
                active
                  ? "bg-green-500"
                  : "bg-zinc-800"
              }`}
            />

          ))}

        </div>

      </div>

    </div>

  );
}

export default PublicProfileCard;