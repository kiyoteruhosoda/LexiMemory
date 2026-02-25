import { describe, expect, it, vi } from "vitest";
import type { AppData } from "../../api/types";
import { createBackupExportService } from "../../core/io/backupExportService";

describe("backupExportService", () => {
  it("builds UTC filename and delegates download", () => {
    const gateway = {
      downloadJsonFile: vi.fn(),
    };
    const clock = {
      nowIsoString: vi.fn().mockReturnValue("2026-02-25T12:00:00.000Z"),
    };
    const service = createBackupExportService(gateway, clock);
    const snapshot = { words: [], memory: {}, schemaVersion: 1 } as unknown as AppData;

    const filename = service.exportBackup(snapshot);

    expect(filename).toBe("linguisticnode-backup-2026-02-25T12:00:00.000Z.json");
    expect(gateway.downloadJsonFile).toHaveBeenCalledWith(filename, snapshot);
  });
});
