import { describe, it, expect, beforeEach, vi } from "vitest";
import { TagFilterStorageService } from "../../core/tagFilter/tagFilterStorageService";
import type { StorageAdapter } from "../../core/storage";

describe("TagFilterStorageService", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it("saves and restores tags", async () => {
    const service = new TagFilterStorageService("study");
    await service.save(["tag-a", "tag-b"]);

    await expect(service.restore()).resolves.toEqual(["tag-a", "tag-b"]);
  });

  it("removes key when tags are undefined", async () => {
    const service = new TagFilterStorageService("examples");
    window.localStorage.setItem("examples_applied_tags", JSON.stringify(["x"]));

    await service.save(undefined);

    expect(window.localStorage.getItem("examples_applied_tags")).toBeNull();
  });

  it("supports polymorphic storage adapters", async () => {
    const memory = new Map<string, string>();
    const adapter: StorageAdapter = {
      async get(key) {
        return memory.get(key) ?? null;
      },
      async set(key, value) {
        memory.set(key, value);
      },
      async remove(key) {
        memory.delete(key);
      },
      async keys() {
        return [...memory.keys()];
      },
    };

    const service = new TagFilterStorageService("mobile", adapter);
    await service.save(["offline", "sync"]);

    await expect(service.restore()).resolves.toEqual(["offline", "sync"]);
  });
});
