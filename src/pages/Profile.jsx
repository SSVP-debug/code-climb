import { Link } from "react-router-dom";
import { useAuth } from "../context/authContext";
import { useAppContext } from "../hooks/useAppContext";
import { useTheme } from "../context/ThemeContext";
import DashboardLayout from "../layouts/DashboardLayout";
import { getLevel, getLevelProgress } from "../utils/xpLevel";
import { Flame, BarChart3, Award, Zap, Inbox, FileText } from "lucide-react";

// ── UI foundation ──────────────────────────────────────────────────────────────
import SectionCard from "../components/ui/layout/SectionCard";
import EmptyState from "../components/ui/feedback/EmptyState";
import ContentSlot from "../components/ui/slots/ContentSlot";
import AchievementGallery from "../components/dashboard/sections/AchievementGallery";
import ActivityHeatmap from "../components/profile/ActivityHeatmap";
import SkillRadar from "../components/profile/SkillRadar";
import CodingDNA from "../components/profile/CodingDNA";
import JourneyTimeline from "../components/profile/JourneyTimeline";
import RecruiterSnapshot from "../components/profile/RecruiterSnapshot";
import PinnedProblems from "../components/profile/PinnedProblems";
import ProfileCompletion from "../components/profile/ProfileCompletion";
import EducationSection from "../components/profile/EducationSection";

// ── Profile ────────────────────────────────────────────────────────────────────
// Phase 9B: Coding Identity build-out. Hero now shows the real XP-derived
// level (getLevel/getLevelProgress — same math as the public profile and
// backend) instead of the old solvedProblems.length value that was
// mislabeled "Level". Heatmap/Skill Radar/Coding DNA/Journey Timeline all
// run off data already hydrated into AppContext (topicStats, activityDates,
// totalXP, longestStreak, achievements, submissions, joinedDate) — no new
// endpoints. See PROJECT_STATE.md Phase 9 for the rest of the plan.

