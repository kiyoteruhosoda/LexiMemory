import { afterEach, describe, expect, it, vi } from "vitest";

import { initializeHoverModeShim } from "../../domain/ui/hoverModeShim";

type MatchMediaListener = (event: MediaQueryListEvent) => void;

class MatchMediaMock {
  private listeners: MatchMediaListener[] = [];
  matches: boolean;
  media: string;

  constructor(matches: boolean, media: string) {
    this.matches = matches;
    this.media = media;
  }

  addEventListener = vi.fn((eventName: string, listener: MatchMediaListener): void => {
    if (eventName === "change") {
      this.listeners.push(listener);
    }
  });

  removeEventListener = vi.fn((eventName: string, listener: MatchMediaListener): void => {
    if (eventName === "change") {
      this.listeners = this.listeners.filter((registered) => registered !== listener);
    }
  });

  emitChange(nextMatches: boolean): void {
    this.matches = nextMatches;
    const event = { matches: nextMatches, media: this.media } as MediaQueryListEvent;
    this.listeners.forEach((listener) => listener(event));
  }
}

describe("initializeHoverModeShim", () => {
  afterEach(() => {
    document.documentElement.classList.remove("has-hover", "no-hover");
  });

  it("hover非対応デバイスでは no-hover を付与する", () => {
    const mql = new MatchMediaMock(false, "(hover: hover) and (pointer: fine)");
    vi.spyOn(window, "matchMedia").mockReturnValue(mql as unknown as MediaQueryList);

    const dispose = initializeHoverModeShim();

    expect(document.documentElement.classList.contains("no-hover")).toBe(true);
    expect(document.documentElement.classList.contains("has-hover")).toBe(false);
    dispose();
  });

  it("pointerdown の種類で hover モードを切り替える", () => {
    const mql = new MatchMediaMock(true, "(hover: hover) and (pointer: fine)");
    vi.spyOn(window, "matchMedia").mockReturnValue(mql as unknown as MediaQueryList);

    const dispose = initializeHoverModeShim();

    const touchEvent = new Event("pointerdown") as PointerEvent;
    Object.defineProperty(touchEvent, "pointerType", { value: "touch" });
    window.dispatchEvent(touchEvent);
    expect(document.documentElement.classList.contains("no-hover")).toBe(true);

    const mouseEvent = new Event("pointerdown") as PointerEvent;
    Object.defineProperty(mouseEvent, "pointerType", { value: "mouse" });
    window.dispatchEvent(mouseEvent);
    expect(document.documentElement.classList.contains("has-hover")).toBe(true);
    dispose();
  });
});
