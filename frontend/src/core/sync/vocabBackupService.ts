import type { StorageAdapter } from "../storage";
import type { VocabFile } from "../../db/types";

export interface ClockPort {
  nowIso(): string;
}

export class SystemUtcClock implements ClockPort {
  nowIso(): string {
    return new Date().toISOString();
  }
}

export type VocabBackupServiceOptions = {
  readonly keyPrefix?: string;
  readonly maxBackups?: number;
};

const DEFAULT_BACKUP_PREFIX = "vocab_backup_";
const DEFAULT_MAX_BACKUPS = 5;

export class VocabBackupService {
  private readonly storage: StorageAdapter;
  private readonly clock: ClockPort;
  private readonly keyPrefix: string;
  private readonly maxBackups: number;

  constructor(storage: StorageAdapter, clock: ClockPort, options: VocabBackupServiceOptions = {}) {
    this.storage = storage;
    this.clock = clock;
    this.keyPrefix = options.keyPrefix ?? DEFAULT_BACKUP_PREFIX;
    this.maxBackups = options.maxBackups ?? DEFAULT_MAX_BACKUPS;
  }

  async backup(file: VocabFile): Promise<void> {
    const backupKey = `${this.keyPrefix}${this.clock.nowIso()}`;
    await this.storage.set(backupKey, JSON.stringify(file));
    await this.pruneOldBackups();
  }

  private async pruneOldBackups(): Promise<void> {
    const backupKeys = (await this.storage.keys())
      .filter((key) => key.startsWith(this.keyPrefix))
      .sort();

    const overflowCount = backupKeys.length - this.maxBackups;
    if (overflowCount <= 0) {
      return;
    }

    for (const key of backupKeys.slice(0, overflowCount)) {
      await this.storage.remove(key);
    }
  }
}
