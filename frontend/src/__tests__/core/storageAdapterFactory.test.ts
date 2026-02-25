import { describe, expect, it } from "vitest";
import { createStorageAdapter } from "../../core/storage";

describe("createStorageAdapter", () => {
  it("returns web adapter for web runtime", async () => {
    const adapter = createStorageAdapter("web");

    await adapter.set("factory_web_key", "factory_web_value");
    await expect(adapter.get("factory_web_key")).resolves.toBe("factory_web_value");
    await adapter.remove("factory_web_key");
  });

  it("returns native stub adapter for native runtime", async () => {
    const adapter = createStorageAdapter("native");

    await expect(adapter.get("any-key")).rejects.toThrow(
      "Storage adapter is not implemented on this platform yet",
    );
  });
});
