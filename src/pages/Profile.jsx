import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import { useAuth } from "../context/authContext";
import { useAppContext } from "../hooks/useAppContext";
import {
  getUserLevel,
  getUserRank,
} from "../utils/analyticsUtils";
import { apiFetch } from "../services/api";
import { PROGRESS_KEYS } from "../constants/progressKeys";
import { useTheme } from "../context/ThemeContext";
import {
  canChangeTheme,
  getThemeUnlockProgress,
} from "../utils/themeRules";


function Profile() {
  // FIX: useAuth() instead of useContext(AuthContext)
  const { user } = useAuth();
  const { theme, themeInfo } = useTheme();
  const {
    solvedProblems,
    activityDates,
    recentActivity,
  } = useAppContext();

  const canSwitchUniverse = canChangeTheme({
    solvedCount: solvedProblems.length,
    selectedAt: themeInfo?.lastChangedAt,
  });

  const unlockProgress = getThemeUnlockProgress({
    solvedCount: solvedProblems.length,
    selectedAt: themeInfo?.lastChangedAt,
  });

  const [leetcodeUsername, setLeetcodeUsername] = useState(
    () => localStorage.getItem(PROGRESS_KEYS.leetcodeUsername) || ""
  );

  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const joinedDate =
    localStorage.getItem(PROGRESS_KEYS.joinedDate) || "Recently";

  async function handleSaveLeetcode() {
    setError(err.message || "Failed to save LeetCode username.");
    setSaved(true);

    try {
      await apiFetch("/api/me", {
        method: "PATCH",
        body: JSON.stringify({ leetcodeUsername }),
      });

      localStorage.setItem(PROGRESS_KEYS.leetcodeUsername, leetcodeUsername);
      setSaved(true);
      toast.success("LeetCode username saved!");
    } catch (err) {
      setError(err.message || "Failed to save");
      toast.error("Failed to save LeetCode username.");
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl space-y-8">
        <h1 className="text-4xl font-bold">Profile</h1>

        {/* User info card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 flex items-center gap-6">
          {user?.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName || "User"}
              className="w-20 h-20 rounded-full"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-zinc-800 flex items-center justify-center text-2xl font-bold">
              {(user?.displayName || "U")[0]}
            </div>
          )}

          <div>
            <h2 className="text-2xl font-semibold">
              {user?.displayName || "User"}
            </h2>
            <p className="text-zinc-400">{user?.email}</p>
            <p className="text-zinc-500 text-sm mt-1">
              Joined {joinedDate}
            </p>
          </div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <h2 className="text-xl font-semibold mb-4">
            Current Universe
          </h2>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold">
                {theme.name}
              </p>
              <p className="text-zinc-400 mt-2">
                {theme.description}
              </p>

              <p className="text-zinc-400 mt-1">
                Your Code Club experience is currently running in this universe.
              </p>
            </div>

            <button
              disabled={!canSwitchUniverse}
              onClick={() => navigate("/theme-selection")}
              className={`
    px-4 py-2 rounded-xl
    font-medium transition
    ${canSwitchUniverse
                  ? "bg-green-500 text-black hover:bg-green-600"
                  : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                }
  `}
            >
              {canSwitchUniverse ? "Change Universe" : "Locked"}
            </button>
          </div>

          <div className="text-zinc-500 text-sm mt-4">
            <div>
              Selected:{" "}
              {themeInfo?.lastChangedAt
                ? new Date(themeInfo.lastChangedAt).toLocaleDateString()
                : "Unknown"}
            </div>

            {!canSwitchUniverse && (
              <div className="mt-2">
                Universe change available in:

                <br />

                {unlockProgress.problemsRemaining} more solved problems

                <br />

                OR

                <br />

                {unlockProgress.daysRemaining} more days
              </div>
            )}
          </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <p className="text-zinc-400 text-sm">Solved</p>
          <p className="text-3xl font-bold mt-1">
            {solvedProblems.length}
          </p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <p className="text-zinc-400 text-sm">Streak days</p>
          <p className="text-3xl font-bold mt-1">
            {activityDates.length}
          </p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <p className="text-zinc-400 text-sm">Rank</p>
          <p className="text-3xl font-bold mt-1">
            {getUserRank()}
          </p>
          <p className="text-zinc-500 text-sm mt-1">
            Level {getUserLevel()}
          </p>
        </div>
      </div>

      {/* LeetCode username */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <h2 className="text-xl font-semibold mb-4">
          LeetCode Username
        </h2>
        <div className="flex gap-3">
          <input
            type="text"
            value={leetcodeUsername}
            onChange={(e) => setLeetcodeUsername(e.target.value)}
            placeholder="your-leetcode-username"
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 outline-none"
          />
          <button
            onClick={handleSaveLeetcode}
            className="bg-green-500 text-black px-6 py-3 rounded-xl font-semibold hover:bg-green-600 transition"
          >
            Save
          </button>
        </div>

        {saved && (
          <p className="text-green-400 text-sm mt-2">
            Saved successfully
          </p>
        )}

        {error && (
          <p className="text-red-400 text-sm mt-2">
            {error}
          </p>
        )}
      </div>

      {/* Recent Activity */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <h2 className="text-xl font-semibold mb-4">
          Recent Activity
        </h2>

        {recentActivity.length === 0 ? (
          <p className="text-zinc-400">
            No activity yet. Solve a problem to get started.
          </p>
        ) : (
          <div className="space-y-3">
            {recentActivity.map((item, index) => (
              <div
                key={index}
                className="bg-zinc-800 px-4 py-3 rounded-xl flex justify-between items-center"
              >
                <div className="flex items-center gap-3">
                  {/* Status indicator dot */}
                  <span
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${item.status?.includes("Accepted")
                      ? "bg-green-500"
                      : "bg-red-500"
                      }`}
                  />
                  <span className="text-sm">{item.title}</span>
                </div>
                <span className="text-zinc-500 text-sm flex-shrink-0 ml-4">
                  {item.time}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    </DashboardLayout >
  );
}

export default Profile;