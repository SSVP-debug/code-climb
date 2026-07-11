import { useState, useEffect } from "react";
import { apiFetch } from "../services/api";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/authContext";
import { useAppContext } from "../hooks/useAppContext";
import { useTheme } from "../context/ThemeContext";
import DashboardLayout from "../layouts/DashboardLayout";

// ── UI foundation ──────────────────────────────────────────────────────────────
import SectionCard from "../components/ui/layout/SectionCard";
import Button from "../components/ui/Button";
import EmptyState from "../components/ui/feedback/EmptyState";
import ContentSlot from "../components/ui/slots/ContentSlot";
import ConnectLeetCodeSection from "../components/dashboard/ConnectLeetCodeSection";
import AchievementGallery from "../components/dashboard/sections/AchievementGallery";


// ── Integrations data ──────────────────────────────────────────────────────────

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

// ── StatusBadge — unchanged ────────────────────────────────────────────────────

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

// ── IntegrationRow — unchanged ─────────────────────────────────────────────────

function IntegrationRow({ integration }) {
  const { name, description, status, icon, iconBg, iconColor } = integration;
  return (
    <div className="flex items-center justify-between py-4 border-b border-zinc-800 last:border-0">
      <div className="flex items-center gap-4">
        <div
          className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center text-sm font-bold ${iconColor} flex-shrink-0`}
        >
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

// ── Profile ────────────────────────────────────────────────────────────────────

function Profile() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [currentUsername, setCurrentUsername] = useState("");
  const [username, setUsername] = useState("");
  const [savingUsername, setSavingUsername] = useState(false);
  const [leetcodeInitial, setLeetcodeInitial] = useState(null);

  function downloadProfilePDF() {
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
    import("../services/auth").then(({ getIdToken }) => {
      getIdToken().then(token => {
        fetch(`${API_URL}/api/profile/pdf`, {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then(r => r.blob())
          .then(blob => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${currentUsername || "profile"}_CodeClub_Profile.pdf`;
            a.click();
            URL.revokeObjectURL(url);
          })
          .catch(() => toast.error("PDF generation failed. Try again."));
      });
    });
  }

  useEffect(() => {
    async function loadProfileInfo() {
      try {
        const data = await apiFetch("/api/users/me");
        setCurrentUsername(data.username || "");
        setUsername(data.username || "");
        if (data.leetcodeUsername) {
          setLeetcodeInitial({
            username: data.leetcodeUsername,
            ...data.leetcodeStats,
          });
        }
      } catch {
        // ignore — username is cosmetic, not critical
      }
    }
    loadProfileInfo();
  }, []);

  const { theme } = useTheme();
  const {
    solvedProblems,
    recentActivity,
    submissions,
    currentStreak,
  } = useAppContext();


  const joinedDate = user?.createdAt || "Recently";
  const recentSubmissions = submissions.slice(0, 5);
  const level = solvedProblems.length;

  const rank =
    level < 5 ? "Beginner" :
      level < 15 ? "Learner" :
        level < 30 ? "Intermediate" :
          level < 60 ? "Advanced" : "Expert";

  // ── Handlers ──────────────────────────────────────────────────────────────

  async function handleSaveUsername() {
    try {
      setSavingUsername(true);
      const result = await apiFetch("/api/users/me", {
        method: "PATCH",
        body: JSON.stringify({ username }),
      });
      setCurrentUsername(result.username);
      toast.success("Username saved");
    } catch (err) {
      toast.error(err.message || "Failed to save username");
    } finally {
      setSavingUsername(false);
    }
  }

  function handleCopyProfileLink() {
    navigator.clipboard.writeText(`${window.location.origin}/u/${currentUsername}`);
    toast.success("Profile link copied!");
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <DashboardLayout>
      <div className="max-w-3xl space-y-8">

        <h1 className="text-4xl font-bold">Profile</h1>

        {/* ── 1. User identity card ─────────────────────────────────────── */}
        {/*
          No title prop → SectionCard renders no header, matching the original
          layout where the avatar IS the visual hierarchy anchor.
        */}
        <ContentSlot id="profile-identity">
          <SectionCard className="flex items-center gap-6">
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || "User"}
                className="w-20 h-20 rounded-full flex-shrink-0"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-zinc-800 flex items-center justify-center text-2xl font-bold flex-shrink-0">
                {(user?.displayName || "U")[0]}
              </div>
            )}
            <div>
              <h2 className="text-2xl font-semibold">{user?.displayName || "User"}</h2>
              <p className="text-zinc-400">{user?.email}</p>
              <p className="text-zinc-500 text-sm mt-1">Joined {joinedDate}</p>
            </div>
          </SectionCard>
        </ContentSlot>

        {/* ── 2. Public profile / username ──────────────────────────────── */}
        <ContentSlot id="profile-public">
          <SectionCard title="Public Profile">
            <div className="space-y-4">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Choose a username"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3"
              />

              <button
                disabled={savingUsername}
                onClick={handleSaveUsername}
                className="bg-green-500 text-black px-4 py-2 rounded-xl font-medium"
              >
                Save Username
              </button>

              {currentUsername && (
                <div className="bg-zinc-800 rounded-xl p-4">
                  <p className="text-sm text-zinc-400">Public URL</p>
                  <p className="font-mono mt-1 break-all">
                    {window.location.origin}/u/{currentUsername}
                  </p>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleCopyProfileLink}
                    className="mt-3"
                  >
                    Copy Profile Link
                  </Button>
                  <Button
                    size="sm"
                    onClick={downloadProfilePDF}
                    className="mt-3 ml-3"
                  >
                    Export Profile
                  </Button>
                </div>
              )}
            </div>
          </SectionCard>
        </ContentSlot>

        

        {/* ── 4. Stats row ──────────────────────────────────────────────── */}
        {/*
          Three equal-width stat cards — kept as a raw grid because these
          are not individually wrapped sections; they form one visual unit.
          Future: extract into a <StatGrid> if it grows beyond 3 items.
        */}
        <ContentSlot id="profile-stats">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SectionCard>
              <p className="text-zinc-400 text-sm">Solved</p>
              <p className="text-3xl font-bold mt-1">{solvedProblems.length}</p>
            </SectionCard>

            <SectionCard>
              <p className="text-zinc-400 text-sm">Current Streak</p>
              <p className="text-3xl font-bold mt-1">{currentStreak}</p>
            </SectionCard>

            <SectionCard>
              <p className="text-zinc-400 text-sm">Rank</p>
              <p className="text-3xl font-bold mt-1">{rank}</p>
              <p className="text-zinc-500 text-sm mt-1">Level {level}</p>
            </SectionCard>
          </div>
        </ContentSlot>

        {/* ── 4b. Achievements ──────────────────────────────────────────── */}
        {/* Fixes the Dashboard's "View All →" link (RecentAchievementCard),
            which has always pointed here — this gallery didn't exist on this
            page until now. Component was fully built but never imported
            anywhere (see phase-audit findings). */}
        <ContentSlot id="profile-achievements">
          <AchievementGallery />
        </ContentSlot>

        {/* ── 5. Integrations ───────────────────────────────────────────── */}
        <ContentSlot id="profile-integrations">
          <SectionCard
            title="Integrations"
            subtitle="Connect your coding profiles to unlock unified analytics and cross-platform insights."
            action={
              <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded-lg">
                More platforms coming
              </span>
            }
          >
            <div className="pb-4 mb-4 border-b border-zinc-800">
              <ConnectLeetCodeSection initial={leetcodeInitial} />
            </div>
            <div className="divide-y divide-zinc-800">
              {INTEGRATIONS.map((integration) => (
                <IntegrationRow key={integration.id} integration={integration} />
              ))}
            </div>
          </SectionCard>
        </ContentSlot>

        {/* ── 6. Recent Activity ────────────────────────────────────────── */}
        <ContentSlot id="profile-activity">
          <SectionCard title="Recent Activity">
            {recentActivity.length === 0 ? (
              <EmptyState
                icon="📭"
                title="No activity yet"
                description="Solve a problem to start building your activity history."
                actionLabel="Browse Problems"
                actionHref="/problems"
                compact
              />
            ) : (
              <div className="space-y-3">
                {recentActivity.map((item, index) => (
                  <div
                    key={index}
                    className="bg-zinc-800 px-4 py-3 rounded-xl flex justify-between items-center"
                  >
                    <div className="flex items-center gap-3">
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
          </SectionCard>
        </ContentSlot>

        {/* ── 7. Recent Submissions ─────────────────────────────────────── */}
        <ContentSlot id="profile-submissions">
          <SectionCard title="Recent Submissions">
            {recentSubmissions.length === 0 ? (
              <EmptyState
                icon="📝"
                title="No submissions yet"
                description="Submit your first solution to see your history here."
                actionLabel="Start solving"
                actionHref="/problems"
                compact
              />
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
                      <p
                        className={
                          submission.status?.includes("Accepted")
                            ? "text-green-500"
                            : "text-red-500"
                        }
                      >
                        {submission.status}
                      </p>
                      <p className="text-xs text-zinc-500">{submission.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </ContentSlot>

      </div>
    </DashboardLayout>
  );
}

export default Profile;