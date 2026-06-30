/**
 * THEME_OPTIONS — shown on the theme selection page.
 * All 5 themes are listed; new users pick from this list.
 * unlockXP: themes with an XP requirement are locked until earned.
 */
export const THEME_OPTIONS = [
  {
    id: "codeHeist",
    icon: "💰",
    name: "Code Heist",
    description: "Crack digital vaults and become a legendary hacker.",
    acceptedPreview: "Vault Breached",
    runtimePreview:  "Escape Failed",
    unlockXP: 0,   // free — available immediately
    onboardingTitle:   "Welcome to the underground.",
    onboardingMessage: "Every challenge is a vault. Every solution is a successful breach. Your first operation awaits.",
  },
  {
    id: "breakingBug",
    icon: "🧪",
    name: "Breaking Bug",
    description: "Every bug is a reaction. Every solution is a discovery.",
    acceptedPreview: "Crystal Clear",
    runtimePreview:  "Lab Explosion",
    unlockXP: 0,   // free
    onboardingTitle:   "Welcome to the laboratory.",
    onboardingMessage: "Every bug is a reaction. Every solution is a breakthrough. Your first experiment awaits.",
  },
  {
    id: "ghostProtocol",
    icon: "🔓",
    name: "Ghost Protocol",
    description: "Hack the system. Leave no trace. Root access is the only goal.",
    acceptedPreview: "Root Access ✅",
    runtimePreview:  "Kernel Panic",
    unlockXP: 500,   // unlock at 500 XP (~level 6)
    onboardingTitle:   "Welcome to the grid.",
    onboardingMessage: "You are not just a coder. You are the exploit. Every target is a system waiting to fall.",
  },
  {
    id: "survivalCode",
    icon: "🦑",
    name: "Survival Code",
    description: "456 players. One winner. Your code decides your fate.",
    acceptedPreview: "Survive ✅",
    runtimePreview:  "Eliminated",
    unlockXP: 1000,  // unlock at 1000 XP (~level 11)
    onboardingTitle:   "The game has begun.",
    onboardingMessage: "Every problem is a game. Every wrong answer is an elimination. Only the sharpest coder survives.",
  },
  {
    id: "debugDynasty",
    icon: "🚀",
    name: "Debug Dynasty",
    description: "Build the next big thing. One algorithm at a time.",
    acceptedPreview: "Deployed ✅",
    runtimePreview:  "Server Crashed",
    unlockXP: 2000,  // unlock at 2000 XP (~level 21)
    onboardingTitle:   "Welcome to the startup.",
    onboardingMessage: "Every algorithm is a product decision. Every bug is technical debt. Ship fast. Debug faster.",
  },
];
