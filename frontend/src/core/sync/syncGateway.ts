import type { ConflictResolution } from "../../db/types";
import type { SyncConflict, SyncResult, SyncStatus, SyncSuccess } from "../../db/syncService";

export interface SyncGateway {
  getSyncStatus(): Promise<SyncStatus>;
  syncToServer(): Promise<SyncResult>;
  resolveConflict(strategy: ConflictResolution): Promise<SyncSuccess>;
  initializeSyncFromServer(): Promise<void>;
}

export type { SyncConflict, SyncResult, SyncStatus, SyncSuccess };
