import { createStorageAdapter } from "./storageAdapterFactory";
import type { StorageAdapter } from "./types";

export const storage: StorageAdapter = createStorageAdapter("web");

export { createStorageAdapter };
export { createAsyncStorageAdapter, type AsyncStorageDriver } from "./asyncStorageAdapter";
export { createSqliteStorageAdapter, type SqliteStorageDriver } from "./sqliteStorageAdapter";
export type { StorageAdapter };
export type { StorageRuntime, StorageAdapterFactoryOptions } from "./storageAdapterFactory";
