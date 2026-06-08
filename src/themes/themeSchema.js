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
            testcases: config.words.testcases,
            debug: config.words.debug,
            dashboard: config.words.dashboard,
            problems: config.words.problems,
            analytics: config.words.analytics,
            profile: config.words.profile,
            
        },

        emptyStates: config.emptyStates ?? {},
        dashboard: config.dashboard ?? {},
        profile: config.profile ?? {},
    };
}