import type { StorageAdapter } from "./types";
import { createUnimplementedStoragePort } from "@leximemory/core/storage";
import { createAsyncStorageAdapter, type AsyncStorageDriver } from "./asyncStorageAdapter";
import { createSqliteStorageAdapter, type SqliteStorageDriver } from "./sqliteStorageAdapter";
import { webStorageAdapter } from "./webStorageAdapter";

export type StorageRuntime = "web" | "native" | "native-async" | "native-sqlite";

export interface StorageAdapterFactoryOptions {
  asyncStorageDriver?: AsyncStorageDriver;
  sqliteStorageDriver?: SqliteStorageDriver;
}

function resolveNativeAdapter(options: StorageAdapterFactoryOptions): StorageAdapter {
  if (options.asyncStorageDriver) {
    return createAsyncStorageAdapter(options.asyncStorageDriver);
  }

  if (options.sqliteStorageDriver) {
    return createSqliteStorageAdapter(options.sqliteStorageDriver);
  }

  return createUnimplementedStoragePort();
}

export function createStorageAdapter(
  runtime: StorageRuntime,
  options: StorageAdapterFactoryOptions = {},
): StorageAdapter {
  switch (runtime) {
    case "web":
      return webStorageAdapter;
    case "native":
      return resolveNativeAdapter(options);
    case "native-async":
      return options.asyncStorageDriver
        ? createAsyncStorageAdapter(options.asyncStorageDriver)
        : createUnimplementedStoragePort();
    case "native-sqlite":
      return options.sqliteStorageDriver
        ? createSqliteStorageAdapter(options.sqliteStorageDriver)
        : createUnimplementedStoragePort();
    default: {
      const exhaustiveCheck: never = runtime;
      return exhaustiveCheck;
    }
  }
}
