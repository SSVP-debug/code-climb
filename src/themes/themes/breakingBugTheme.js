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
    },
});