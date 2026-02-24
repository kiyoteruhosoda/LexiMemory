import { expect, test } from "@playwright/test";

test("guest user can access login and words pages", async ({ page }) => {
  await page.addInitScript(() => {
    Date.now = () => new Date("2024-01-01T00:00:00.000Z").getTime();
    Math.random = () => 0.42;
  });

  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Login" })).toBeVisible();

  await page.goto("/words");
  await expect(page.getByTestId("word-list-page-ready")).toBeVisible();
  await expect(page.getByTestId("rnw-add-button")).toBeVisible();
});
