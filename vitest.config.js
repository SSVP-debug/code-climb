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
  },
});