import { RnwBadge } from "./RnwBadge";

export function RnwPlatformBadge() {
  return (
    <span data-testid="rnw-platform-badge">
      <RnwBadge tone="primary" variant="pill">
        RNW PoC
      </RnwBadge>
    </span>
  );
}
