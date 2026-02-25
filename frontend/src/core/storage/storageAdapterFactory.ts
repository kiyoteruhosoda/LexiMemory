import type { StorageAdapter } from "./types";
import { asyncStorageAdapterStub } from "./asyncStorageAdapter.stub";
import { webStorageAdapter } from "./webStorageAdapter";

export type StorageRuntime = "web" | "native";

const runtimeAdapterMap: Record<StorageRuntime, StorageAdapter> = {
  web: webStorageAdapter,
  native: asyncStorageAdapterStub,
};

export function createStorageAdapter(runtime: StorageRuntime): StorageAdapter {
  return runtimeAdapterMap[runtime];
}

