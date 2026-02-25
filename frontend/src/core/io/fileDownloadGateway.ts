export interface FileDownloadGateway {
  downloadJsonFile(filename: string, payload: unknown): void;
}

export interface UtcClock {
  nowIsoString(): string;
}
