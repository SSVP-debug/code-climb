import { createTheme } from "../themeSchema";

/**
 * Default — the neutral, unthemed experience.
 * No story, no roleplay — just plain, standard product language.
 * This is what a user gets after "Reset to Default Theme" in Settings.
 */
export const defaultTheme = createTheme({
    id: "default",

    name: "Default",

    description:
        "A clean, no-frills experience with standard labels — no story, no roleplay.",

    colors: {
        primary: "#ffffff",
        secondary: "#18181b",
        border: "#3f3f46",
        accent: "#71717a",
    },

    words: {
        run: "Run",
        submit: "Submit",

        accepted: "Accepted",
        wrongAnswer: "Wrong Answer",

        runtimeError: "Runtime Error",
        compileError: "Compile Error",

        testcases: "Test Cases",
        debug: "Debug Console",

        dashboard: "Dashboard",
        problems: "Problems",
        analytics: "Analytics",
        profile: "Profile",
        judgeError: "Judge Error",
        rank: "Rank",
        level: "Level",
        nextMilestone: "more problems to next level",
        acceptanceRate: "Acceptance Rate",
        averageRuntime: "Average Runtime",
        favoriteLanguage: "Favorite Language",
        totalSubmissions: "Total Submissions",
        dailyChallenge: "Daily Challenge",
        difficulty: "Difficulty",
        solveChallenge: "Solve Challenge",
        aiInsights: "AI Insights",
        strongestTopic: "Strongest Topic",
        weakestTopic: "Weakest Topic",
        recommendation: "Recommendation",
        coachNote: "Coach's Note",
        achievements: "Achievements",
        noAchievements: "No achievements unlocked yet.",
        achievementIcon: "🏆",
        publicProfile: "Public Profile",
        totalSolved: "Total Solved",
        easySolved: "Easy Solved",
        mediumSolved: "Medium Solved",
        hardSolved: "Hard Solved",
        topics: "Topics",
        joined: "Joined",
        recentActivity: "Recent Activity",
        connectLeetcode: "Connect LeetCode",
        searchProblems: "Search problems...",
        all: "All",
        easy: "Easy",
        medium: "Medium",
        hard: "Hard",

        problemFound: "problem found",
        problemsFound: "problems found",

        noProblemsFound: "No problems match your filters.",
        clearFilters: "Clear Filters",
        topic: "Topic",
        solveProblem: "Solve Problem",
        language: "Language",
        advancedTesting: "Advanced Testing",
        customInput: "Custom Input",
        customInputPlaceholder: "Enter custom input...",
    },
});