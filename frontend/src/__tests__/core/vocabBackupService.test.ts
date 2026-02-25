import { describe, expect, it } from "vitest";
import type { StorageAdapter } from "../../core/storage";
import { VocabBackupService, type ClockPort } from "../../core/sync/vocabBackupService";
import type { VocabFile } from "../../db/types";

class MemoryStorageAdapter implements StorageAdapter {
  private readonly table = new Map<string, string>();

  async get(key: string): Promise<string | null> {
    return this.table.get(key) ?? null;
  }

  async set(key: string, value: string): Promise<void> {
    this.table.set(key, value);
  }

  async remove(key: string): Promise<void> {
    this.table.delete(key);
  }

  async keys(): Promise<string[]> {
    return [...this.table.keys()];
  }
}

class SequenceClock implements ClockPort {
  private cursor = 0;
  private readonly values: readonly string[];

  constructor(values: readonly string[]) {
    this.values = values;
  }

  nowIso(): string {
    const next = this.values[this.cursor];
    this.cursor += 1;
    return next;
  }
}

function createDummyVocabFile(): VocabFile {
  return {
    schemaVersion: 1,
    words: [],
    memory: [],
    updatedAt: "2024-01-01T00:00:00.000Z",
  };
}

describe("VocabBackupService", () => {
  it("stores backup with timestamp-based key", async () => {
    const storage = new MemoryStorageAdapter();
    const clock = new SequenceClock(["2024-01-01T00:00:00.000Z"]);
    const service = new VocabBackupService(storage, clock, { maxBackups: 5 });

    await service.backup(createDummyVocabFile());

    await expect(storage.get("vocab_backup_2024-01-01T00:00:00.000Z")).resolves.not.toBeNull();
  });

  it("keeps only configured number of latest backups", async () => {
    const storage = new MemoryStorageAdapter();
    const clock = new SequenceClock([
      "2024-01-01T00:00:00.000Z",
      "2024-01-02T00:00:00.000Z",
      "2024-01-03T00:00:00.000Z",
      "2024-01-04T00:00:00.000Z",
    ]);
    const service = new VocabBackupService(storage, clock, { maxBackups: 2 });

    await service.backup(createDummyVocabFile());
    await service.backup(createDummyVocabFile());
    await service.backup(createDummyVocabFile());
    await service.backup(createDummyVocabFile());

    const keys = (await storage.keys()).sort();
    expect(keys).toEqual([
      "vocab_backup_2024-01-03T00:00:00.000Z",
      "vocab_backup_2024-01-04T00:00:00.000Z",
    ]);
  });
});
