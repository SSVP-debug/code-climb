export function createTheme(config) {
    return {
        id: config.id,
        name: config.name,
        description: config.description,

        colors: {
            primary: config.colors.primary,
            secondary: config.colors.secondary,
            border: config.colors.border,
            accent: config.colors.accent,
        },

        words: {
            run: config.words.run,
            submit: config.words.submit,

            accepted: config.words.accepted,
            wrongAnswer: config.words.wrongAnswer,

            runtimeError: config.words.runtimeError,
            compileError: config.words.compileError,
            judgeError: config.words.judgeError,

            testcases: config.words.testcases,
            debug: config.words.debug,

            dashboard: config.words.dashboard,
            problems: config.words.problems,
            analytics: config.words.analytics,
            profile: config.words.profile,

            rank: config.words.rank,
            level: config.words.level,
            nextMilestone: config.words.nextMilestone,

            acceptanceRate: config.words.acceptanceRate,
            averageRuntime: config.words.averageRuntime,
            favoriteLanguage: config.words.favoriteLanguage,
            totalSubmissions: config.words.totalSubmissions,

            dailyChallenge: config.words.dailyChallenge,
            difficulty: config.words.difficulty,
            solveChallenge: config.words.solveChallenge,

            aiInsights: config.words.aiInsights,
            strongestTopic: config.words.strongestTopic,
            weakestTopic: config.words.weakestTopic,
            recommendation: config.words.recommendation,

            achievements: config.words.achievements,
            noAchievements: config.words.noAchievements,
            achievementIcon: config.words.achievementIcon,

            publicProfile: config.words.publicProfile,
            totalSolved: config.words.totalSolved,
            easySolved: config.words.easySolved,
            mediumSolved: config.words.mediumSolved,
            hardSolved: config.words.hardSolved,
            topics: config.words.topics,
            joined: config.words.joined,
            recentActivity: config.words.recentActivity,
            connectLeetcode: config.words.connectLeetcode,
        },

        emptyStates: config.emptyStates ?? {},
        dashboard: config.dashboard ?? {},
        profile: config.profile ?? {},
    };
}

export const THEME_WORD_KEYS = [
    "dashboard",
    "problems",
    "analytics",
    "profile",

    "run",
    "submit",

    "accepted",
    "wrongAnswer",
    "runtimeError",
    "compileError",
    "judgeError",

    "testcases",
    "debug",

    "rank",
    "level",
    "nextMilestone",

    "acceptanceRate",
    "averageRuntime",
    "favoriteLanguage",
    "totalSubmissions",

    "dailyChallenge",
    "difficulty",
    "solveChallenge",

    "aiInsights",
    "strongestTopic",
    "weakestTopic",
    "recommendation",

    "achievements",
    "noAchievements",
    "achievementIcon",

    "publicProfile",
    "totalSolved",
    "easySolved",
    "mediumSolved",
    "hardSolved",
    "topics",
    "joined",
    "recentActivity",
    "connectLeetcode"
];