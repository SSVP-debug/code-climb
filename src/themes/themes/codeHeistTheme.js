import { createTheme } from "../themeSchema";

export const codeHeistTheme = createTheme({
    id: "codeHeist",

    name: "Code Heist",

    description:
        "Crack vaults, bypass security systems and become a legendary hacker.",

    colors: {
        primary: "#facc15",
        secondary: "#18181b",
        border: "#3f3f46",
        accent: "#eab308",
    },

    words: {
        run: "Open Vault",
        submit: "Execute Heist",

        accepted: "Heist Successful",
        wrongAnswer: "Security Triggered",

        runtimeError: "Escape Failed",
        compileError: "Wrong Access Code",

        testcases: "Checkpoints",
        debug: "Security Logs",

        dashboard: "Operations",
        problems: "Vaults",
        analytics: "Intel",
        profile: "Profile Alias",
    },
});