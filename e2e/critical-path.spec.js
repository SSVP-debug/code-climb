/**
 * e2e/critical-path.spec.js
 *
 * The one flow the Staff review explicitly asked for coverage on (§10,
 * improvement #17): sign up → solve a problem → see XP update → appear on
 * the leaderboard. This exercises the real frontend AND the real backend
 * (including the S1 server-side-verified-solve fix from earlier passes —
 * nothing here is mocked at the network layer, on purpose. See
 * e2e/README.md before running this; it needs real infrastructure up.
 */
import { test, expect } from "@playwright/test";
import { createTestUser } from "./fixtures/testUser.js";

// Matches backend/problems/two-sum/starter/python.py's real signature
// (class Solution: def twoSum(self, nums, target)) — not the decorative
// standalone-function version shown in the marketing landing page.
const TWO_SUM_SOLUTION = `class Solution:
    def twoSum(self, nums, target):
        seen = {}
        for i, num in enumerate(nums):
            complement = target - num
            if complement in seen:
                return [seen[complement], i]
            seen[num] = i
        return []`;

test.describe.serial("critical path: login → solve → XP → leaderboard", () => {
  let user;

  test.beforeAll(async () => {
    user = await createTestUser();
  });

  test("logs in via the E2E auth bypass and reaches the dashboard", async ({ page }) => {
    await page.goto(
      `/e2e-login?email=${encodeURIComponent(user.email)}&password=${encodeURIComponent(user.password)}`
    );
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });
  });

  test("starts at 0 XP on a brand-new account", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByTestId("dashboard-xp")).toHaveText("0 XP");
  });

  test("solves Two Sum and gets an Accepted result", async ({ page }) => {
    await page.goto("/problems/two-sum");

    // Monaco renders into a contenteditable/textarea combo; selecting all
    // and typing is more reliable across Monaco versions than trying to
    // target its internal DOM structure directly.
    const editor = page.locator(".monaco-editor").first();
    await editor.click();
    await page.keyboard.press("ControlOrMeta+A");
    await page.keyboard.type(TWO_SUM_SOLUTION);

    await page.getByTestId("submit-code-button").click();

    // Real Judge0 grading — this can genuinely take several seconds,
    // hence this test's generous timeout in playwright.config.js.
    const banner = page.getByTestId("submission-result-banner");
    await expect(banner).toBeVisible({ timeout: 30_000 });
    await expect(banner).toHaveAttribute("data-accepted", "true");
  });

  test("dashboard XP increased after the accepted solve", async ({ page }) => {
    await page.goto("/dashboard");
    const xpText = await page.getByTestId("dashboard-xp").textContent();
    const xp = parseInt(xpText, 10);
    expect(xp).toBeGreaterThan(0);
  });

  test("the account appears on the global leaderboard", async ({ page }) => {
    await page.goto("/leaderboard");

    const row = page.locator(`[data-testid="leaderboard-row"]`, { hasText: user.displayName });
    await expect(row).toBeVisible({ timeout: 10_000 });
  });
});
