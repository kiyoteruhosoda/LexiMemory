import type { FileDownloadGateway, UtcClock } from "../core/io/fileDownloadGateway";

export const browserFileDownloadGateway: FileDownloadGateway = {
  downloadJsonFile(filename: string, payload: unknown): void {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  },
};

export const systemUtcClock: UtcClock = {
  nowIsoString(): string {
    return new Date().toISOString();
  },
};
