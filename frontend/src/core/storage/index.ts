import { createStorageAdapter } from "./storageAdapterFactory";
import type { StorageAdapter } from "./types";

export const storage: StorageAdapter = createStorageAdapter("web");

export { createStorageAdapter };
export type { StorageAdapter };
export type { StorageRuntime } from "./storageAdapterFactory";
