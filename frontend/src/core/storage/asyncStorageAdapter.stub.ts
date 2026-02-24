import type { StorageAdapter } from "./types";

/**
 * Placeholder adapter for future React Native migration.
 * Implement this with AsyncStorage or SQLite in mobile app.
 */
class AsyncStorageAdapterStub implements StorageAdapter {
  async get(key: string): Promise<string | null> {
    void key;
    throw new Error("AsyncStorage adapter is not implemented yet");
  }

  async set(key: string, value: string): Promise<void> {
    void key;
    void value;
    throw new Error("AsyncStorage adapter is not implemented yet");
  }

  async remove(key: string): Promise<void> {
    void key;
    throw new Error("AsyncStorage adapter is not implemented yet");
  }

  async keys(): Promise<string[]> {
    throw new Error("AsyncStorage adapter is not implemented yet");
  }
}

export const asyncStorageAdapterStub = new AsyncStorageAdapterStub();
