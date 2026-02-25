import { describe, expect, it, vi } from "vitest";
import { SyncOrchestrationService } from "../../core/sync/syncOrchestrationService";
import type { StorageAdapter } from "../../core/storage";
import type { SyncApplicationService } from "../../core/sync/syncApplicationService";

function createStorageMock(): StorageAdapter {
  return {
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
    keys: vi.fn(),
  };
}

function createSyncServiceMock(): SyncApplicationService {
  return {
    getStatus: vi.fn(),
    sync: vi.fn(),
    resolve: vi.fn(),
    initializeFromServer: vi.fn(),
  } as unknown as SyncApplicationService;
}

describe("SyncOrchestrationService", () => {
  it("stores pending flag when user is unauthenticated", async () => {
    const storage = createStorageMock();
    const syncService = createSyncServiceMock();
    const service = new SyncOrchestrationService(syncService, storage);

    const outcome = await service.requestSync({ isAuthenticated: false, isOnline: true });

    expect(outcome.status).toBe("requires-auth");
    expect(storage.set).toHaveBeenCalledWith("pendingSync", "true");
    expect(syncService.sync).not.toHaveBeenCalled();
  });

  it("consumes pending sync only when auth and network are both ready", async () => {
    const storage = createStorageMock();
    const syncService = createSyncServiceMock();
    vi.mocked(storage.get).mockResolvedValue("true");
    const service = new SyncOrchestrationService(syncService, storage);

    const consumed = await service.consumePendingSyncIfReady({ isAuthenticated: true, isOnline: true });

    expect(consumed).toBe(true);
    expect(storage.remove).toHaveBeenCalledWith("pendingSync");
  });

  it("returns conflict outcome transparently", async () => {
    const storage = createStorageMock();
    const syncService = createSyncServiceMock();
    vi.mocked(syncService.sync).mockResolvedValue({
      status: "conflict",
      localFile: { words: [], memory: [], updatedAt: "2026-01-01T00:00:00.000Z", schemaVersion: 1 },
      serverData: {
        file: { words: [], memory: [], updatedAt: "2026-01-01T00:00:00.000Z", schemaVersion: 1 },
        serverRev: 2,
        updatedAt: "2026-01-01T00:00:00.000Z",
        updatedByClientId: "client-1",
      },
    });
    const service = new SyncOrchestrationService(syncService, storage);

    const outcome = await service.requestSync({ isAuthenticated: true, isOnline: true });

    expect(outcome.status).toBe("conflict");
    if (outcome.status === "conflict") {
      expect(outcome.conflict.serverData.serverRev).toBe(2);
    }
  });
});
