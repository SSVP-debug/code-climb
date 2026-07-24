import { defineConfig } from "vitest/config";

// Real-Mongo integration tests (mongodb-memory-server), kept separate from
// the fast mock-based unit suite (backend/vitest.config.js) so the unit
// suite stays fast and hermetic, and so this tier's slower, network/binary-
// dependent nature doesn't affect the primary `npm test` feedback loop. Run
// via `npm run test:integration` — see backend/test/README.md.
export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["**/*.integration.test.js"],
    exclude: ["node_modules", "problems"],
    testTimeout: 30_000,
    hookTimeout: 60_000,
  },
});