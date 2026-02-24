import type { StorageAdapter } from "../storage";
import { storage as defaultStorage } from "../storage";

export class TagFilterStorageService {
  private readonly prefix: string;
  private readonly storage: StorageAdapter;

  constructor(prefix: string, storage: StorageAdapter = defaultStorage) {
    this.prefix = prefix;
    this.storage = storage;
  }

  private get storageKey(): string {
    return `${this.prefix}_applied_tags`;
  }

  async restore(): Promise<string[] | undefined> {
    try {
      const raw = await this.storage.get(this.storageKey);
      if (!raw) return undefined;
      const parsed: unknown = JSON.parse(raw);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed.filter((tag): tag is string => typeof tag === "string") : undefined;
    } catch (error) {
      console.error("Failed to restore tag filter:", error);
      return undefined;
    }
  }

  async save(tags: string[] | undefined): Promise<void> {
    try {
      if (tags && tags.length > 0) {
        await this.storage.set(this.storageKey, JSON.stringify(tags));
      } else {
        await this.storage.remove(this.storageKey);
      }
    } catch (error) {
      console.error("Failed to save tag filter:", error);
    }
  }
}
