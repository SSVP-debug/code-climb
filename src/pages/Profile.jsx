import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/authContext";
import { useAppContext } from "../hooks/useAppContext";
import { PROGRESS_KEYS } from "../constants/progressKeys";
import { useTheme } from "../context/ThemeContext";
import { canChangeTheme, getThemeUnlockProgress } from "../utils/themeRules";
import DashboardLayout from "../layouts/DashboardLayout";

// ── Integrations data ─────────────────────────────────────────────────────────

const INTEGRATIONS = [
  {
    id: "google",
    name: "Google Account",
    description: "Sign in and sync your identity across devices.",
    status: "connected",
    icon: "G",
    iconBg: "bg-white",
    iconColor: "text-zinc-900",
  },
  {
    id: "leetcode",
    name: "LeetCode",
    description: "Cross-platform coding analytics and unified progress insights.",
    status: "coming-soon",
    icon: "L",
    iconBg: "bg-orange-500",
    iconColor: "text-white",
  },
  {
    id: "codeforces",
    name: "Codeforces",
    description: "Track competitive programming performance and ratings.",
    status: "planned",
    icon: "CF",
    iconBg: "bg-blue-600",
    iconColor: "text-white",
  },
  {
    id: "gfg",
    name: "GeeksforGeeks",
    description: "Import coding activity, streaks, and achievements.",
    status: "planned",
    icon: "G",
    iconBg: "bg-green-600",
    iconColor: "text-white",
  },
];

// ── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  if (status === "connected") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-500/10 text-green-400 border border-green-500/20">
        <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
        Connected
      </span>
    );
  }
  if (status === "coming-soon") {
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-zinc-700 text-zinc-300 border border-zinc-600">
        Coming Soon
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-zinc-800 text-zinc-500 border border-zinc-700">
      Planned
    </span>
  );
}

// ── Integration row ───────────────────────────────────────────────────────────

function IntegrationRow({ integration }) {
  const { id, name, description, status, icon, iconBg, iconColor } = integration;

  return (
    <div className="flex items-center justify-between py-4 border-b border-zinc-800 last:border-0">
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center text-sm font-bold ${iconColor} flex-shrink-0`}>
          {icon}
        </div>
        <div>
          <p className="font-medium text-white text-sm">{name}</p>
          <p className="text-zinc-500 text-xs mt-0.5">{description}</p>
        </div>
      </div>
      <div className="flex-shrink-0 ml-4">
        <StatusBadge status={status} />
      </div>
    </div>
  );
}

// ── Profile page ──────────────────────────────────────────────────────────────

function Profile() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme, themeInfo } = useTheme();
  const {
    solvedProblems,
    activityDates,
    recentActivity,
    submissions,
    currentStreak,
  } = useAppContext();

  const canSwitchUniverse = canChangeTheme({
    solvedCount: solvedProblems.length,
    selectedAt: themeInfo?.lastChangedAt,
  });

  const unlockProgress = getThemeUnlockProgress({
    solvedCount: solvedProblems.length,
    selectedAt: themeInfo?.lastChangedAt,
  });

  const joinedDate = localStorage.getItem(PROGRESS_KEYS.joinedDate) || "Recently";
  const recentSubmissions = submissions.slice(0, 5);
  const level = solvedProblems.length;

  const rank =
    level < 5
      ? "Beginner"
      : level < 15
        ? "Learner"
        : level < 30
          ? "Intermediate"
          : level < 60
            ? "Advanced"
            : "Expert";

  return (
    <DashboardLayout>
      <div className="max-w-3xl space-y-8">

        <h1 className="text-4xl font-bold">Profile</h1>

        {/* User info */}
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
            <h2 className="text-2xl font-semibold">{user?.displayName || "User"}</h2>
            <p className="text-zinc-400">{user?.email}</p>
            <p className="text-zinc-500 text-sm mt-1">Joined {joinedDate}</p>
          </div>
        </div>

        {/* Universe */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <h2 className="text-xl font-semibold mb-4">Current Universe</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold">{theme.name}</p>
              <p className="text-zinc-400 mt-2">{theme.description}</p>
              <p className="text-zinc-400 mt-1">
                Your Code Club experience is currently running in this universe.
              </p>
            </div>
            <button
              disabled={!canSwitchUniverse}
              onClick={() => navigate("/theme-selection")}
              className={`px-4 py-2 rounded-xl font-medium transition ${canSwitchUniverse
                ? "bg-green-500 text-black hover:bg-green-600"
                : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                }`}
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
                <br />{unlockProgress.problemsRemaining} more solved problems
                <br />OR
                <br />{unlockProgress.daysRemaining} more days
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <p className="text-zinc-400 text-sm">Solved</p>
            <p className="text-3xl font-bold mt-1">{solvedProblems.length}</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <p className="text-zinc-400 text-sm">Current Streak</p>
            <p className="text-3xl font-bold mt-1">{currentStreak}</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <p className="text-zinc-400 text-sm">Rank</p>
            <p className="text-3xl font-bold mt-1">{rank}</p>
            <p className="text-zinc-500 text-sm mt-1">Level {level}</p>
          </div>
        </div>

        {/* ── Integrations ─────────────────────────────────────────────── */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <div className="flex items-start justify-between mb-1">
            <h2 className="text-xl font-semibold">Integrations</h2>
            <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded-lg">
              More platforms coming
            </span>
          </div>
          <p className="text-zinc-500 text-sm mb-6">
            Connect your coding profiles to unlock unified analytics and cross-platform insights.
          </p>

          <div className="divide-y divide-zinc-800">
            {INTEGRATIONS.map((integration) => (
              <IntegrationRow key={integration.id} integration={integration} />
            ))}
          </div>
        </div>

        {/* Recent activity */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
          {recentActivity.length === 0 ? (
            <p className="text-zinc-400">No activity yet. Solve a problem to get started.</p>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((item, index) => (
                <div
                  key={index}
                  className="bg-zinc-800 px-4 py-3 rounded-xl flex justify-between items-center"
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${item.status?.includes("Accepted") ? "bg-green-500" : "bg-red-500"
                      }`} />
                    <span className="text-sm">{item.title}</span>
                  </div>
                  <span className="text-zinc-500 text-sm flex-shrink-0 ml-4">{item.time}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent submissions */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Submissions</h2>
          {recentSubmissions.length === 0 ? (
            <p className="text-zinc-500">No submissions yet.</p>
          ) : (
            <div className="space-y-3">
              {recentSubmissions.map((submission) => (
                <div
                  key={submission.id || submission.createdAt || Math.random()}
                  className="flex justify-between items-center border-b border-zinc-800 pb-2 last:border-0"
                >
                  <div>
                    <p className="font-medium">{submission.problemTitle}</p>
                    <p className="text-xs text-zinc-500">{submission.language}</p>
                  </div>
                  <div className="text-right">
                    <p className={submission.status?.includes("Accepted") ? "text-green-500" : "text-red-500"}>
                      {submission.status}
                    </p>
                    <p className="text-xs text-zinc-500">{submission.date}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </DashboardLayout>
  );
}

export default Profile;
