import { test, expect } from "@playwright/test";
import { uiRegressionProfiles, uiScenarios } from "../domains/uiRegressionProfile";

for (const profile of uiRegressionProfiles) {
  test.describe(`${profile.name} visual regression`, () => {
    for (const scenario of uiScenarios) {
      test(`${scenario.id} should match baseline`, async ({ page }) => {
        await page.setViewportSize(profile.viewport);

        await page.goto(scenario.route);
        await page.waitForSelector(scenario.waitFor, { state: "visible" });
        await scenario.beforeAssert(page);

        await expect(page).toHaveScreenshot(`${profile.name}-${scenario.screenshotName}`, {
          fullPage: true,
          animations: "disabled",
          maxDiffPixelRatio: 0.01,
        });
      });
    }
  });
}
