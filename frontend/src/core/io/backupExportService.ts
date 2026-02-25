import type { AppData } from "../../api/types";
import type { FileDownloadGateway, UtcClock } from "./fileDownloadGateway";

export function createBackupExportService(gateway: FileDownloadGateway, clock: UtcClock) {
  return {
    exportBackup(snapshot: AppData): string {
      const filename = `linguisticnode-backup-${clock.nowIsoString()}.json`;
      gateway.downloadJsonFile(filename, snapshot);
      return filename;
    },
  };
}

export type BackupExportService = ReturnType<typeof createBackupExportService>;
