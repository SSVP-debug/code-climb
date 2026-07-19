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
            ...config.words,
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
    "coachNote",

    "achievements",
    "noAchievements",
    "achievementIcon",
    "welcomeTagline",

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