import { expect, test } from "@playwright/test";
import { assertVisualSnapshot, prepareStableVisualSession } from "../domains/visualAssertion";

const shouldRunVisualRegression = process.env.RUN_VISUAL_REGRESSION === "1";

test.describe("rnw component poc", () => {
  test.skip(!shouldRunVisualRegression, "Visual regression is disabled by default.");

  test("word list action row keeps visual baseline", async ({ page }) => {
    await prepareStableVisualSession(page);
    await page.goto("/words");

    const actionRow = page.getByTestId("rnw-word-list-action-row");
    await expect(actionRow).toBeVisible();

    await assertVisualSnapshot(page, {
      kind: "locator",
      locator: actionRow,
      screenshotName: "rnw-word-list-action-row.png",
    });
  });
});
