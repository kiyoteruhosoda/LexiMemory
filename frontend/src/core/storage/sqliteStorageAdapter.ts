import type { StorageAdapter } from "./types";

export interface SqliteStorageDriver {
  read(key: string): Promise<string | null>;
  write(key: string, value: string): Promise<void>;
  deleteByKey(key: string): Promise<void>;
  listKeys(): Promise<string[]>;
}

export function createSqliteStorageAdapter(driver: SqliteStorageDriver): StorageAdapter {
  return {
    async get(key: string): Promise<string | null> {
      return driver.read(key);
    },
    async set(key: string, value: string): Promise<void> {
      await driver.write(key, value);
    },
    async remove(key: string): Promise<void> {
      await driver.deleteByKey(key);
    },
    async keys(): Promise<string[]> {
      return driver.listKeys();
    },
  };
}
