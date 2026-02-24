import type { StorageAdapter } from "./types";

class WebStorageAdapter implements StorageAdapter {
  async get(key: string): Promise<string | null> {
    return window.localStorage.getItem(key);
  }

  async set(key: string, value: string): Promise<void> {
    window.localStorage.setItem(key, value);
  }

  async remove(key: string): Promise<void> {
    window.localStorage.removeItem(key);
  }

  async keys(): Promise<string[]> {
    return Object.keys(window.localStorage);
  }
}

export const webStorageAdapter = new WebStorageAdapter();
