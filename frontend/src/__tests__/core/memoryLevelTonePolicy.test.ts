import { describe, expect, it } from "vitest";
import { resolveMemoryLevelTone } from "../../core/word/memoryLevelTonePolicy";

describe("resolveMemoryLevelTone", () => {
  it("maps levels to tone deterministically", () => {
    expect(resolveMemoryLevelTone(0)).toBe("neutral");
    expect(resolveMemoryLevelTone(1)).toBe("warning");
    expect(resolveMemoryLevelTone(2)).toBe("primary");
    expect(resolveMemoryLevelTone(4)).toBe("success");
  });
});
