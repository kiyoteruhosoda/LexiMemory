import { createBackupExportService } from "../core/io/backupExportService";
import { browserFileDownloadGateway, systemUtcClock } from "./browserFileDownloadGateway";

export const backupExportService = createBackupExportService(browserFileDownloadGateway, systemUtcClock);
