import { describe, expect, it, vi } from "vitest";
import type { StorageAdapter } from "../../core/storage";
import { prepareVersionedStorage } from "../../core/storage";

class InMemoryStorageAdapter implements StorageAdapter {
  private readonly store = new Map<string, string>();

  async get(key: string): Promise<string | null> {
    return this.store.get(key) ?? null;
  }

  async set(key: string, value: string): Promise<void> {
    this.store.set(key, value);
  }

  async remove(key: string): Promise<void> {
    this.store.delete(key);
  }

  async keys(): Promise<string[]> {
    return [...this.store.keys()];
  }
}

class FailingStorageAdapter extends InMemoryStorageAdapter {
  async get(key: string): Promise<string | null> {
    if (key === "storage.schema.version") {
      throw new Error("primary failed");
    }
    return super.get(key);
  }
}

describe("prepareVersionedStorage", () => {
  it("runs version migration on primary adapter", async () => {
    const primary = new InMemoryStorageAdapter();
    await primary.set("storage.schema.version", JSON.stringify({ version: 1, updatedAt: "2026-01-01T00:00:00.000Z" }));

    const migrate = vi.fn(async (adapter: StorageAdapter) => {
      await adapter.set("migrated.flag", "true");
    });

    const result = await prepareVersionedStorage({
      primary,
      dataKeys: ["migrated.flag"],
      targetVersion: 2,
      migrate,
    });

    expect(result.usedFallback).toBe(false);
    expect(result.migrated).toBe(true);
    expect(result.version).toBe(2);
    await expect(primary.get("migrated.flag")).resolves.toBe("true");
    expect(migrate).toHaveBeenCalledWith(primary, 1, 2);
  });

  it("restores primary data from fallback when primary metadata is missing", async () => {
    const primary = new InMemoryStorageAdapter();
    const fallback = new InMemoryStorageAdapter();

    await fallback.set("storage.schema.version", JSON.stringify({ version: 1, updatedAt: "2026-01-01T00:00:00.000Z" }));
    await fallback.set("tag-filter", "all");

    const result = await prepareVersionedStorage({
      primary,
      fallback,
      dataKeys: ["tag-filter"],
      targetVersion: 1,
    });

    expect(result.usedFallback).toBe(false);
    expect(result.version).toBe(1);
    await expect(primary.get("tag-filter")).resolves.toBe("all");
  });

  it("falls back to secondary adapter when primary is unavailable", async () => {
    const primary = new FailingStorageAdapter();
    const fallback = new InMemoryStorageAdapter();

    await fallback.set("storage.schema.version", JSON.stringify({ version: 1, updatedAt: "2026-01-01T00:00:00.000Z" }));

    const migrate = vi.fn(async () => Promise.resolve());

    const result = await prepareVersionedStorage({
      primary,
      fallback,
      dataKeys: [],
      targetVersion: 2,
      migrate,
    });

    expect(result.usedFallback).toBe(true);
    expect(result.migrated).toBe(true);
    expect(result.version).toBe(2);
    expect(migrate).toHaveBeenCalledWith(fallback, 1, 2);
  });
});
