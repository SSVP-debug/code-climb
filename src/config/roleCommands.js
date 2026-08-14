import { LayoutDashboard, ListChecks, Trophy, Award, BarChart3, User, Settings, Sparkles, Users, ClipboardList, Building2, Shuffle, CalendarCheck } from "lucide-react";

/**
 * roleCommands.js — Navbar transformation, Phase C.
 *
 * Builds the command list for the shared CommandPalette per role, for the
 * three roles (student/recruiter/tpo) that never had search wired up at
 * all — Admin keeps its own richer command set in AdminLayout.jsx
 * unchanged (live pending-approval counts, system health action — real
 * data this file has no access to), so this is deliberately NOT reused
 * for admin, to avoid the "multiple competing search systems" trap.
 *
 * Same honesty rule CommandPalette's own admin usage already follows:
 * every entry here is a real route that exists in App.jsx, or a real
 * action with an actual handler (Random Problem, Daily Challenge — both
 * copied from AvatarDropdown's existing implementation, not new
 * behavior). No entry pretends to full-text search problems/candidates/
 * colleges by name — there's no backend search endpoint for that today
 * (see CommandPalette.jsx's own note on this for the admin case).
 */
export function buildRoleCommands({ role, theme, navigate }) {
  if (role === "recruiter") {
    return [
      {
        id: "nav-recruiter-candidates",
        group: "Go to",
        label: "Candidates",
        icon: Users,
        to: "/recruiter/dashboard",
        keywords: "recruiter candidates talent",
      },
      {
        id: "nav-recruiter-tests",
        group: "Go to",
        label: "Sent Tests",
        icon: ClipboardList,
        to: "/candidate/tests",
        keywords: "assessments tests sent",
      },
      {
        id: "nav-recruiter-profile",
        group: "Go to",
        label: theme.words.profile,
        icon: User,
        to: "/profile",
        keywords: "profile account",
      },
    ];
  }

  if (role === "tpo") {
    return [
      {
        id: "nav-tpo-dashboard",
        group: "Go to",
        label: "College Dashboard",
        icon: Building2,
        to: "/tpo/dashboard",
        keywords: "tpo college dashboard placements",
      },
      {
        id: "nav-tpo-profile",
        group: "Go to",
        label: theme.words.profile,
        icon: User,
        to: "/profile",
        keywords: "profile account",
      },
    ];
  }

  // Default: student.
  return [
    {
      id: "nav-student-dashboard",
      group: "Go to",
      label: theme.words.dashboard,
      icon: LayoutDashboard,
      to: "/dashboard",
      keywords: "dashboard home",
    },
    {
      id: "nav-student-problems",
      group: "Go to",
      label: theme.words.problems,
      icon: ListChecks,
      to: "/problems",
      keywords: "problems solve practice dsa",
    },
    {
      id: "nav-student-club",
      group: "Go to",
      label: "Club",
      icon: Trophy,
      to: "/club",
      keywords: "club leaderboard contests battle rooms",
    },
    {
      id: "nav-student-contests",
      group: "Go to",
      label: "Contests",
      icon: Trophy,
      to: "/club/public-contests",
      keywords: "contests compete",
    },
    {
      id: "nav-student-certifications",
      group: "Go to",
      label: "Certifications",
      icon: Award,
      to: "/certifications",
      keywords: "certifications certificate",
    },
    {
      id: "nav-student-analytics",
      group: "Go to",
      label: theme.words.analytics,
      icon: BarChart3,
      to: "/analytics",
      keywords: "analytics stats insights",
    },
    {
      id: "nav-student-profile",
      group: "Go to",
      label: theme.words.profile,
      icon: User,
      to: "/profile",
      keywords: "profile account",
    },
    {
      id: "nav-student-settings",
      group: "Go to",
      label: "Settings",
      icon: Settings,
      to: "/settings",
      keywords: "settings preferences",
    },
    {
      id: "nav-student-pricing",
      group: "Go to",
      label: "Pricing",
      icon: Sparkles,
      to: "/pricing",
      keywords: "pricing plans premium pro",
    },
    {
      id: "action-random-problem",
      group: "Actions",
      label: "Random Problem",
      icon: Shuffle,
      keywords: "random shuffle problem",
      // Dynamic import: same reasoning as AvatarDropdown's goToRandomProblem
      // — the ~7000-line problems catalog only loads when someone actually
      // triggers this, not on every page that renders the shared Navbar.
      action: async () => {
        const { default: problems } = await import("../data/problems");
        const pick = problems[Math.floor(Math.random() * problems.length)];
        navigate(`/problems/${pick.slug}`);
      },
    },
    {
      id: "action-daily-challenge",
      group: "Actions",
      label: theme.words.dailyChallenge,
      icon: CalendarCheck,
      keywords: "daily challenge today",
      action: async () => {
        const { getDailyChallenge } = await import("../utils/dailyChallenge");
        const dc = await getDailyChallenge();
        navigate(`/problems/${dc.slug}`);
      },
    },
  ];
}
