import {
  getSyncStatus,
  syncToServer,
  resolveConflict,
  initializeSyncFromServer,
} from "../db/syncService";
import { SyncApplicationService } from "../core/sync/syncApplicationService";
import type { SyncGateway } from "../core/sync/syncGateway";
import type { ConflictResolution } from "../db/types";

const syncGatewayAdapter: SyncGateway = {
  async getSyncStatus() {
    return getSyncStatus();
  },
  async syncToServer() {
    return syncToServer();
  },
  async resolveConflict(strategy: ConflictResolution) {
    return resolveConflict(strategy);
  },
  async initializeSyncFromServer() {
    return initializeSyncFromServer();
  },
};

const syncApplicationService = new SyncApplicationService(syncGatewayAdapter);

export const syncUseCase = {
  getStatus: () => syncApplicationService.getStatus(),
  sync: () => syncApplicationService.sync(),
  resolve: (strategy: ConflictResolution) => syncApplicationService.resolve(strategy),
  initializeFromServer: () => syncApplicationService.initializeFromServer(),
};
