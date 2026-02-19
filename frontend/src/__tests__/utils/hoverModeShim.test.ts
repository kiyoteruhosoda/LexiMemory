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

type MatchMediaMap = {
  anyHover: MatchMediaMock;
  primaryHover: MatchMediaMock;
};

function setupMatchMedia(map: MatchMediaMap): void {
  vi.spyOn(window, "matchMedia").mockImplementation((query: string) => {
    if (query.includes("any-hover")) {
      return map.anyHover as unknown as MediaQueryList;
    }

    return map.primaryHover as unknown as MediaQueryList;
  });
}

function createPointerEvent(pointerType: string): PointerEvent {
  const event = new Event("pointerdown") as PointerEvent;
  Object.defineProperty(event, "pointerType", { value: pointerType });
  return event;
}

describe("initializeHoverModeShim", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    document.documentElement.classList.remove("has-hover", "no-hover");
  });

  it("hover非対応デバイスでは no-hover を付与する", () => {
    setupMatchMedia({
      anyHover: new MatchMediaMock(false, "(any-hover: hover) and (any-pointer: fine)"),
      primaryHover: new MatchMediaMock(false, "(hover: hover) and (pointer: fine)"),
    });

    const dispose = initializeHoverModeShim();

    expect(document.documentElement.classList.contains("no-hover")).toBe(true);
    expect(document.documentElement.classList.contains("has-hover")).toBe(false);
    dispose();
  });

  it("ハイブリッド端末は any-hover を優先して初期状態を has-hover にする", () => {
    setupMatchMedia({
      anyHover: new MatchMediaMock(true, "(any-hover: hover) and (any-pointer: fine)"),
      primaryHover: new MatchMediaMock(false, "(hover: hover) and (pointer: fine)"),
    });

    const dispose = initializeHoverModeShim();

    expect(document.documentElement.classList.contains("has-hover")).toBe(true);
    expect(document.documentElement.classList.contains("no-hover")).toBe(false);
    dispose();
  });

  it("hover非対応端末では touch pointerdown で no-hover を維持し、mouse で has-hover に戻す", () => {
    setupMatchMedia({
      anyHover: new MatchMediaMock(false, "(any-hover: hover) and (any-pointer: fine)"),
      primaryHover: new MatchMediaMock(false, "(hover: hover) and (pointer: fine)"),
    });

    const dispose = initializeHoverModeShim();

    window.dispatchEvent(createPointerEvent("touch"));
    expect(document.documentElement.classList.contains("no-hover")).toBe(true);

    window.dispatchEvent(createPointerEvent("mouse"));
    expect(document.documentElement.classList.contains("has-hover")).toBe(true);
    dispose();
  });
});
