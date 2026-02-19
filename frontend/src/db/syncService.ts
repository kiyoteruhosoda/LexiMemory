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
import {
  getSyncMetadata,
  saveSyncMetadata,
  getVocabFile,
  saveVocabFile,
} from "./indexeddb";
import { api } from "../api/client";

/**
 * Retry configuration
 */
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
    } catch (error: any) {
      lastError = error;

      // Don't retry on client errors (4xx except 429)
      if (error.status && error.status >= 400 && error.status < 500 && error.status !== 429) {
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
    online: navigator.onLine,
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
  } catch (error: any) {
    // Handle 409 Conflict
    if (error.status === 409) {
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
      } catch (conflictError: any) {
        return {
          status: "error",
          code: conflictError.code || "CONFLICT_RESOLUTION_ERROR",
          message: conflictError.message || "Failed to resolve conflict",
        };
      }
    }

    // Handle other errors
    return {
      status: "error",
      code: error.code || "SYNC_ERROR",
      message: error.message || "Sync failed",
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
 * Backup local file to localStorage (simple backup)
 */
async function backupLocalFile(file: VocabFile): Promise<void> {
  const timestamp = new Date().toISOString();
  const backupKey = `vocab_backup_${timestamp}`;
  
  try {
    localStorage.setItem(backupKey, JSON.stringify(file));
    
    // Keep only last 5 backups
    const backupKeys = Object.keys(localStorage).filter((k) =>
      k.startsWith("vocab_backup_")
    );
    if (backupKeys.length > 5) {
      backupKeys.sort();
      for (let i = 0; i < backupKeys.length - 5; i++) {
        localStorage.removeItem(backupKeys[i]);
      }
    }
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
  } catch (error: any) {
    // If 404, server has no data yet - keep local data
    if (error.status === 404) {
      console.log("Server has no data yet, keeping local data");
      return;
    }
    throw error;
  }
}
