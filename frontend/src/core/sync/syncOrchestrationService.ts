import type { StorageAdapter } from "../storage";
import type { ConflictResolution } from "../../db/types";
import type { SyncConflict, SyncResult } from "./syncGateway";
import { SyncApplicationService } from "./syncApplicationService";

export type SyncExecutionContext = {
  readonly isAuthenticated: boolean;
  readonly isOnline: boolean;
};

export type SyncRequestOutcome =
  | { readonly status: "blocked-offline" }
  | { readonly status: "requires-auth" }
  | { readonly status: "success" }
  | { readonly status: "conflict"; readonly conflict: SyncConflict }
  | { readonly status: "error"; readonly code: string; readonly message: string };

export type ConflictResolutionOutcome =
  | { readonly status: "blocked-offline" }
  | { readonly status: "success" }
  | { readonly status: "error"; readonly message: string };

const PENDING_SYNC_KEY = "pendingSync";

export class SyncOrchestrationService {
  private readonly syncService: SyncApplicationService;
  private readonly storage: StorageAdapter;

  constructor(syncService: SyncApplicationService, storage: StorageAdapter) {
    this.syncService = syncService;
    this.storage = storage;
  }

  async consumePendingSyncIfReady(context: SyncExecutionContext): Promise<boolean> {
    if (!context.isAuthenticated || !context.isOnline) {
      return false;
    }

    const pending = await this.storage.get(PENDING_SYNC_KEY);
    if (pending !== "true") {
      return false;
    }

    await this.storage.remove(PENDING_SYNC_KEY);
    return true;
  }

  async requestSync(context: SyncExecutionContext): Promise<SyncRequestOutcome> {
    if (!context.isOnline) {
      return { status: "blocked-offline" };
    }

    if (!context.isAuthenticated) {
      await this.storage.set(PENDING_SYNC_KEY, "true");
      return { status: "requires-auth" };
    }

    const result = await this.syncService.sync();
    return this.mapSyncResult(result);
  }

  async resolveConflict(
    context: SyncExecutionContext,
    strategy: ConflictResolution
  ): Promise<ConflictResolutionOutcome> {
    if (!context.isOnline) {
      return { status: "blocked-offline" };
    }

    try {
      await this.syncService.resolve(strategy);
      return { status: "success" };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to resolve conflict";
      return { status: "error", message };
    }
  }

  private mapSyncResult(result: SyncResult): SyncRequestOutcome {
    if (result.status === "success") {
      return { status: "success" };
    }

    if (result.status === "conflict") {
      return { status: "conflict", conflict: result };
    }

    return {
      status: "error",
      code: result.code,
      message: result.message,
    };
  }
}
