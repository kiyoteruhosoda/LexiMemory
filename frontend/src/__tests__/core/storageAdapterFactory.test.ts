import { describe, expect, it } from "vitest";
import {
  createAsyncStorageAdapter,
  createSqliteStorageAdapter,
  createStorageAdapter,
  type AsyncStorageDriver,
  type SqliteStorageDriver,
} from "../../core/storage";

class InMemoryAsyncStorageDriver implements AsyncStorageDriver {
  private readonly store = new Map<string, string>();

  async getItem(key: string): Promise<string | null> {
    return this.store.get(key) ?? null;
  }

  async setItem(key: string, value: string): Promise<void> {
    this.store.set(key, value);
  }

  async removeItem(key: string): Promise<void> {
    this.store.delete(key);
  }

  async getAllKeys(): Promise<string[]> {
    return [...this.store.keys()];
  }
}

class InMemorySqliteStorageDriver implements SqliteStorageDriver {
  private readonly store = new Map<string, string>();

  async read(key: string): Promise<string | null> {
    return this.store.get(key) ?? null;
  }

  async write(key: string, value: string): Promise<void> {
    this.store.set(key, value);
  }

  async deleteByKey(key: string): Promise<void> {
    this.store.delete(key);
  }

  async listKeys(): Promise<string[]> {
    return [...this.store.keys()];
  }
}

describe("createStorageAdapter", () => {
  it("returns web adapter for web runtime", async () => {
    const adapter = createStorageAdapter("web");

    await adapter.set("factory_web_key", "factory_web_value");
    await expect(adapter.get("factory_web_key")).resolves.toBe("factory_web_value");
    await adapter.remove("factory_web_key");
  });

  it("returns unimplemented adapter for native runtime when no driver exists", async () => {
    const adapter = createStorageAdapter("native");

    await expect(adapter.get("any-key")).rejects.toThrow(
      "Storage adapter is not implemented on this platform yet",
    );
  });

  it("creates async adapter for native runtime with async driver", async () => {
    const adapter = createStorageAdapter("native", {
      asyncStorageDriver: new InMemoryAsyncStorageDriver(),
    });

    await adapter.set("native_async_key", "native_async_value");
    await expect(adapter.get("native_async_key")).resolves.toBe("native_async_value");
    await expect(adapter.keys()).resolves.toContain("native_async_key");
  });

  it("creates sqlite adapter for native runtime with sqlite driver", async () => {
    const adapter = createStorageAdapter("native", {
      sqliteStorageDriver: new InMemorySqliteStorageDriver(),
    });

    await adapter.set("native_sqlite_key", "native_sqlite_value");
    await expect(adapter.get("native_sqlite_key")).resolves.toBe("native_sqlite_value");
    await expect(adapter.keys()).resolves.toContain("native_sqlite_key");
  });
});

describe("storage adapter creators", () => {
  it("creates async adapter directly", async () => {
    const adapter = createAsyncStorageAdapter(new InMemoryAsyncStorageDriver());

    await adapter.set("async_direct", "ok");
    await expect(adapter.get("async_direct")).resolves.toBe("ok");
  });

  it("creates sqlite adapter directly", async () => {
    const adapter = createSqliteStorageAdapter(new InMemorySqliteStorageDriver());

    await adapter.set("sqlite_direct", "ok");
    await expect(adapter.get("sqlite_direct")).resolves.toBe("ok");
  });
});
