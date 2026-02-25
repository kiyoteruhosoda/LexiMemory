import type { ConflictResolution } from "../../db/types";
import type { SyncGateway, SyncResult, SyncStatus, SyncSuccess } from "./syncGateway";

export class SyncApplicationService {
  private readonly syncGateway: SyncGateway;

  constructor(syncGateway: SyncGateway) {
    this.syncGateway = syncGateway;
  }

  async getStatus(): Promise<SyncStatus> {
    return this.syncGateway.getSyncStatus();
  }

  async sync(): Promise<SyncResult> {
    return this.syncGateway.syncToServer();
  }

  async resolve(strategy: ConflictResolution): Promise<SyncSuccess> {
    return this.syncGateway.resolveConflict(strategy);
  }

  async initializeFromServer(): Promise<void> {
    return this.syncGateway.initializeSyncFromServer();
  }
}
