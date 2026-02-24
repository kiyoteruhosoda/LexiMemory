import { expect, test } from "@playwright/test";
import { disableAnimations, stabilizeUiSession } from "../domains/stabilizeSession";

test("guest user can access login and words pages", async ({ page }) => {
  await stabilizeUiSession(page);

  await page.goto("/login");
  await disableAnimations(page);
  await expect(page.getByRole("heading", { name: "Login" })).toBeVisible();

  await page.goto("/words");
  await expect(page.getByTestId("word-list-page-ready")).toBeVisible();
  await expect(page.getByTestId("rnw-add-button")).toBeVisible();
});
