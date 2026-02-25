const shouldRunVisualRegression = process.env.RUN_VISUAL_REGRESSION === "1";

import { test, expect } from "@playwright/test";
import { uiRegressionProfiles, uiScenarios } from "../domains/uiRegressionProfile";
import { disableAnimations, stabilizeUiSession } from "../domains/stabilizeSession";

for (const profile of uiRegressionProfiles) {
  test.describe(`${profile.name} visual regression`, () => {
    test.skip(!shouldRunVisualRegression, "Visual regression is disabled by default.");
    for (const scenario of uiScenarios) {
      test(`${scenario.id} should match baseline`, async ({ page }) => {
        await page.setViewportSize(profile.viewport);
        await stabilizeUiSession(page);

        await page.goto(scenario.route);
        await disableAnimations(page);
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
