import { describe, expect, it } from "vitest";
import { createUnimplementedStoragePort } from "./storageCapability";

describe("createUnimplementedStoragePort", () => {
  it("throws deterministic message for all operations", async () => {
    const adapter = createUnimplementedStoragePort();

    await expect(adapter.get("k")).rejects.toThrow("Storage adapter is not implemented");
    await expect(adapter.set("k", "v")).rejects.toThrow("Storage adapter is not implemented");
    await expect(adapter.remove("k")).rejects.toThrow("Storage adapter is not implemented");
    await expect(adapter.keys()).rejects.toThrow("Storage adapter is not implemented");
  });
});
