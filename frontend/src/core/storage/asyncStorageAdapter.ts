import type { StorageAdapter } from "./types";

export interface AsyncStorageDriver {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  getAllKeys(): Promise<string[]>;
}

export function createAsyncStorageAdapter(driver: AsyncStorageDriver): StorageAdapter {
  return {
    async get(key: string): Promise<string | null> {
      return driver.getItem(key);
    },
    async set(key: string, value: string): Promise<void> {
      await driver.setItem(key, value);
    },
    async remove(key: string): Promise<void> {
      await driver.removeItem(key);
    },
    async keys(): Promise<string[]> {
      return driver.getAllKeys();
    },
  };
}
