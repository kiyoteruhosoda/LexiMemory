import type { Page } from "@playwright/test";

const fixedNow = new Date("2024-01-01T00:00:00.000Z").getTime();

const deterministicUiStyle = `
  *, *::before, *::after {
    animation: none !important;
    transition: none !important;
    caret-color: transparent !important;
  }
`;

export async function stabilizeUiSession(page: Page): Promise<void> {
  await page.addInitScript(({ now }) => {
    Date.now = () => now;
    Math.random = () => 0.42;
  }, { now: fixedNow });
}

export async function disableAnimations(page: Page): Promise<void> {
  await page.addStyleTag({
    content: deterministicUiStyle,
  });
}
