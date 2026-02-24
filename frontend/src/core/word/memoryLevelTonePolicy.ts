export type MemoryLevelTone = "neutral" | "warning" | "primary" | "success";

export function resolveMemoryLevelTone(memoryLevel: number): MemoryLevelTone {
  if (memoryLevel >= 4) {
    return "success";
  }
  if (memoryLevel >= 2) {
    return "primary";
  }
  if (memoryLevel >= 1) {
    return "warning";
  }
  return "neutral";
}
