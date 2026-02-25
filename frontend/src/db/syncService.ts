/**
 * Sync service for offline-first vocabulary synchronization
 * 
 * Handles synchronization between local IndexedDB and remote server
 * with retry logic and error handling
 */

import type {
  VocabFile,
  VocabServerData,
  VocabSyncRequest,
  VocabForceSyncRequest,
  VocabSyncResponse,
  ConflictResolution,
} from "./types";
import { onlineStatusStore } from "../utils/onlineStatusStore";
import {
  getSyncMetadata,
  saveSyncMetadata,
  getVocabFile,
  saveVocabFile,
} from "./indexeddb";
import { api } from "../api/client";
import { storage } from "../core/storage";
import { SystemUtcClock, VocabBackupService } from "../core/sync/vocabBackupService";

/**
 * Retry configuration
 */
const vocabBackupService = new VocabBackupService(storage, new SystemUtcClock());

const RETRY_CONFIG = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 5000,
  backoffMultiplier: 2,
};

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry wrapper with exponential backoff
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  options = RETRY_CONFIG
): Promise<T> {
  let lastError: Error | null = null;
  let delay = options.initialDelayMs;

  for (let attempt = 0; attempt <= options.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: unknown) {
      lastError = error as Error;
      const err = error as { status?: number };

      // Don't retry on client errors (4xx except 429)
      if (err.status && err.status >= 400 && err.status < 500 && err.status !== 429) {
        throw error;
      }

      // Last attempt failed
      if (attempt === options.maxRetries) {
        break;
      }

      // Wait before retrying
      await sleep(delay);
      delay = Math.min(delay * options.backoffMultiplier, options.maxDelayMs);
    }
  }

  throw lastError || new Error("Retry failed");
}

/**
 * Sync status result
 */
export interface SyncStatus {
  online: boolean;
  dirty: boolean;
  lastSyncAt: string | null;
  clientId: string;
  serverRev: number;
}

/**
 * Sync result (success)
 */
export interface SyncSuccess {
  status: "success";
  serverRev: number;
  updatedAt: string;
}

/**
 * Sync result (conflict)
 */
export interface SyncConflict {
  status: "conflict";
  localFile: VocabFile;
  serverData: VocabServerData;
}

/**
 * Sync result (error)
 */
export interface SyncError {
  status: "error";
  code: string;
  message: string;
}

export type SyncResult = SyncSuccess | SyncConflict | SyncError;

/**
 * Get current sync status
 */
export async function getSyncStatus(): Promise<SyncStatus> {
  const metadata = await getSyncMetadata();
  
  if (!metadata) {
    throw new Error("Sync metadata not initialized");
  }

  return {
    online: onlineStatusStore.getOnlineStatus(),
    dirty: metadata.dirty,
    lastSyncAt: metadata.lastSyncAt,
    clientId: metadata.clientId,
    serverRev: metadata.serverRev,
  };
}

/**
 * Perform synchronization (normal mode) with retry
 */
export async function syncToServer(): Promise<SyncResult> {
  try {
    return await withRetry(async () => {
      const metadata = await getSyncMetadata();
      const file = await getVocabFile();

      if (!metadata || !file) {
        throw new Error("Database not initialized");
      }

      // Prepare sync request
      const request: VocabSyncRequest = {
        serverRev: metadata.serverRev,
        file,
        clientId: metadata.clientId,
      };

      // Send to server
      const response = await api.put<VocabSyncResponse>("/vocab", request);

      // Update metadata on success
      metadata.serverRev = response.serverRev;
      metadata.dirty = false;
      metadata.lastSyncAt = response.updatedAt;
      await saveSyncMetadata(metadata);

      return {
        status: "success",
        serverRev: response.serverRev,
        updatedAt: response.updatedAt,
      };
    });
  } catch (error: unknown) {
    // Handle 409 Conflict
    const err = error as { status?: number };
    if (err.status === 409) {
      try {
        const serverData = await api.get<VocabServerData>("/vocab");
        const localFile = await getVocabFile();

        if (!localFile) {
          throw new Error("Local file not found");
        }

        return {
          status: "conflict",
          localFile,
          serverData,
        };
      } catch (conflictError: unknown) {
        const conflictErr = conflictError as { code?: string; message?: string };
        return {
          status: "error",
          code: conflictErr.code || "CONFLICT_RESOLUTION_ERROR",
          message: conflictErr.message || "Failed to resolve conflict",
        };
      }
    }

    // Handle other errors
    const errObj = err as { code?: string; message?: string };
    return {
      status: "error",
      code: errObj.code || "SYNC_ERROR",
      message: errObj.message || "Sync failed",
    };
  }
}

