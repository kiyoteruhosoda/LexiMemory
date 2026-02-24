import type { Page } from "@playwright/test";

export async function stabilizeUiSession(page: Page): Promise<void> {
  await page.addInitScript(() => {
    Date.now = () => new Date("2024-01-01T00:00:00.000Z").getTime();
    Math.random = () => 0.42;
  });
}

export async function disableAnimations(page: Page): Promise<void> {
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation: none !important;
        transition: none !important;
        caret-color: transparent !important;
      }
    `,
  });
}
