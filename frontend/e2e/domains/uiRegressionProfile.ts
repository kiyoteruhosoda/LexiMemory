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
  readonly prepare: (page: Page) => Promise<void>;
  readonly maxDiffPixelRatio?: number;
}

const noopPrepare = async (page: Page): Promise<void> => {
  void page;
  return Promise.resolve();
};

function createUiScenario(input: Omit<UiScenario, "prepare"> & { prepare?: UiScenario["prepare"] }): UiScenario {
  return {
    ...input,
    prepare: input.prepare ?? noopPrepare,
  };
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
  createUiScenario({
    id: "word-list",
    route: "/words",
    waitFor: "[data-testid='word-list-page-ready']",
    screenshotName: "word-list.png",
    maxDiffPixelRatio: 0.02,
  }),
  createUiScenario({
    id: "word-create",
    route: "/words/create",
    waitFor: "[data-testid='word-create-page-ready']",
    screenshotName: "word-create.png",
  }),
  createUiScenario({
    id: "login",
    route: "/login",
    waitFor: "[data-testid='rnw-login-card']",
    screenshotName: "login.png",
  }),
  createUiScenario({
    id: "study",
    route: "/study",
    waitFor: "[data-testid='study-page-ready']",
    screenshotName: "study.png",
  }),
  createUiScenario({
    id: "examples",
    route: "/examples",
    waitFor: "[data-testid='examples-page-ready']",
    screenshotName: "examples.png",
  }),
];
