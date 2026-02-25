import type { SyncGateway } from "../../../../src/core/sync/syncGateway";
import type { MobileLearningRepositoryPort } from "../domain/mobileLearningRepository.types";

export function createMobileSyncGateway(repository: MobileLearningRepositoryPort): SyncGateway {
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
