import type { SyncGateway } from "../../../../src/core/sync/syncGateway";
import { MobileLearningRepository } from "../domain/mobileLearningRepository";

export function createMobileSyncGateway(repository: MobileLearningRepository): SyncGateway {
  return {
    async getSyncStatus() {
      return repository.getSyncStatus();
    },
    async syncToServer() {
      return repository.sync();
    },
    async resolveConflict(strategy) {
      return repository.resolveConflict(strategy);
    },
    async initializeSyncFromServer() {
      return;
    },
  };
}
