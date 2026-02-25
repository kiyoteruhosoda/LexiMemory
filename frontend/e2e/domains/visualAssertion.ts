import { expect, type Locator, type Page } from "@playwright/test";
import { disableAnimations, stabilizeUiSession } from "./stabilizeSession";

export type PageSnapshotInput = {
  readonly kind: "page";
  readonly screenshotName: string;
  readonly maxDiffPixelRatio?: number;
};

export type LocatorSnapshotInput = {
  readonly kind: "locator";
  readonly screenshotName: string;
  readonly locator: Locator;
  readonly maxDiffPixelRatio?: number;
};

export type VisualSnapshotInput = PageSnapshotInput | LocatorSnapshotInput;

export async function prepareStableVisualSession(page: Page): Promise<void> {
  await stabilizeUiSession(page);
  await disableAnimations(page);
}

export async function assertVisualSnapshot(page: Page, input: VisualSnapshotInput): Promise<void> {
  const maxDiffPixelRatio = input.maxDiffPixelRatio ?? 0.01;

  if (input.kind === "page") {
    await expect(page).toHaveScreenshot(input.screenshotName, {
      fullPage: true,
      animations: "disabled",
      maxDiffPixelRatio,
    });
    return;
  }

  await expect(input.locator).toHaveScreenshot(input.screenshotName, {
    animations: "disabled",
    maxDiffPixelRatio,
  });
}
