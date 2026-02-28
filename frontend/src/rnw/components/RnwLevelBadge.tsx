// frontend/src/rnw/components/RnwLevelBadge.tsx

import { RnwBadge } from "./RnwBadge";
import type { RnwButtonTone } from "../theme/tokens";

type MemoryLevel = 0 | 1 | 2 | 3 | 4;

type RnwLevelBadgeProps = {
  level: number;
};

function normalizeLevel(level: number): MemoryLevel {
  if (level <= 0) return 0;
  if (level === 1) return 1;
  if (level === 2) return 2;
  if (level === 3) return 3;
  return 4;
}

function levelToTone(level: MemoryLevel): RnwButtonTone {
  switch (level) {
    case 0:
      return "secondary";
    case 1:
      return "warning";
    case 2:
      return "primary";
    case 3:
    case 4:
      return "success";
  }
}

export function RnwLevelBadge({ level }: RnwLevelBadgeProps) {
  const normalized = normalizeLevel(level);
  const tone = levelToTone(normalized);

  return (
    <RnwBadge tone={tone} variant="level">
      Lv {normalized}
    </RnwBadge>
  );
}