import { describe, expect, it, vi, afterEach } from "vitest";
import { generateUuid } from "../../core/identity/uuid";

describe("uuid generator", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("uses crypto.randomUUID when available", () => {
    const randomUUID = vi.fn(() => "uuid-from-randomUUID");
    vi.stubGlobal("crypto", { randomUUID, getRandomValues: vi.fn() });

    expect(generateUuid()).toBe("uuid-from-randomUUID");
    expect(randomUUID).toHaveBeenCalledTimes(1);
  });

  it("falls back to getRandomValues when randomUUID is unavailable", () => {
    const getRandomValues = vi.fn((input: Uint8Array) => {
      for (let i = 0; i < input.length; i += 1) {
        input[i] = i + 1;
      }
      return input;
    });
    vi.stubGlobal("crypto", { getRandomValues });

    const generated = generateUuid();

    expect(getRandomValues).toHaveBeenCalledTimes(1);
    expect(generated).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });
});
