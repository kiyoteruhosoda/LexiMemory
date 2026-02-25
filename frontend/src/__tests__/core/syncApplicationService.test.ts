import { describe, it, expect, vi } from "vitest";
import { SyncApplicationService } from "../../core/sync/syncApplicationService";
import type { SyncGateway } from "../../core/sync/syncGateway";

function createSyncGatewayMock(): SyncGateway {
  return {
    getSyncStatus: vi.fn(),
    syncToServer: vi.fn(),
    resolveConflict: vi.fn(),
    initializeSyncFromServer: vi.fn(),
  };
}

describe("SyncApplicationService", () => {
  it("delegates sync execution to gateway", async () => {
    const gateway = createSyncGatewayMock();
    vi.mocked(gateway.syncToServer).mockResolvedValue({
      status: "success",
      serverRev: 3,
      updatedAt: "2026-02-24T00:00:00Z",
    });

    const service = new SyncApplicationService(gateway);
    await expect(service.sync()).resolves.toEqual({
      status: "success",
      serverRev: 3,
      updatedAt: "2026-02-24T00:00:00Z",
    });
  });

  it("delegates conflict resolution strategy", async () => {
    const gateway = createSyncGatewayMock();
    vi.mocked(gateway.resolveConflict).mockResolvedValue({
      status: "success",
      serverRev: 4,
      updatedAt: "2026-02-24T00:00:01Z",
    });

    const service = new SyncApplicationService(gateway);
    await service.resolve("fetch-server");

    expect(gateway.resolveConflict).toHaveBeenCalledWith("fetch-server");
  });
});
