const HOVER_MEDIA_QUERY = "(hover: hover) and (pointer: fine)";
const TOUCH_POINTER_TYPES = new Set(["touch", "pen"]);

interface HoverModeStrategy {
  apply(): void;
}

class HoverCapableStrategy implements HoverModeStrategy {
  apply(): void {
    const root = document.documentElement;
    root.classList.add("has-hover");
    root.classList.remove("no-hover");
  }
}

class TouchOnlyStrategy implements HoverModeStrategy {
  apply(): void {
    const root = document.documentElement;
    root.classList.add("no-hover");
    root.classList.remove("has-hover");
  }
}

class HoverModeContext {
  private readonly hoverCapableStrategy: HoverModeStrategy = new HoverCapableStrategy();
  private readonly touchOnlyStrategy: HoverModeStrategy = new TouchOnlyStrategy();

  private resolveStrategy(canHover: boolean): HoverModeStrategy {
    return canHover ? this.hoverCapableStrategy : this.touchOnlyStrategy;
  }

  switch(canHover: boolean): void {
    this.resolveStrategy(canHover).apply();
  }
}

export function initializeHoverModeShim(): () => void {
  const hoverModeContext = new HoverModeContext();
  const mediaQueryList = window.matchMedia(HOVER_MEDIA_QUERY);

  const syncByMediaQuery = (queryList: MediaQueryList | MediaQueryListEvent): void => {
    hoverModeContext.switch(queryList.matches);
  };

  const syncByPointerEvent = (event: PointerEvent): void => {
    const canHover = !TOUCH_POINTER_TYPES.has(event.pointerType);
    hoverModeContext.switch(canHover);
  };

  syncByMediaQuery(mediaQueryList);

  mediaQueryList.addEventListener("change", syncByMediaQuery);
  window.addEventListener("pointerdown", syncByPointerEvent, { passive: true });

  return (): void => {
    mediaQueryList.removeEventListener("change", syncByMediaQuery);
    window.removeEventListener("pointerdown", syncByPointerEvent);
  };
}