/**
 * Fetch server version and overwrite local (with retry)
 */
export async function resolveConflictWithServer(): Promise<SyncSuccess> {
  return await withRetry(async () => {
    const serverData = await api.get<VocabServerData>("/vocab");
    const metadata = await getSyncMetadata();

    if (!metadata) {
      throw new Error("Metadata not initialized");
    }

    // Backup local file before overwriting
    const localFile = await getVocabFile();
    if (localFile) {
      await backupLocalFile(localFile);
    }

    // Replace local with server version
    await saveVocabFile(serverData.file);

    // Update metadata
    metadata.serverRev = serverData.serverRev;
    metadata.dirty = false;
    metadata.lastSyncAt = serverData.updatedAt;
    await saveSyncMetadata(metadata);

    return {
      status: "success",
      serverRev: serverData.serverRev,
      updatedAt: serverData.updatedAt,
    };
  });
}

/**
 * Force push local version to server (with retry)
 */
export async function resolveConflictWithLocal(): Promise<SyncSuccess> {
  return await withRetry(async () => {
    const metadata = await getSyncMetadata();
    const file = await getVocabFile();

    if (!metadata || !file) {
      throw new Error("Database not initialized");
    }

    // Prepare force sync request
    const request: VocabForceSyncRequest = {
      file,
      clientId: metadata.clientId,
    };

    // Send with force flag
    const response = await api.put<VocabSyncResponse>(
      "/vocab?force=true",
      request
    );

    // Update metadata
    metadata.serverRev = response.serverRev;
    metadata.dirty = false;
    metadata.lastSyncAt = response.updatedAt;
    await saveSyncMetadata(metadata);

    return {
      status: "success",
      serverRev: response.serverRev,
      updatedAt: response.updatedAt,
    };
  });
}

/**
 * Resolve conflict with chosen strategy
 */
export async function resolveConflict(
  strategy: ConflictResolution
): Promise<SyncSuccess> {
  if (strategy === "fetch-server") {
    return await resolveConflictWithServer();
  } else {
    return await resolveConflictWithLocal();
  }
}

/**
 * Backup local vocab snapshot through storage adapter
 */
async function backupLocalFile(file: VocabFile): Promise<void> {
  try {
    await vocabBackupService.backup(file);
  } catch (error) {
    console.error("Failed to backup local file:", error);
  }
}

/**
 * Initialize sync from server (first time)
 */
export async function initializeSyncFromServer(): Promise<void> {
  try {
    const serverData = await api.get<VocabServerData>("/vocab");
    const metadata = await getSyncMetadata();

    if (!metadata) {
      throw new Error("Metadata not initialized");
    }

    // Replace local with server version
    await saveVocabFile(serverData.file);

    // Update metadata
    metadata.serverRev = serverData.serverRev;
    metadata.dirty = false;
    metadata.lastSyncAt = serverData.updatedAt;
    await saveSyncMetadata(metadata);
  } catch (error: unknown) {
    // If 404, server has no data yet - keep local data
    const err = error as { status?: number };
    if (err.status === 404) {
      console.log("Server has no data yet, keeping local data");
      return;
    }
    throw error;
  }
}
