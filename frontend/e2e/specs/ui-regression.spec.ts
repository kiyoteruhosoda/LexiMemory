const shouldRunVisualRegression = process.env.RUN_VISUAL_REGRESSION === "1";

import { test } from "@playwright/test";
import { uiRegressionProfiles, uiScenarios } from "../domains/uiRegressionProfile";
import { assertVisualSnapshot, prepareStableVisualSession } from "../domains/visualAssertion";

for (const profile of uiRegressionProfiles) {
  test.describe(`${profile.name} visual regression`, () => {
    test.skip(!shouldRunVisualRegression, "Visual regression is disabled by default.");

    for (const scenario of uiScenarios) {
      test(`${scenario.id} should match baseline`, async ({ page }) => {
        await page.setViewportSize(profile.viewport);
        await prepareStableVisualSession(page);

        await page.goto(scenario.route);
        await page.waitForSelector(scenario.waitFor, { state: "visible" });
        await scenario.prepare(page);

        await assertVisualSnapshot(page, {
          kind: "page",
          screenshotName: `${profile.name}-${scenario.screenshotName}`,
          maxDiffPixelRatio: scenario.maxDiffPixelRatio,
        });
      });
    }
  });
}
