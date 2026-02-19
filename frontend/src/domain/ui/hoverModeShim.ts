const ANY_HOVER_QUERY = "(any-hover: hover) and (any-pointer: fine)";
const PRIMARY_HOVER_QUERY = "(hover: hover) and (pointer: fine)";
const TOUCH_POINTER_TYPES = new Set(["touch"]);
const HOVER_CAPABLE_POINTER_TYPES = new Set(["mouse", "pen"]);

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

function canEnvironmentHover(anyHoverList: MediaQueryList, primaryHoverList: MediaQueryList): boolean {
  return anyHoverList.matches || primaryHoverList.matches;
}

export function initializeHoverModeShim(): () => void {
  const hoverModeContext = new HoverModeContext();
  const anyHoverList = window.matchMedia(ANY_HOVER_QUERY);
  const primaryHoverList = window.matchMedia(PRIMARY_HOVER_QUERY);

  const syncByCapability = (): void => {
    hoverModeContext.switch(canEnvironmentHover(anyHoverList, primaryHoverList));
  };

  const syncByPointerEvent = (event: PointerEvent): void => {
    if (HOVER_CAPABLE_POINTER_TYPES.has(event.pointerType)) {
      hoverModeContext.switch(true);
      return;
    }

    if (TOUCH_POINTER_TYPES.has(event.pointerType) && !canEnvironmentHover(anyHoverList, primaryHoverList)) {
      hoverModeContext.switch(false);
    }
  };

  syncByCapability();

  anyHoverList.addEventListener("change", syncByCapability);
  primaryHoverList.addEventListener("change", syncByCapability);
  window.addEventListener("pointerdown", syncByPointerEvent, { passive: true });
  window.addEventListener("pointermove", syncByPointerEvent, { passive: true });

  return (): void => {
    anyHoverList.removeEventListener("change", syncByCapability);
    primaryHoverList.removeEventListener("change", syncByCapability);
    window.removeEventListener("pointerdown", syncByPointerEvent);
    window.removeEventListener("pointermove", syncByPointerEvent);
  };
}
