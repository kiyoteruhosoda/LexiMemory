import { devices, type Page } from "@playwright/test";

export type UiRegressionProfile = {
  readonly name: string;
  readonly viewport: { width: number; height: number };
  readonly deviceScaleFactor: number;
};

export interface UiScenario {
  readonly id: string;
  readonly route: string;
  readonly waitFor: string;
  readonly screenshotName: string;
  beforeAssert(page: Page): Promise<void>;
}

class WordListScenario implements UiScenario {
  readonly id = "word-list";
  readonly route = "/words";
  readonly waitFor = "[data-testid='word-list-page-ready']";
  readonly screenshotName = "word-list.png";

  async beforeAssert(page: Page): Promise<void> {
    await page.addStyleTag({
      content: `
        *, *::before, *::after {
          transition: none !important;
          animation: none !important;
        }
      `,
    });
  }
}

const desktopChrome = devices["Desktop Chrome"];
const iphone13 = devices["iPhone 13"];

export const uiRegressionProfiles: readonly UiRegressionProfile[] = [
  {
    name: "desktop",
    viewport: desktopChrome.viewport!,
    deviceScaleFactor: desktopChrome.deviceScaleFactor,
  },
  {
    name: "mobile",
    viewport: iphone13.viewport!,
    deviceScaleFactor: iphone13.deviceScaleFactor,
  },
];

export const uiScenarios: readonly UiScenario[] = [new WordListScenario()];
