import type { SyncGateway, SyncResult, SyncStatus, SyncSuccess } from "../../../../src/core/sync/syncGateway";
import type { ConflictResolution, VocabServerData, VocabSyncRequest, VocabSyncResponse } from "../../../../src/db/types";
import type { MobileLearningRepositoryPort } from "../domain/mobileLearningRepository.types";

interface MobileSyncApiClient {
  getServerVocab(): Promise<VocabServerData>;
  putVocab(request: VocabSyncRequest): Promise<VocabSyncResponse>;
  forcePutVocab(clientId: string, file: VocabSyncRequest["file"]): Promise<VocabSyncResponse>;
}

interface MobileSyncGatewayOptions {
  apiBaseUrl?: string;
  accessToken?: string;
  clientId?: string;
}


function createSyncApiClient(apiBaseUrl: string, accessToken: string): MobileSyncApiClient {
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`,
  };

  return {
    async getServerVocab(): Promise<VocabServerData> {
      const response = await fetch(`${apiBaseUrl}/api/vocab`, {
        method: "GET",
        headers,
      });

      if (!response.ok) {
        throw new Error(`GET /api/vocab failed: ${response.status}`);
      }

      return response.json() as Promise<VocabServerData>;
    },

    async putVocab(request: VocabSyncRequest): Promise<VocabSyncResponse> {
      const response = await fetch(`${apiBaseUrl}/api/vocab`, {
        method: "PUT",
        headers,
        body: JSON.stringify(request),
      });

      if (response.status === 409) {
        throw new Error("SYNC_CONFLICT_409");
      }

      if (!response.ok) {
        throw new Error(`PUT /api/vocab failed: ${response.status}`);
      }

      return response.json() as Promise<VocabSyncResponse>;
    },

    async forcePutVocab(clientId: string, file: VocabSyncRequest["file"]): Promise<VocabSyncResponse> {
      const response = await fetch(`${apiBaseUrl}/api/vocab?force=true`, {
        method: "PUT",
        headers,
        body: JSON.stringify({
          clientId,
          file,
        }),
      });

      if (!response.ok) {
        throw new Error(`PUT /api/vocab?force=true failed: ${response.status}`);
      }

      return response.json() as Promise<VocabSyncResponse>;
    },
  };
}

function isConflict(error: unknown): boolean {
  return error instanceof Error && error.message === "SYNC_CONFLICT_409";
}

function createLocalOnlySyncGateway(repository: MobileLearningRepositoryPort): SyncGateway {
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

export function createMobileSyncGateway(
  repository: MobileLearningRepositoryPort,
  options: MobileSyncGatewayOptions = {},
): SyncGateway {
  if (!options.apiBaseUrl || !options.accessToken) {
    return createLocalOnlySyncGateway(repository);
  }

  const client = createSyncApiClient(options.apiBaseUrl, options.accessToken);
  const clientId = options.clientId ?? "mobile-local-client";

  return {
    async getSyncStatus(): Promise<SyncStatus> {
      return repository.getSyncStatus();
    },

    async syncToServer(): Promise<SyncResult> {
      const status = repository.getSyncStatus();
      const request: VocabSyncRequest = {
        serverRev: status.serverRev,
        clientId,
        file: repository.exportVocabFile(),
      };

      try {
        const response = await client.putVocab(request);
        repository.markSynced(response.serverRev, response.updatedAt);
        return {
          status: "success",
          serverRev: response.serverRev,
          updatedAt: response.updatedAt,
        };
      } catch (error) {
        if (isConflict(error)) {
          const serverData = await client.getServerVocab();
          return {
            status: "conflict",
            localFile: request.file,
            serverData,
          };
        }

        return {
          status: "error",
          code: "SYNC_ERROR",
          message: error instanceof Error ? error.message : "Mobile sync failed",
        };
      }
    },

    async resolveConflict(strategy: ConflictResolution): Promise<SyncSuccess> {
      if (strategy === "fetch-server") {
        const serverData = await client.getServerVocab();
        repository.applyServerFile(serverData.file, serverData.serverRev, serverData.updatedAt);
        return {
          status: "success",
          serverRev: serverData.serverRev,
          updatedAt: serverData.updatedAt,
        };
      }

      const response = await client.forcePutVocab(clientId, repository.exportVocabFile());
      repository.markSynced(response.serverRev, response.updatedAt);

      return {
        status: "success",
        serverRev: response.serverRev,
        updatedAt: response.updatedAt,
      };
    },

    async initializeSyncFromServer(): Promise<void> {
      const serverData = await client.getServerVocab();
      repository.applyServerFile(serverData.file, serverData.serverRev, serverData.updatedAt);
    },
  };
}
