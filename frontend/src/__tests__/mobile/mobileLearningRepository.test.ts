import { describe, expect, it } from "vitest";
import { MobileLearningRepository, PersistedMobileLearningRepository } from "../../../apps/mobile/src/domain/mobileLearningRepository";
import type { StorageAdapter } from "../../core/storage";

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

describe("PersistedMobileLearningRepository", () => {
  it("persists created words and restores state on next initialization", async () => {
    const storage = new InMemoryStorageAdapter();
    const firstRepo = await PersistedMobileLearningRepository.create(storage);

    const created = firstRepo.createWord({
      headword: "resilient",
      pronunciation: "rɪˈzɪliənt",
      pos: "adj",
      meaningJa: "回復力のある",
      examples: [],
      tags: ["mobile"],
      memo: null,
    });

    await Promise.resolve();

    const restoredRepo = await PersistedMobileLearningRepository.create(storage);
    const restored = restoredRepo.getWord(created.id);

    expect(restored?.headword).toBe("resilient");
    expect(restoredRepo.listWords({ q: "resilient" }).total).toBe(1);
  });

  it("keeps deterministic seed state for in-memory repository", () => {
    const repo = new MobileLearningRepository();

    const listed = repo.listWords({});

    expect(listed.total).toBeGreaterThanOrEqual(2);
    expect(Object.keys(listed.memoryMap)).toHaveLength(listed.total);
  });
});
