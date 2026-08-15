import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useAppContext } from "../hooks/useAppContext";
import { useTheme } from "../hooks/useTheme";
import DashboardLayout from "../layouts/DashboardLayout";
import { getLevel, getLevelProgress } from "../utils/xpLevel";
import { Flame, BarChart3, Award, Zap, Inbox, FileText, ChevronDown } from "lucide-react";

// ── UI foundation ──────────────────────────────────────────────────────────────
import SectionCard from "../components/ui/layout/SectionCard";
import CollapsibleGroup from "../components/ui/layout/CollapsibleGroup";
import EmptyState from "../components/ui/feedback/EmptyState";
import ContentSlot from "../components/ui/slots/ContentSlot";
import ProfileQuickNav from "../components/profile/ProfileQuickNav";
import AchievementGallery from "../components/dashboard/sections/AchievementGallery";
import ActivityHeatmap from "../components/profile/ActivityHeatmap";
import SkillRadar from "../components/profile/SkillRadar";
import CodingDNA from "../components/profile/CodingDNA";
import JourneyTimeline from "../components/profile/JourneyTimeline";
import RecruiterSnapshot from "../components/profile/RecruiterSnapshot";
import ProfessionalPresence from "../components/profile/ProfessionalPresence";
import ResumeCard from "../components/profile/ResumeCard";
import FeaturedProject from "../components/profile/FeaturedProject";
import PinnedProblems from "../components/profile/PinnedProblems";
import ProfileCompletion from "../components/profile/ProfileCompletion";
import EducationSection from "../components/profile/EducationSection";
import ContestHistorySection from "../components/profile/ContestHistorySection";

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

  const [showAllActivity, setShowAllActivity] = useState(false);
  const [showAllSubmissions, setShowAllSubmissions] = useState(false);

  const ACTIVITY_PREVIEW_COUNT = 5;
  const SUBMISSIONS_PREVIEW_COUNT = 5;
  const SUBMISSIONS_EXPANDED_COUNT = 15; // capped even when "expanded" — full history isn't paginated here

  const visibleActivity = showAllActivity
    ? recentActivity
    : recentActivity.slice(0, ACTIVITY_PREVIEW_COUNT);

  const recentSubmissions = submissions.slice(
    0,
    showAllSubmissions ? SUBMISSIONS_EXPANDED_COUNT : SUBMISSIONS_PREVIEW_COUNT
  );

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

  // Quick-jump nav — mirrors the ContentSlot ids below, with the same
  // role gating so a link never points at a section that isn't rendered.
  const quickNavItems = [
    { id: "profile-identity", label: "Overview" },
    { id: "profile-professional-presence", label: "Presence" },
    ...(role === "student" ? [{ id: "profile-recruiter-snapshot", label: "Recruiter" }] : []),
    { id: "profile-heatmap-radar", label: "Activity & Skills" },
    { id: "profile-achievements", label: "Achievements" },
    { id: "profile-journey", label: "Journey" },
    { id: "profile-submissions", label: "Submissions" },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <DashboardLayout>
      <div className="max-w-3xl space-y-8">

        <h1 className="text-4xl font-bold">Profile</h1>

        <ProfileQuickNav items={quickNavItems} />

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

        {/* ── 1B. Developer Identity: Professional Presence + Resume ────── */}
        {/* GitHub/LinkedIn/Resume live here, right after the identity hero
            and before any account-nudge or recruiter content — this is
            "who is this developer / where can I learn more", not a
            settings section. See profile audit for placement rationale. */}
        <ContentSlot id="profile-professional-presence">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ProfessionalPresence />
            <ResumeCard />
          </div>
        </ContentSlot>

        {/* ── 1C. Featured Project ─────────────────────────────────────── */}
        <ContentSlot id="profile-featured-project">
          <FeaturedProject />
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

        {/* ── Contest History (Phase 12D) ──────────────────────────────── */}
        {role === "student" && (
          <ContentSlot id="profile-contest-history">
            <ContestHistorySection />
          </ContentSlot>
        )}

        {/* ── 4. Activity Heatmap + Skill Radar ───────────────────────────── */}
        {/* Both components already existed and already worked — ActivityHeatmap
            was mounted only on the public /u/:username page, never here. */}
        <ContentSlot id="profile-heatmap-radar">
          <CollapsibleGroup
            title="Activity & Skills"
            icon={<BarChart3 size={15} strokeWidth={2} />}
            defaultOpen
            storageKey="profile-collapse-heatmap-radar"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <ActivityHeatmap activityDates={activityDates} accentColor={theme.colors.primary} />
              <SkillRadar topicStats={topicStats} accentColor={theme.colors.primary} />
            </div>
          </CollapsibleGroup>
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
          <CollapsibleGroup
            title="Insights & Certifications"
            icon={<Award size={15} strokeWidth={2} />}
            defaultOpen={false}
            storageKey="profile-collapse-insights"
          >
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
          </CollapsibleGroup>
        </ContentSlot>

        {/* ── 8. Achievements ──────────────────────────────────────────── */}
        <ContentSlot id="profile-achievements">
          <AchievementGallery
            collapsible
            defaultOpen
            storageKey="profile-collapse-achievements"
          />
        </ContentSlot>

        {/* ── 9. Journey Timeline ──────────────────────────────────────── */}
        <ContentSlot id="profile-journey">
          <JourneyTimeline joinedDate={joinedDate} achievements={achievements} />
        </ContentSlot>

        {/* ── 10. Recent Activity ────────────────────────────────────────── */}
        <ContentSlot id="profile-activity">
          <SectionCard
            title="Recent Activity"
            icon={<Zap size={18} strokeWidth={2} />}
            accented
            collapsible
            defaultOpen
            storageKey="profile-collapse-activity"
          >
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
              <>
                <div className="space-y-3">
                  {visibleActivity.map((item, index) => (
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

                {recentActivity.length > ACTIVITY_PREVIEW_COUNT && (
                  <button
                    type="button"
                    onClick={() => setShowAllActivity((v) => !v)}
                    className="w-full mt-3 flex items-center justify-center gap-1.5 text-sm text-zinc-400 hover:text-white py-2 rounded-lg hover:bg-white/[0.03] transition"
                  >
                    {showAllActivity
                      ? "Show less"
                      : `Show ${recentActivity.length - ACTIVITY_PREVIEW_COUNT} more`}
                    <ChevronDown
                      size={15}
                      strokeWidth={2}
                      className={`transition-transform duration-200 ${showAllActivity ? "rotate-180" : ""}`}
                      aria-hidden="true"
                    />
                  </button>
                )}
              </>
            )}
          </SectionCard>
        </ContentSlot>

        {/* ── 11. Recent Submissions ─────────────────────────────────────── */}
        <ContentSlot id="profile-submissions">
          <SectionCard
            title="Recent Submissions"
            icon={<FileText size={18} strokeWidth={2} />}
            accented
            collapsible
            defaultOpen={false}
            storageKey="profile-collapse-submissions"
          >
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
              <>
                <div className="space-y-3">
                  {recentSubmissions.map((submission, index) => (
                    <div
                      key={submission.id || submission.createdAt || index}
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

                {submissions.length > SUBMISSIONS_PREVIEW_COUNT && (
                  <button
                    type="button"
                    onClick={() => setShowAllSubmissions((v) => !v)}
                    className="w-full mt-3 flex items-center justify-center gap-1.5 text-sm text-zinc-400 hover:text-white py-2 rounded-lg hover:bg-white/[0.03] transition"
                  >
                    {showAllSubmissions
                      ? "Show less"
                      : `Show ${Math.min(submissions.length, SUBMISSIONS_EXPANDED_COUNT) - SUBMISSIONS_PREVIEW_COUNT} more`}
                    <ChevronDown
                      size={15}
                      strokeWidth={2}
                      className={`transition-transform duration-200 ${showAllSubmissions ? "rotate-180" : ""}`}
                      aria-hidden="true"
                    />
                  </button>
                )}
              </>
            )}
          </SectionCard>
        </ContentSlot>

      </div>
    </DashboardLayout>
  );
}

export default Profile;