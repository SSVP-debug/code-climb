import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    react({
      jsxRuntime: "automatic",
    }),
  ],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/test/setup.js",

    include: [
      "src/**/*.test.{js,jsx,ts,tsx}",
    ],

    exclude: [
      "backend/**",
      "node_modules",
    ],

    // Coverage reporting (audit finding, Aug 2026 — no coverage tooling
    // existed at all before this). Deliberately NOT setting `thresholds`
    // yet: this repo has no historical coverage baseline, and guessing a
    // number risks either breaking CI on day one for everyone (guessed too
    // high) or being a no-op that quietly permits the ratio to erode
    // (guessed too low). Run `npm run test:coverage` locally or read the
    // first CI report (see ci.yml) to see the real number, then add
    // `thresholds: { statements: X, branches: X, functions: X, lines: X }`
    // here once that number is known and deliberately chosen — not before.
    coverage: {
      provider: "v8",
      reporter: ["text", "text-summary", "json-summary", "html"],
      include: ["src/**/*.{js,jsx}"],
      exclude: [
        "src/**/*.test.{js,jsx}",
        "src/test/**",
        "src/main.jsx",       // entry point, no logic to unit test
        "src/data/**",        // static data, not code
        "src/themes/themes/**", // theme config objects, not logic
      ],
    },
  },
});