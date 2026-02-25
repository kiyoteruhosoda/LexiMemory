import { expect, test } from "@playwright/test";
import { disableAnimations, stabilizeUiSession } from "../domains/stabilizeSession";

test("guest user can access login and words pages", async ({ page }) => {
  await stabilizeUiSession(page);

  await page.goto("/login");
  await disableAnimations(page);
  await expect(page.getByTestId("rnw-login-card")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Login" })).toBeVisible();

  await page.goto("/words");
  await expect(page.getByTestId("word-list-page-ready")).toBeVisible();
  await expect(page.getByTestId("rnw-add-button")).toBeVisible();

  await page.goto("/words/create");
  await expect(page.getByTestId("word-create-page-ready")).toBeVisible();
  await expect(page.getByTestId("rnw-word-create-header")).toBeVisible();

  await page.goto("/study");
  await expect(page.getByTestId("study-page-ready")).toBeVisible();

  await page.goto("/examples");
  await expect(page.getByTestId("examples-page-ready")).toBeVisible();
});

test("guest user can navigate core routes via rnw action row", async ({ page }) => {
  await stabilizeUiSession(page);
  await page.goto("/words");

  await expect(page.getByTestId("rnw-word-list-action-row")).toBeVisible();

  await page.getByTestId("rnw-study-button").click();
  await expect(page).toHaveURL(/\/study$/);

  await page.goto("/words");
  await page.getByTestId("rnw-examples-button").click();
  await expect(page).toHaveURL(/\/examples$/);

  await page.goto("/words");
  await page.getByTestId("rnw-add-button").click();
  await expect(page).toHaveURL(/\/words\/create$/);
});
