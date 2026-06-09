import { createTheme } from "../themeSchema";

export const breakingBugTheme = createTheme({
    id: "breakingBug",

    name: "Breaking Bug",

    description:
        "Every bug is a reaction. Every solution is a discovery.",

    colors: {
        primary: "#22c55e",
        secondary: "#18181b",
        border: "#3f3f46",
        accent: "#16a34a",
    },

    words: {
        run: "Cook",
        submit: "Publish Research",

        accepted: "Crystal Clear",
        wrongAnswer: "Unstable Reaction",

        runtimeError: "Lab Explosion(runtimeError)",
        compileError: "Formula Corrupted(compileError)",

        testcases: "Experiments",
        debug: "Lab Report",
        dashboard: "Dashboard",
        problems: "Experiments",
        analytics: "Research Lab",
        profile: "Scientist Profile",
        judgeError: "Research System Failure",
        rank: "Scientist Rank",
        level: "Research Level",
        nextMilestone: "more experiments to next breakthrough",
        acceptanceRate: "Experiment Success Rate",
        averageRuntime: "Reaction Speed",
        favoriteLanguage: "Primary Formula",
        totalSubmissions: "Experiments Conducted",
        dailyChallenge: "Today's Experiment",
        difficulty: "Volatility",
        solveChallenge: "Run Experiment",
        aiInsights: "Research Analysis",
        strongestTopic: "Strongest Formula",
        weakestTopic: "Unstable Formula",
        recommendation: "Lab Recommendation",
        achievements: "Research Milestones",
        noAchievements: "No research milestones unlocked yet.",
        achievementIcon: "🧪",
        publicProfile: "Research Profile",
        totalSolved: "Experiments Verified",
        easySolved: "Stable Reactions",
        mediumSolved: "Reactive Studies",
        hardSolved: "Volatile Experiments",
        topics: "Research Fields",
        joined: "Lab Joined",
        recentActivity: "Research Timeline",
        connectLeetcode: "Connect Research Archive",
        searchProblems: "Search experiments...",
        all: "All",
        easy: "Stable",
        medium: "Reactive",
        hard: "Volatile",

        problemFound: "experiment found",
        problemsFound: "experiments found",

        noProblemsFound: "No experiments match your filters.",
        clearFilters: "Reset Research",

        topic: "Research Field",
        solveProblem: "Run Experiment",
        solved: "Verified",
    },
});