import { storage } from "../storage";

export class TagFilterStorageService {
  private readonly prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  private get storageKey(): string {
    return `${this.prefix}_applied_tags`;
  }

  async restore(): Promise<string[] | undefined> {
    try {
      const raw = await storage.get(this.storageKey);
      if (!raw) return undefined;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : undefined;
    } catch (error) {
      console.error("Failed to restore tag filter:", error);
      return undefined;
    }
  }

  async save(tags: string[] | undefined): Promise<void> {
    try {
      if (tags && tags.length > 0) {
        await storage.set(this.storageKey, JSON.stringify(tags));
      } else {
        await storage.remove(this.storageKey);
      }
    } catch (error) {
      console.error("Failed to save tag filter:", error);
    }
  }
}