function Profile() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const {
    solvedProblems,
    recentActivity,
    submissions,
    currentStreak,
    longestStreak,
    totalXP,
    topicStats,
    activityDates,
    solvedDifficulty,
    achievements,
    joinedDate,
    role,
  } = useAppContext();

  const recentSubmissions = submissions.slice(0, 5);

  const level = getLevel(totalXP);
  const { current, needed, percent } = getLevelProgress(totalXP);

  const rank =
    level < 5 ? "Beginner" :
      level < 15 ? "Learner" :
        level < 30 ? "Intermediate" :
          level < 60 ? "Advanced" : "Expert";

  const joinedDisplay = joinedDate
    ? new Date(joinedDate).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
    : "Recently";

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <DashboardLayout>
      <div className="max-w-3xl space-y-8">

        <h1 className="text-4xl font-bold">Profile</h1>

        {/* ── 1. Hero ──────────────────────────────────────────────────── */}
        <ContentSlot id="profile-identity">
          <SectionCard accented>
            <div className="flex items-start gap-6">
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || "User"}
                  className="w-20 h-20 rounded-full flex-shrink-0"
                />
              ) : (
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold flex-shrink-0"
                  style={{
                    backgroundColor: `${theme.colors.primary}1f`,
                    color: theme.colors.primary,
                  }}
                >
                  {(user?.displayName || "U")[0]}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="text-2xl font-semibold">{user?.displayName || "User"}</h2>
                    <p className="text-zinc-400 text-sm">{user?.email}</p>
                    <p className="text-zinc-500 text-sm mt-1">Joined {joinedDisplay}</p>
                  </div>
                  <Link
                    to="/settings"
                    className="flex-shrink-0 text-sm text-zinc-400 hover:text-white transition whitespace-nowrap"
                  >
                    Account settings →
                  </Link>
                </div>

                {/* Level / XP progress */}
                <div className="mt-5">
                  <div className="flex items-baseline justify-between mb-1.5">
                    <span className="text-sm font-semibold text-white">
                      Level {level} · {rank}
                    </span>
                    <span className="text-xs text-zinc-500">
                      {current.toLocaleString()} / {needed.toLocaleString()} XP to next level
                    </span>
                  </div>
                  <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(percent, 100)}%`,
                        backgroundColor: theme.colors.primary,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick stat pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
              <div className="bg-zinc-800 rounded-xl p-3 text-center">
                <p className="text-xl font-bold">{totalXP.toLocaleString()}</p>
                <p className="text-zinc-500 text-xs mt-0.5">Total XP</p>
              </div>
              <div className="bg-zinc-800 rounded-xl p-3 text-center">
                <p className="text-xl font-bold">{solvedProblems.length}</p>
                <p className="text-zinc-500 text-xs mt-0.5">Solved</p>
              </div>
              <div className="bg-zinc-800 rounded-xl p-3 text-center">
                <p className="text-xl font-bold flex items-center justify-center gap-1.5">
                  <Flame size={18} strokeWidth={2} className="text-orange-400" aria-hidden="true" />
                  {currentStreak}
                </p>
                <p className="text-zinc-500 text-xs mt-0.5">Current Streak</p>
              </div>
              <div className="bg-zinc-800 rounded-xl p-3 text-center">
                <p className="text-xl font-bold">{longestStreak}</p>
                <p className="text-zinc-500 text-xs mt-0.5">Longest Streak</p>
              </div>
            </div>
          </SectionCard>
        </ContentSlot>

        {/* ── 2. Profile Completion nudge ──────────────────────────────── */}
        {/* Self-hides at 100% — see ProfileCompletion.jsx for why there's
            no "unlock 50 XP" reward here despite the audit mockup showing
            one: that needs a new backend XP-grant hook, flagged not faked. */}
        <ContentSlot id="profile-completion">
          <ProfileCompletion />
        </ContentSlot>

        {/* ── 3. Recruiter Snapshot ────────────────────────────────────── */}
        {/* Only meaningful for students — recruiter/TPO/admin accounts
            don't have a "looking for opportunities" state of their own. */}
        {role === "student" && (
          <ContentSlot id="profile-recruiter-snapshot">
            <RecruiterSnapshot />
          </ContentSlot>
        )}

        {/* ── Education & College Verification (Phase 12C) ────────────── */}
        {/* Also student-only — recruiters/TPO/Admin have their own,
            separate verification systems (recruiterProfile/tpoProfile). */}
        {role === "student" && (
          <ContentSlot id="profile-education">
            <EducationSection />
          </ContentSlot>
        )}

        {/* ── 4. Activity Heatmap + Skill Radar ───────────────────────────── */}
        {/* Both components already existed and already worked — ActivityHeatmap
            was mounted only on the public /u/:username page, never here. */}
        <ContentSlot id="profile-heatmap-radar">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ActivityHeatmap activityDates={activityDates} accentColor={theme.colors.primary} />
            <SkillRadar topicStats={topicStats} accentColor={theme.colors.primary} />
          </div>
        </ContentSlot>

        {/* ── 5. Coding DNA ────────────────────────────────────────────── */}
        <ContentSlot id="profile-coding-dna">
          <CodingDNA
            submissions={submissions}
            topicStats={topicStats}
            solvedDifficulty={solvedDifficulty}
            longestStreak={longestStreak}
          />
        </ContentSlot>

        {/* ── 6. Pinned Problems ───────────────────────────────────────── */}
        <ContentSlot id="profile-pinned-problems">
          <PinnedProblems />
        </ContentSlot>

        {/* ── 7. Insights & Certifications ───────────────────────────────── */}
        {/* Analytics and Certifications used to be separate top-level nav
            items. They live here now — personal, deep-dive detail belongs
            on the Profile page, not in the main navbar. */}
        <ContentSlot id="profile-insights">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              to="/analytics"
              className="group bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex items-center gap-4 hover:border-[var(--theme-primary,#2dd4bf)] transition"
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${theme.colors.primary}1f`, color: theme.colors.primary }}
              >
                <BarChart3 size={20} strokeWidth={2} aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold">{theme.words.analytics}</p>
                <p className="text-zinc-500 text-sm">Deep dive into your solving patterns.</p>
              </div>
              <span className="ml-auto text-zinc-500 group-hover:text-[var(--theme-primary,#2dd4bf)] transition flex-shrink-0">→</span>
            </Link>

            <Link
              to="/certifications"
              className="group bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex items-center gap-4 hover:border-[var(--theme-primary,#2dd4bf)] transition"
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${theme.colors.primary}1f`, color: theme.colors.primary }}
              >
                <Award size={20} strokeWidth={2} aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold">Certifications</p>
                <p className="text-zinc-500 text-sm">View and share what you've earned.</p>
              </div>
              <span className="ml-auto text-zinc-500 group-hover:text-[var(--theme-primary,#2dd4bf)] transition flex-shrink-0">→</span>
            </Link>
          </div>
        </ContentSlot>

        {/* ── 8. Achievements ──────────────────────────────────────────── */}
        <ContentSlot id="profile-achievements">
          <AchievementGallery />
        </ContentSlot>

        {/* ── 9. Journey Timeline ──────────────────────────────────────── */}
        <ContentSlot id="profile-journey">
          <JourneyTimeline joinedDate={joinedDate} achievements={achievements} />
        </ContentSlot>

        {/* ── 10. Recent Activity ────────────────────────────────────────── */}
        <ContentSlot id="profile-activity">
          <SectionCard title="Recent Activity" icon={<Zap size={18} strokeWidth={2} />} accented>
            {recentActivity.length === 0 ? (
              <EmptyState
                icon={<Inbox size={28} strokeWidth={1.75} />}
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

        {/* ── 11. Recent Submissions ─────────────────────────────────────── */}
        <ContentSlot id="profile-submissions">
          <SectionCard title="Recent Submissions" icon={<FileText size={18} strokeWidth={2} />} accented>
            {recentSubmissions.length === 0 ? (
              <EmptyState
                icon={<FileText size={28} strokeWidth={1.75} />}
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