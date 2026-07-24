import { defineConfig } from "vitest/config";

// Node-environment config for backend tests — no jsdom (that's the
// frontend's vitest.config.js at the repo root). Tests mock Mongoose
// models and external calls (Judge0, Firebase Admin) directly via
// vi.mock rather than hitting a real database — see backend/test/README.md
// for the reasoning and for how to extend this once integration tests
// (e.g. via mongodb-memory-server) are worth the added setup cost.
export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["**/*.test.js"],
    exclude: ["node_modules", "problems", "**/*.integration.test.js"],
  },
});