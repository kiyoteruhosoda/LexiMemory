import { devices, type Page } from "@playwright/test";

export type UiRegressionProfile = {
  readonly name: string;
  readonly viewport: { width: number; height: number };
};

export interface UiScenario {
  readonly id: string;
  readonly route: string;
  readonly waitFor: string;
  readonly screenshotName: string;
  beforeAssert(page: Page): Promise<void>;
}

abstract class BaseScenario implements UiScenario {
  abstract readonly id: string;
  abstract readonly route: string;
  abstract readonly waitFor: string;
  abstract readonly screenshotName: string;

  async beforeAssert(page: Page): Promise<void> {
    await page.addInitScript(() => {
      Date.now = () => new Date("2024-01-01T00:00:00.000Z").getTime();
      Math.random = () => 0.42;
    });

    await page.addStyleTag({
      content: `
        *, *::before, *::after {
          transition: none !important;
          animation: none !important;
          caret-color: transparent !important;
        }
      `,
    });
  }
}

class WordListScenario extends BaseScenario {
  readonly id = "word-list";
  readonly route = "/words";
  readonly waitFor = "[data-testid='word-list-page-ready']";
  readonly screenshotName = "word-list.png";
}


class WordCreateScenario extends BaseScenario {
  readonly id = "word-create";
  readonly route = "/words/create";
  readonly waitFor = "[data-testid='word-create-page-ready']";
  readonly screenshotName = "word-create.png";
}

class StudyScenario extends BaseScenario {
  readonly id = "study";
  readonly route = "/study";
  readonly waitFor = "[data-testid='study-page-ready']";
  readonly screenshotName = "study.png";
}

class ExamplesScenario extends BaseScenario {
  readonly id = "examples";
  readonly route = "/examples";
  readonly waitFor = "[data-testid='examples-page-ready']";
  readonly screenshotName = "examples.png";
}

class LoginScenario extends BaseScenario {
  readonly id = "login";
  readonly route = "/login";
  readonly waitFor = "[data-testid='rnw-login-card']";
  readonly screenshotName = "login.png";
}

const desktopChrome = devices["Desktop Chrome"];
const iphone13 = devices["iPhone 13"];

export const uiRegressionProfiles: readonly UiRegressionProfile[] = [
  {
    name: "desktop",
    viewport: desktopChrome.viewport!,
  },
  {
    name: "mobile",
    viewport: iphone13.viewport!,
  },
];

export const uiScenarios: readonly UiScenario[] = [
  new WordListScenario(),
  new WordCreateScenario(),
  new LoginScenario(),
  new StudyScenario(),
  new ExamplesScenario(),
];
